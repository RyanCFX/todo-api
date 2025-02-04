import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/transaction/transaction.entity';
import { User } from 'src/user/user.entity';
import { TransactionsService } from 'src/transaction/transactions.service';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { LocalStrategy } from 'src/auth/strategies/local.strategy';
import { AuthService } from 'src/auth/auth.service';
import { ValidationCode, ValidationCodeType } from 'src/auth/auth.entity';
import { jwtConfig } from 'src/utils/constants';
import { MedStatusTask, Task } from './task.entity';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { Group } from 'src/group/group.entity';
import { Status } from 'src/status/status.entity';
import { TodoGateway } from './task.socket';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      Transaction,
      ValidationCode,
      ValidationCodeType,
      Task,
      Group,
      MedStatusTask,
      Status,
    ]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [TaskController],
  providers: [
    TransactionsService,
    LocalStrategy,
    JwtStrategy,
    AuthService,
    TaskService,
    TodoGateway,
  ],
})
export class TaskModule {}
