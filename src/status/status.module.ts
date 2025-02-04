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
import { Status } from './status.entity';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      Transaction,
      ValidationCode,
      ValidationCodeType,
      Status,
      Status,
    ]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [StatusController],
  providers: [
    TransactionsService,
    LocalStrategy,
    JwtStrategy,
    AuthService,
    StatusService,
  ],
})
export class StatusModule {}
