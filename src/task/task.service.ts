import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionsService } from 'src/transaction/transactions.service';
import { Repository } from 'typeorm';
import { TransactionData } from 'src/interfaces/params';
import { MedStatusTask, Task } from './task.entity';
import { User } from 'src/user/user.entity';
import { AddTaskDto, ChangeTaskStatusDto } from './task.dto';
import { loadDefaultData } from 'src/utils/helpers';
import { Group } from 'src/group/group.entity';
import { Status } from 'src/status/status.entity';

@Injectable()
export class TaskService {
  constructor(
    private transactionService: TransactionsService,

    @InjectRepository(Task)
    private taskRepository: Repository<Task>,

    @InjectRepository(Group)
    private groupRepository: Repository<Group>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(MedStatusTask)
    private medStatusRepository: Repository<MedStatusTask>,

    @InjectRepository(Status)
    private statusRepository: Repository<Status>,
  ) {}

  // =====================================================
  // OBTENER TODOS LOS CULTIVOS
  // =====================================================
  async getTasks(groupId: string) {
    try {
      const group = await this.groupRepository
        .createQueryBuilder('g')
        .innerJoinAndSelect('g.tasks', 't')
        .innerJoinAndSelect('t.createdBy', 'cb')
        .innerJoinAndSelect('t.medStatusCode', 'msc')
        .innerJoinAndSelect('msc.statusCode', 'sc')
        .where(
          't.status = :status and cb.status = :status and msc.status = :status',
          { status: 'A' },
        )
        .andWhere('msc.endAt is null and t.group_id = :groupId', { groupId })
        .getOne();

      return (group?.tasks || []).map((task) => ({
        taskId: task.taskId,
        title: task.title,
        description: task.description,
        createdAt: task.createdAt,
        createdBy: task.createdBy,
        status: task.medStatusCode[0].statusCode,
      }));
    } catch (error) {
      console.log(error);

      throw {
        errors: ['Ha ocurrido un error inesperado, inténtelo mas tarde.'],
      };
    }
  }

  // =====================================================
  // OBTENER TAREA POR ID
  // =====================================================
  async getTaskById(taskId: string) {
    try {
      const task = await this.taskRepository
        .createQueryBuilder('t')
        .innerJoinAndSelect('t.group', 'g')
        .innerJoinAndSelect('t.createdBy', 'cb')
        .innerJoinAndSelect('t.medStatusCode', 'msc')
        .innerJoinAndSelect('msc.statusCode', 'sc')
        .where(
          't.status = :status and cb.status = :status and msc.status = :status',
          { status: 'A' },
        )
        .andWhere('msc.endAt is null and t.taskId = :taskId', { taskId })
        .getOne();

      return {
        taskId: task.taskId,
        title: task.title,
        description: task.description,
        createdAt: task.createdAt,
        createdBy: task.createdBy,
        status: task.medStatusCode[0].statusCode,
        group: task.group,
      };
    } catch (error) {
      throw {
        errors: ['Ha ocurrido un error inesperado, inténtelo mas tarde.'],
      };
    }
  }

  // =====================================================
  // AGREGAR CULTIVO
  // =====================================================
  async addTask(values: AddTaskDto, transactionData: TransactionData) {
    const transaction = await this.transactionService.addTransaction({
      dataIn: { values },
      createdBy: transactionData?.user?.userId,
      os: transactionData?.userAgent,
      entity: 'TASK.ADD_TASK',
    });

    try {
      const createdBy = await this.userRepository.findOne({
        where: {
          userId: transactionData.user.userId,
          status: 'A',
        },
      });

      if (!createdBy) {
        throw {
          errors: [
            'No hemos encontrado su usuario, intente volver a iniciar sesión.',
          ],
          status: 400,
        };
      }

      const group = await this.groupRepository.findOne({
        where: {
          groupId: values.groupId,
          status: 'A',
        },
      });

      if (!group) {
        throw {
          errors: ['No hemos encontrado el grupo actual, intentelo mas tarde.'],
          status: 400,
        };
      }

      const task = await this.taskRepository.save({
        createdBy,
        transactionId: transaction.transactionId,
        title: values.title,
        description: values.description,
        group,
      });

      const statusCode = await this.statusRepository.findOne({
        where: {
          statusCode: 'NEW',
        },
      });

      await this.medStatusRepository.save({
        transactionId: transaction.transactionId,
        task,
        statusCode,
        createdBy,
      });

      this.transactionService.closeTransaction(transaction?.transactionId, {
        task,
      });
      return {
        ...task,
        status: statusCode,
      };
    } catch (error) {
      this.transactionService.closeTransaction(
        transaction?.transactionId,
        error,
      );
      throw error;
    }
  }

