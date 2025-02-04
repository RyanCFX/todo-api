import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { TransactionsService } from 'src/transaction/transactions.service';
import {
  ChangePasswordDto,
  SendValidationCodeDto,
  SigninDto,
  SignupDto,
} from './auth.dto';
import { ValidationCode, ValidationCodeType } from './auth.entity';
import { TransactionData } from 'src/interfaces/params';
import { User } from 'src/user/user.entity';
import mail from 'src/utils/mail';

@Injectable()
export class AuthService {
  constructor(
    private transactionService: TransactionsService,
    private jwtService: JwtService,

    @InjectRepository(ValidationCode)
    private validationCodeRepository: Repository<ValidationCode>,

    @InjectRepository(ValidationCodeType)
    private codeTypeRepository: Repository<ValidationCodeType>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // =====================================================
  // REGISTRARSE
  // =====================================================
  async signup(values: SignupDto, transactionData: Partial<TransactionData>) {
    const { transactionId } = await this.transactionService.addTransaction({
      dataIn: values,
      os: transactionData.userAgent,
      entity: 'AUTH.SINGUP',
    });

    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('UPPER(user.email) = UPPER(:email)', {
          email: values.email,
        })
        .andWhere({
          status: 'A',
        })
        .getOne();

      // VALIDAR QUE EL USUARIO NO ESTÉ USADO
      if (user) {
        throw {
          errors: [
            'Ya existe un usuario registrado con este correo o usuario.',
          ],
          status: 400,
        };
      }

      // HASHEAR CONTRASEÑA
      Object.assign(values, { password: bcrypt.hashSync(values.password, 10) });

      const data = await this.userRepository.save({
        ...values,
        transactionId,
      });

      const { password, ...formatedUser } = data;

      this.transactionService.closeTransaction(transactionId, { formatedUser });

      return {
        user: formatedUser,
        token: this.jwtService.sign({
          password,
          email: user?.email,
          userId: user?.userId,
        }),
      };
    } catch (error) {
      console.log(error);

      this.transactionService.closeTransaction(transactionId, error);
      throw error;
    }
  }

  // =====================================================
  // INICIAR SESION
  // =====================================================
  async signin(values: SigninDto) {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('UPPER(user.email) = UPPER(:email)', {
          email: values.email,
        })
        .andWhere('user.status = :status', { status: 'A' })
        .getOne();

      // VALIDAR QUE EL USUARIO EXISTE
      if (!user) {
        throw {
          errors: ['Usuario o contraseña incorrectac'],
          status: 401,
        };
      }

      // COMPARAR CONTRASEÑAS
      if (!bcrypt.compareSync(values?.password, user?.password)) {
        throw {
          errors: ['Usuario o contraseña incorrecta'],
          status: 400,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...formatedUser } = user;
      return {
        user: formatedUser,
        token: this.jwtService.sign({
          password,
          email: user?.email,
          userId: user?.userId,
        }),
      };
    } catch (error) {
      console.log(error);
    }
  }

