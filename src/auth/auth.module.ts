import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/transaction/transaction.entity';
import { TransactionsService } from 'src/transaction/transactions.service';
import { ValidationCode, ValidationCodeType } from './auth.entity';
import { jwtConfig } from 'src/utils/constants';

import { User } from 'src/user/user.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      Transaction,
      ValidationCode,
      ValidationCodeType,
    ]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TransactionsService,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}
