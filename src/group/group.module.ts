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
import { Group, MedGroupUser } from './group.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      Transaction,
      ValidationCode,
      ValidationCodeType,
      Group,
      MedGroupUser,
    ]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [GroupController],
  providers: [
    TransactionsService,
    LocalStrategy,
    JwtStrategy,
    AuthService,
    GroupService,
  ],
})
export class GroupModule {}
