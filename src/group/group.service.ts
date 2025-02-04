import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionsService } from 'src/transaction/transactions.service';
import { Repository } from 'typeorm';
import { TransactionData } from 'src/interfaces/params';
import { Group, MedGroupUser } from './group.entity';
import { User } from 'src/user/user.entity';
import { AddGroupDto, AddUserGroupDto } from './group.dto';
import * as bcrypt from 'bcrypt';
import { generateRandomString } from 'src/utils/helpers';

@Injectable()
export class GroupService {
  constructor(
    private transactionService: TransactionsService,

    @InjectRepository(Group)
    private groupRepository: Repository<Group>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(MedGroupUser)
    private medGroupUserRepository: Repository<MedGroupUser>,
  ) {}

  // =====================================================
  // OBTENER TODOS LOS CULTIVOS
  // =====================================================
  async getGroups(transactionData: TransactionData) {
    try {
      const groups = await this.groupRepository
        .createQueryBuilder('g')
        .innerJoinAndSelect('g.medUsers', 'mu')
        .innerJoinAndSelect('g.createdBy', 'cb')
        .where('g.status = :status and mu.status = :status', { status: 'A' })
        .andWhere('mu.user_id = :userId', {
          userId: transactionData.user.userId,
        })
        .getMany();

      return groups.map((group) => ({
        groupId: group?.groupId,
        name: group?.name,
        groupCode: group?.groupCode,
        createdAt: group?.createdAt,
        canRemove: group?.createdBy?.userId === transactionData?.user?.userId,
      }));
    } catch (error) {
      throw {
        errors: ['Ha ocurrido un error inesperado, inténtelo mas tarde.'],
      };
    }
  }

  // =====================================================
  // OBTENER CULTIVO POR ID
  // =====================================================
  async getGroupById(groupId: string) {
    try {
      const groups = await this.groupRepository.findOne({
        where: {
          groupId,
          status: 'A',
        },
      });

      return groups;
    } catch (error) {
      throw {
        errors: ['Ha ocurrido un error inesperado, inténtelo mas tarde.'],
      };
    }
  }

  // =====================================================
  // AGREGAR CULTIVO
  // =====================================================
  async addGroup(values: AddGroupDto, transactionData: TransactionData) {
    const transaction = await this.transactionService.addTransaction({
      dataIn: { values },
      createdBy: transactionData?.user?.userId,
      os: transactionData?.userAgent,
      entity: 'GROUP.ADD_GROUP',
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

      if (values.password) {
        // HASHEAR CONTRASEÑA
        Object.assign(values, {
          password: bcrypt.hashSync(values.password, 10),
        });
      }

      const groupCode = await this.generateCode();

      const group = await this.groupRepository.save({
        ...values,
        createdBy,
        groupCode,
        transactionId: transaction.transactionId,
      });

      await this.medGroupUserRepository.save({
        user: createdBy,
        group,
        transactionId: transaction.transactionId,
      });

      this.transactionService.closeTransaction(transaction?.transactionId, {
        group,
      });

      return group;
    } catch (error) {
      this.transactionService.closeTransaction(
        transaction?.transactionId,
        error,
      );
      throw error;
    }
  }

  // =====================================================
  // AGREGAR USUARIO A GRUPO
  // =====================================================
  async addUserGroup(
    values: AddUserGroupDto,
    transactionData: TransactionData,
  ) {
    const transaction = await this.transactionService.addTransaction({
      dataIn: { values },
      createdBy: transactionData?.user?.userId,
      os: transactionData?.userAgent,
      entity: 'GROUP.ADD_USER_GROUP',
    });

    try {
      const user = await this.userRepository.findOne({
        where: {
          userId: transactionData.user.userId,
          status: 'A',
        },
      });

      if (!user) {
        throw {
          errors: [
            'No hemos encontrado su usuario, intente volver a iniciar sesión.',
          ],
          status: 400,
        };
      }

      const group = await this.groupRepository.findOne({
        where: {
          groupCode: values.groupCode.toUpperCase(),
          status: 'A',
        },
      });

      if (!group) {
        throw {
          errors: ['No hemos encontrado el grupo indicado, valide el código.'],
          status: 400,
        };
      }

      const existingRelation = await this.medGroupUserRepository.findOne({
        where: {
          user,
          group,
          status: 'A',
        },
      });

      if (existingRelation) {
        throw {
          errors: ['Ya pertenece a este grupo.'],
          status: 400,
        };
      }

      // COMPARAR CONTRASEÑAS
      if (
        group?.password &&
        !bcrypt.compareSync(values?.password, group?.password)
      ) {
        throw {
          errors: ['Contraseña incorrecta'],
          status: 400,
        };
      }

      await this.medGroupUserRepository.save({
        user,
        group,
        transactionId: transaction.transactionId,
      });

      this.transactionService.closeTransaction(transaction?.transactionId, {
        group,
      });

      return group;
    } catch (error) {
      this.transactionService.closeTransaction(
        transaction?.transactionId,
        error,
      );
      throw error;
    }
  }

  // =====================================================
  // GENERAR CODIGO DE GRUPO
  // =====================================================
  async generateCode() {
    const groupCode = generateRandomString(6);

    const existing = await this.groupRepository.findOne({
      where: {
        groupCode,
        status: 'A',
      },
    });

    if (existing) {
      return this.generateCode();
    }

    return groupCode;
  }

  // =====================================================
  // ELIMINAR CULTIVO
  // =====================================================
  async removeGroup(groupId: string, transactionData: TransactionData) {
    const transaction = await this.transactionService.addTransaction({
      dataIn: { groupId },
      createdBy: transactionData?.user?.userId,
      os: transactionData?.userAgent,
      entity: 'GROUP.REMOVE_GROUP',
    });

    try {
      const existingGroup = await this.groupRepository.findOne({
        where: {
          groupId,
          status: 'A',
        },
      });

      if (!existingGroup) {
        throw {
          errors: ['No hemos encontrado el aerodromo, inténtelo más tarde.'],
          status: 400,
        };
      }

      const group = await this.groupRepository.save({
        ...existingGroup,
        status: 'I',
      });

      this.transactionService.closeTransaction(transaction?.transactionId, {
        group,
      });
    } catch (error) {
      this.transactionService.closeTransaction(
        transaction?.transactionId,
        error,
      );
      throw error;
    }
  }
}
