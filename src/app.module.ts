import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { Transaction } from './transaction/transaction.entity';
import { ValidationCode, ValidationCodeType } from './auth/auth.entity';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { Status } from './status/status.entity';
import { StatusModule } from './status/status.module';
import { MedStatusTask, Task } from './task/task.entity';
import { TaskModule } from './task/task.module';
import { GroupModule } from './group/group.module';
import { Group, MedGroupUser } from './group/group.entity';
import { TodoGateway } from './task/task.socket';
import { ConfigModule } from '@nestjs/config';

const entities = [
  User,
  Transaction,
  ValidationCode,
  ValidationCodeType,
  Status,
  Task,
  Group,
  MedGroupUser,
  MedStatusTask,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Permite acceder a process.env desde cualquier módulo
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities,
      synchronize: false,
      logging: true,
      ssl: true,
    }),
    UserModule,
    AuthModule,
    StatusModule,
    TaskModule,
    GroupModule,
  ],
  controllers: [],
  providers: [TodoGateway],
})
export class AppModule {}