  // =====================================================
  // OBTENER SESION DE USUARIO
  // =====================================================
  async getSession(userId: string) {
    const user = await this.userRepository.findOne({
      where: {
        userId,
      },
    });

    // VALIDAR QUE EL USUARIO EXISTE
    if (!user) {
      throw {
        errors: ['No hemos encontrado al usuario'],
        status: 401,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...formatedUser } = user;

    return {
      user: formatedUser,
      token: this.jwtService.sign({
        password,
        email: user?.email,
        userId: user?.userId,
      }),
    };
  }

  // =====================================================
  // OBTENER DATOS DE UN USUARIO
  // =====================================================
  async getUserById(userId: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.role', 'role')
      .where('user.userId = :userId', { userId })
      .select(['role.role_code', 'user'])
      .getOne();
    // console.log(user);

    // const user = await this.userRepository.findOne({
    //   where: {
    //     userId,
    //   },
    // });

    // VALIDAR QUE EL USUARIO EXISTE
    if (!user) {
      throw {
        errors: ['No hemos encontrado al usuario'],
        status: 401,
      };
    }

    delete user.password;

    return user;
  }

  async verifyToken(token: string) {
    return this.jwtService.verify(token);
  }
  // =====================================================
  // ENVIAR CODIGO DE VALIDACIÓN
  // =====================================================
  async sendValidationCode(
    data: SendValidationCodeDto,
    userAgent: string,
    ip: string,
    codeType: string,
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where({
        email: data?.email,
      })
      .andWhere('user.status in (:...status)', {
        status: ['A', 'P'],
      })
      .getOne();

    const { transactionId } = await this.transactionService.addTransaction({
      dataIn: { data, os: userAgent },
      createdBy: user?.userId,
      os: userAgent,
      entity: 'AUTH.SEND_VALIDATION_CODE',
    });

    try {
      // VALIDAR QUE EL USUARIO EXISTE
      if (!user) {
        throw {
          errors: ['No hemos encontrado al usuario.'],
          status: 400,
        };
      }

      // VALIDAR EL TELÉFONO DEL USUARIO
      // if (!user.phone) {
      //   throw {
      //     errors: ['No hemos encontrado el teléfono del usuario.'],
      //     status: 400,
      //   };
      // }

      const type = await this.codeTypeRepository.findOne({
        where: {
          codeType: codeType as 'RESTORE_PASSWORD' | 'SIGNUP',
        },
      });

      if (!type) {
        throw {
          errors: ['Ha ocurrido un error inesperado.'],
          status: 400,
        };
      }

      const validationCode = await this.validationCodeRepository.findOne({
        where: {
          userId: user?.userId,
          statusCode: 'PENDING',
        },
      });

      // EXPIRAR CÓDIGO EXISTENTE
      if (validationCode) {
        await this.validationCodeRepository.save({
          ...validationCode,
          statusCode: 'EXPIRED',
        });
      }

      const code = Math.floor(1000 + Math.random() * 9000).toString();

      await mail.post(
        'smtp/email',
        {
          sender: {
            name: 'TO DO',
            email: 'ing.castrof06@gmail.com',
          },
          to: [
            {
              email: user.email,
              name: `${user.name} ${user.lastname}`,
            },
          ],
          subject: 'Validar codigo',
          htmlContent: `<html><head></head><body>
          <hr>
          <p>Código: ${code}</p>
          <hr>
          </body></html>`,
        },
        {
          headers: {
            'api-key': process.env.MAIL_API_KEY,
          },
        },
      );

      await this.validationCodeRepository.save({
        code,
        userId: user?.userId,
        transactionId,
        createdAt: new Date(),
        statusCode: 'PENDING',
        ip,
        codeType,
        userAgent,
      });

      return { data: user.userId };
    } catch (error) {
      this.transactionService.closeTransaction(transactionId, error);
      throw error;
    }
  }

  // =====================================================
  // VALIDAR CÓDIGO
  // =====================================================
  async validateCode(
    email: string,
    code: string,
    userAgent: string,
    ip: string,
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where({
        email,
        // status: 'A',
      })
      .getOne();

    // VALIDAR QUE EL USUARIO EXISTE
    if (!user) {
      throw {
        errors: ['No hemos encontrado al usuario.'],
        status: 400,
      };
    }

    const { transactionId } = await this.transactionService.addTransaction({
      dataIn: { email, code, os: userAgent },
      createdBy: user.userId,
      os: userAgent,
      entity: 'AUTH.VALIDATE_CODE',
    });

    try {
      const validationCode = await this.validationCodeRepository.findOne({
        where: {
          userId: user.userId,
          statusCode: 'PENDING',
        },
      });

      // VALIDAR QUE EL CODIGO SIGA VIGENTE
      if (
        !validationCode ||
        (validationCode.userAgent !== userAgent && validationCode.ip !== ip)
      ) {
        throw {
          errors: ['Código de validación incorrecto.'],
          status: 400,
        };
      }

      if (validationCode?.retriesTotal >= 3) {
        throw {
          errors: ['Has excedido el número máximo de reintentos.'],
          status: 400,
        };
      }

      if (validationCode?.retriesTotal == 2) {
        await this.validationCodeRepository.save({
          ...validationCode,
          statusCode: 'EXPIRED',
        });
      }

      await this.validationCodeRepository.save({
        ...validationCode,
        retriesTotal: validationCode?.retriesTotal + 1,
      });

      if (validationCode?.code?.toString() !== code?.toString()) {
        throw {
          errors: ['Código de validación incorrecto.'],
          status: 400,
        };
      }

      await this.validationCodeRepository.save({
        ...validationCode,
        statusCode: 'VALIDATED',
        validatedAt: new Date(),
      });

      return user;
    } catch (error) {
      this.transactionService.closeTransaction(transactionId, error);
      throw error;
    }
  }

  // =====================================================
  // RESTRAURAR CONTRASEÑA
  // =====================================================
  async restorePassword(
    userId: string,
    password: string,
    userAgent: string,
    ip: string,
  ) {
    const { transactionId } = await this.transactionService.addTransaction({
      dataIn: { userId, userAgent, ip },
      createdBy: userId,
      os: userAgent,
      entity: 'AUTH.RESTORE_PASSWORD',
    });

    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where({
          userId,
          status: 'A',
        })
        .getOne();

      // VALIDAR QUE EL USUARIO EXISTE
      if (!user) {
        throw {
          errors: ['No hemos encontrado al usuario.'],
          status: 400,
        };
      }

      const validationCode = await this.validationCodeRepository.findOne({
        where: {
          userId,
          statusCode: 'VALIDATED',
        },
      });

      // VALIDAR QUE HAYA VALIDADO UN CÓDIGO ANTERIORMENTE
      if (!validationCode || validationCode.ip !== ip) {
        throw {
          errors: [
            'Ha ocurrido un error al momento de autenticar su usuario, intente volver a envíar un código de validación.',
          ],
          status: 400,
        };
      }

      // VALIDAR QUE ESTÉ ENVIANDO LA PETICION DESDE EL MISMO DISPOSITIVO QUE ENVIÓ EL CÓDIGO
      if (validationCode.userAgent !== userAgent) {
        await this.userRepository.save({
          ...user,
          status: 'E',
        });
        throw {
          errors: [
            'Ha ocurrido un error al momento de autenticar su usuario, contáctese con soporte de servicios.',
          ],
          status: 400,
          data: {
            reason:
              'Se ha intentado restaurar la contraseña de forma fraudulenta.',
          },
        };
      }

      const data = await this.userRepository.save({
        ...user,
        password: bcrypt.hashSync(password, 10),
      });

      delete data.password;

      return data;
    } catch (error) {
      this.transactionService.closeTransaction(transactionId, error);
      throw error;
    }
  }

