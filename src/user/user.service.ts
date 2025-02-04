import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionsService } from 'src/transaction/transactions.service';
import { Repository } from 'typeorm';
import { TransactionData } from 'src/interfaces/params';
import { User } from './user.entity';
import { AddUserDto, EditUserDto, GetUsersDto } from './user.dto';
import { generateString } from 'src/utils/helpers';

@Injectable()
export class UserService {
  constructor(
    private transactionService: TransactionsService,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // =====================================================
  // OBTENER TODOS LOS USUARIOS
  // =====================================================
  async getUsers(params: GetUsersDto) {
    try {
      const users = this.userRepository
        .createQueryBuilder('u')
        .innerJoinAndSelect('u.role', 'r');

      if (params?.roleId?.length) {
        users.andWhere('r.roleId in (:...roleId)', { roleId: params.roleId });
      }

      // if (params?.statusCode && params?.statusCode !== '*') {
      //   users.andWhere('sc.statusCode = :statusCode', {
      //     statusCode: params.statusCode,
      //   });
      // }

      return (await users.getMany())?.map((user) => ({
        ...user,
      }));
    } catch (error) {
      throw {
        errors: ['Ha ocurrido un error inesperado, inténtelo mas tarde.'],
      };
    }
  }

  // =====================================================
  // OBTENER UN USUARIO POR ID
  // =====================================================
  async getUserById(userId: string) {
    try {
      const user = this.userRepository
        .createQueryBuilder('u')
        .innerJoinAndSelect('u.role', 'r')
        .where('u.userId = :userId and u.status = :status', {
          userId,
          status: 'A',
        })
        .getOne();

      return user;
    } catch (error) {
      throw {
        errors: ['Ha ocurrido un error inesperado, inténtelo mas tarde.'],
      };
    }
  }

  // =====================================================
  // OBTENER UN USUARIO POR MAIL
  // =====================================================
  async getUserByMail(email: string) {
    try {
      const user = this.userRepository.findOne({
        where: {
          status: 'A',
          email,
        },
      });

      return user;
    } catch (error) {
      throw {
        errors: ['Ha ocurrido un error inesperado, inténtelo mas tarde.'],
      };
    }
  }

  // =====================================================
  // AGREGAR USUARIO
  // =====================================================
  async addUser(values: AddUserDto, transactionData: TransactionData) {
    const transaction = await this.transactionService.addTransaction({
      dataIn: { values },
      createdBy: transactionData?.user?.userId,
      os: transactionData?.userAgent,
      entity: 'USER.ADD_USER',
    });

    try {
      const existingUser = await this.userRepository
        .createQueryBuilder('user')
        .where('UPPER(user.email) = UPPER(:email)', {
          email: values.email,
        })
        .andWhere({
          status: 'A',
        })
        .getOne();

      if (!!existingUser) {
        throw {
          errors: [
            'Ya existe un usuario registrado con este correo o usuario.',
          ],
          status: 400,
        };
      }

      // GENERAR CONTRASEÑA
      const password = generateString();

      const user = await this.userRepository.save({
        ...values,
        transactionId: transaction.transactionId,
        password,
      });

      this.transactionService.closeTransaction(transaction?.transactionId, {
        user,
      });

      return user;
    } catch (error) {
      this.transactionService.closeTransaction(
        transaction?.transactionId,
        error,
      );
      throw error;
    }
  }

  // =====================================================
  // EDITAR USUARIO
  // =====================================================
  async editUser(
    userId: string,
    values: EditUserDto,
    transactionData: TransactionData,
  ) {
    const transaction = await this.transactionService.addTransaction({
      dataIn: { values },
      createdBy: transactionData?.user?.userId,
      os: transactionData?.userAgent,
      entity: 'USER.EDIT_USER',
    });

    try {
      const createdBy = await this.userRepository
        .createQueryBuilder('u')
        .innerJoinAndSelect('u.role', 'r')
        .where('u.status = :status and u.userId = :userId', {
          status: 'A',
          userId: transactionData.user.userId,
        })
        .getOne();

      if (!createdBy) {
        throw {
          errors: [
            'No hemos encontrado su usuario, intente volver a iniciar sesión.',
          ],
          status: 400,
        };
      }

      const existingUser = await this.userRepository.findOne({
        where: {
          userId,
          status: 'A',
        },
      });

      if (!existingUser) {
        throw {
          errors: ['No hemos encontrado el usuario.'],
          status: 400,
        };
      }
      // OBTENER ROL
      // const role = await this.roleRepository.findOne({
      //   where: {
      //     roleId: values.roleId,
      //   },
      // });
      const user = await this.userRepository.save({
        ...values,
        userId,
        // role,
        status: 'A',
      });

      this.transactionService.closeTransaction(transaction?.transactionId, {
        user,
      });

      return user;
    } catch (error) {
      console.log(error);

      this.transactionService.closeTransaction(
        transaction?.transactionId,
        error,
      );
      throw error;
    }
  }
}