  // =====================================================
  // ACTUALIZAR ESTADO DE TAREA
  // =====================================================
  async changeStatus(
    values: ChangeTaskStatusDto,
    transactionData: TransactionData,
  ) {
    const transaction = await this.transactionService.addTransaction({
      dataIn: { values },
      createdBy: transactionData?.user?.userId,
      os: transactionData?.userAgent,
      entity: 'TASK.CHANGE_TASK_STATUS',
    });

    try {
      const createdBy = await this.userRepository.findOne({
        where: {
          userId: transactionData.user.userId,
          status: 'A',
        },
      });

      if (!createdBy) {
        throw {
          errors: [
            'No hemos encontrado su usuario, intente volver a iniciar sesión.',
          ],
          status: 400,
        };
      }

      const task = await this.taskRepository
        .createQueryBuilder('t')
        .innerJoinAndSelect('t.medStatusCode', 'msc')
        .where('msc.endAt is null and t.taskId = :taskId', {
          taskId: values.taskId,
          status: 'A',
        })
        .andWhere('msc.status = :status and t.status = :status', {
          status: 'A',
        })
        .getOne();

      if (!task) {
        throw {
          errors: ['No hemos encontrado la tarea, inténtelo más tarde.'],
          status: 400,
        };
      }

      await this.medStatusRepository.save({
        ...task.medStatusCode[0],
        endAt: new Date(),
      });

      const statusCode = await this.statusRepository.findOne({
        where: {
          statusCode: values.statusCode,
          status: 'A',
        },
      });

      if (!statusCode) {
        throw {
          errors: ['Ha ocurrido un error inesperado, contacte a soporte.'],
          status: 400,
        };
      }

      const newStatus = await this.medStatusRepository.save({
        transactionId: transaction.transactionId,
        task,
        statusCode,
        createdBy,
      });

      this.transactionService.closeTransaction(transaction?.transactionId, {
        newStatus,
      });

      return await this.getTaskById(task.taskId);
    } catch (error) {
      this.transactionService.closeTransaction(
        transaction?.transactionId,
        error,
      );
      throw error;
    }
  }

  // =====================================================
  // ACTUALIZAR CULTIVO
  // =====================================================
  async updateTask(
    taskId: string,
    values: AddTaskDto,
    transactionData: TransactionData,
  ) {
    const transaction = await this.transactionService.addTransaction({
      dataIn: { taskId, ...values },
      createdBy: transactionData?.user?.userId,
      os: transactionData?.userAgent,
      entity: 'TASK.UPDATE_TASK',
    });

    try {
      const existingTask = await this.taskRepository.findOne({
        where: {
          taskId,
          status: 'A',
        },
      });

      if (!existingTask) {
        throw {
          errors: ['No hemos encontrado el aerodromo, inténtelo más tarde.'],
          status: 400,
        };
      }

      const task = await this.taskRepository.save({
        ...existingTask,
        ...loadDefaultData(existingTask, {
          title: values?.title,
          description: values?.description,
        }),
      });

      this.transactionService.closeTransaction(transaction?.transactionId, {
        task,
      });
    } catch (error) {
      this.transactionService.closeTransaction(
        transaction?.transactionId,
        error,
      );
      throw error;
    }
  }

  // =====================================================
  // ELIMINAR CULTIVO
  // =====================================================
  async removeTask(taskId: string, transactionData: TransactionData) {
    const transaction = await this.transactionService.addTransaction({
      dataIn: { taskId },
      createdBy: transactionData?.user?.userId,
      os: transactionData?.userAgent,
      entity: 'TASK.REMOVE_TASK',
    });

    try {
      const existingTask = await this.taskRepository
        .createQueryBuilder('t')
        .innerJoinAndSelect('t.group', 'g')
        .where('t.taskId = :taskId and t.status = :status', {
          taskId,
          status: 'A',
        })
        .getOne();

      if (!existingTask) {
        throw {
          errors: ['No hemos encontrado la tarea, inténtelo más tarde.'],
          status: 400,
        };
      }

      const task = await this.taskRepository.save({
        ...existingTask,
        status: 'I',
      });

      this.transactionService.closeTransaction(transaction?.transactionId, {
        task,
      });

      return { ...existingTask };
    } catch (error) {
      this.transactionService.closeTransaction(
        transaction?.transactionId,
        error,
      );
      throw error;
    }
  }
}