  // =====================================================
  // VALIDAR CÓDIGO AL MOMENTO DE REGISTRASE UN USUARIO
  // =====================================================
  async validateSignupCode(code: string, transactionData: TransactionData) {
    const { transactionId } = await this.transactionService.addTransaction({
      dataIn: { userId: transactionData.user.userId, code },
      createdBy: transactionData.user.userId,
      os: transactionData.userAgent,
      entity: 'AUTH.VALIDATE_SIGNUP_CODE',
    });

    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.status in (:...status)', {
          status: ['A', 'P'],
        })
        .where({
          userId: transactionData.user.userId,
        })
        .getOne();

      console.log(user);

      // VALIDAR QUE EL USUARIO EXISTE
      if (!user) {
        throw {
          errors: ['No hemos encontrado al usuario.'],
          status: 400,
        };
      }

      if (user.status === 'A') {
        throw {
          errors: ['Su usuario ya está activo.'],
          status: 400,
        };
      }

      const validationCode = await this.validationCodeRepository.findOne({
        where: {
          userId: transactionData.user.userId,
          statusCode: 'PENDING',
        },
      });

      // VALIDAR QUE EL CODIGO SIGA VIGENTE
      if (!validationCode) {
        throw {
          errors: ['Código de validación incorrecto.'],
          status: 400,
        };
      }

      if (validationCode?.retriesTotal >= 2) {
        await this.validationCodeRepository.save({
          ...validationCode,
          statusCode: 'EXPIRED',
        });
      }

      if (validationCode?.retriesTotal >= 2) {
        throw {
          errors: ['Has excedido el número máximo de reintentos.'],
          status: 400,
        };
      }

      await this.validationCodeRepository.save({
        ...validationCode,
        retriesTotal: validationCode?.retriesTotal + 1,
      });

      if (validationCode?.code?.toString() !== code?.toString()) {
        throw {
          errors: ['Código de validación incorrecto.'],
          status: 400,
        };
      }

      await this.validationCodeRepository.save({
        ...validationCode,
        statusCode: 'VALIDATED',
        validatedAt: new Date(),
      });

      return await this.userRepository.save({
        ...user,
        status: 'A',
      });
    } catch (error) {
      this.transactionService.closeTransaction(transactionId, error);
      throw error;
    }
  }
  // =====================================================
  // CAMBIAR CONTRASEÑA
  // =====================================================
  async changePassword(
    values: ChangePasswordDto,
    transactionData: TransactionData,
  ) {
    const { transactionId } = await this.transactionService.addTransaction({
      dataIn: { values },
      createdBy: transactionData.user.userId,
      os: transactionData.userAgent,
      entity: 'AUTH.CHANGE_PASSWORD',
    });

    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where({
          userId: transactionData.user.userId,
          status: 'A',
        })
        .getOne();

      // VALIDAR QUE EL USUARIO EXISTE
      if (!user) {
        throw {
          errors: ['No hemos encontrado al usuario.'],
          status: 400,
        };
      }

      if (!!bcrypt.compareSync(values?.newPassword, user?.password)) {
        throw {
          errors: ['La contraseña no puede ser igual a la anterior.'],
          status: 400,
        };
      }

      // COMPARAR CONTRASEÑAS
      if (!bcrypt.compareSync(values?.currentPassword, user?.password)) {
        throw {
          errors: ['Contraseña incorrecta'],
          status: 400,
        };
      }

      const data = await this.userRepository.save({
        ...user,
        password: bcrypt.hashSync(values.newPassword, 10),
      });

      delete data.password;

      return data;
    } catch (error) {
      this.transactionService.closeTransaction(transactionId, error);
      throw error;
    }
  }


  async validateUser(email: string) {
    const data = await this.userRepository
      .createQueryBuilder('user')
      .where('UPPER(user.email) = UPPER(:email)', {
        email,
        status: 'A',
      })
      .getOne();

    // VALIDAR QUE EL USUARIO EXISTE
    if (!data) {
      return {
        errors: ['Usuario o contraseña incorrecta'],
        status: 404,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = data;

    return this.jwtService.sign(user);
  }

}
