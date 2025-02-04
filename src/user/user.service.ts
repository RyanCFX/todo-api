import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionsService } from 'src/transaction/transactions.service';
import { Repository } from 'typeorm';
import { TransactionData } from 'src/interfaces/params';
import { User } from './user.entity';
import { AddUserDto, EditUserDto, GetUsersDto } from './user.dto';
import { generateString } from 'src/utils/helpers';
import { ABB_MONTHS } from 'src/utils/constants';
import { ROLE } from 'src/constants';

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
  // OBTENER ESTADISTICAS ANUALES DE USUARIOS
  // =====================================================
  async getAnnualUserCreation(roleId?: string) {
    const year = new Date().getFullYear();

    const pre = this.userRepository
      .createQueryBuilder('user')
      .where('EXTRACT(YEAR FROM user.createdAt) = :year', { year });

    if (roleId) {
      pre.where('user.role_id = :roleId', { roleId });
    }
    const users = await pre.getMany();

    const monthlyCount = Array(12).fill(0);

    for (const user of users) {
      const month = user.createdAt.getMonth(); // 0-indexed
      monthlyCount[month]++;
    }

    const total = monthlyCount.reduce((sum, count) => sum + count, 0);

    return {
      data: {
        series: [{ name: 'Usuarios', data: monthlyCount }],
        date: ABB_MONTHS,
      },
      total,
    };
  }

  // =====================================================
  // OBTENER ESTADISTICAS MENSUALES DE USUARIOS
  // =====================================================
  async getMonthlyUserCreation(roleId?: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // Mes actual (1-12)
    const currentDay = now.getDate(); // Día actual

    const year = new Date().getFullYear();

    const pre = this.userRepository
      .createQueryBuilder('user')
      .where('"user".created_at IS NOT NULL')
      .andWhere('EXTRACT(YEAR FROM "user".created_at) = :year', {
        year: currentYear,
      })
      .andWhere('EXTRACT(MONTH FROM "user".created_at) = :month', {
        month: currentMonth,
      });

    if (roleId) {
      pre.where('user.role_id = :roleId', { roleId });
    }
    const users = await pre.getMany();

    // Inicializar datos
    const daysInMonth = Array.from({ length: currentDay }, (_, i) => i + 1); // Días del 1 al día actual
    const dailyUserss = Array(currentDay).fill(0);
    const date: string[] = daysInMonth.map((day) => {
      const dayFormatted = String(day).padStart(2, '0');
      const monthName = now.toLocaleString('default', { month: 'short' });
      return `${dayFormatted} ${monthName}`;
    });

    // Calcular el total de alquileres diarios basados en startAt
    for (const user of users) {
      const createdDay = user.createdAt.getDate(); // Obtener el día de startAt
      if (createdDay >= 1 && createdDay <= currentDay) {
        dailyUserss[createdDay - 1] += 1; // Incrementar el contador del día correspondiente
      }
    }

    // Calcular el total de alquileres
    const total = dailyUserss.reduce((acc, curr) => acc + curr, 0);

    return {
      data: {
        series: [{ name: 'Usuarios', data: dailyUserss }],
        date,
      },
      total,
    };
  }

  // =====================================================
  // OBTENER ESTADISTICAS SEMANALES DE USUARIOS
  // =====================================================
  async getWeeklyUserCreation(roleId?: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // Mes actual (1-12)

    const pre = this.userRepository
      .createQueryBuilder('user')
      .where('EXTRACT(YEAR FROM user.createdAt) = :year', { year: currentYear })
      .andWhere('EXTRACT(MONTH FROM user.createdAt) = :month', {
        month: currentMonth,
      });

    if (roleId) {
      pre.where('user.role_id = :roleId', { roleId });
    }
    const users = await pre.getMany();

    const today = new Date();
    const currentDayOfWeek = today.getDay(); // Día de la semana (0 = Domingo, 6 = Sábado)
    const monday = new Date(today); // Comenzar en el lunes de la semana actual
    monday.setDate(today.getDate() - ((currentDayOfWeek + 6) % 7)); // Ajustar para que sea lunes
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // Ajustar para que sea domingo

    const daysOfWeek = [];
    const date = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      daysOfWeek.push(day);
      date.push(
        day.toLocaleDateString('default', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        }),
      );
    }

    // Inicializar el contador de alquileres por día
    const weeklyCount = Array(7).fill(0);

    for (const user of users) {
      // Calcular el índice del día de la semana basado en startAt
      const userDay = user.createdAt.getDay();
      const index = (userDay + 6) % 7; // Ajustar índice para que lunes sea 0
      if (index >= 0 && index < 7) {
        weeklyCount[index]++;
      }
    }

    // Calcular el total de alquileres
    const total = weeklyCount.reduce((sum, count) => sum + count, 0);
    return {
      data: {
        series: [{ name: 'Usuarios', data: weeklyCount }],
        date,
      },
      total,
    };
  }

  async getClientCounts() {
    return {
      annualy: await this.getAnnualUserCreation(ROLE.CLIENT),
      monthly: await this.getMonthlyUserCreation(ROLE.CLIENT),
      weekly: await this.getWeeklyUserCreation(ROLE.CLIENT),
    };
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
