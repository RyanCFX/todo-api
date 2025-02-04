import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { AddTransactionProps } from './types';
import { User } from 'src/user/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllTransactions() {
    return await this.transactionRepository.find();
  }

  async addTransaction(transaction: AddTransactionProps) {
    const createdBy = await this.userRepository.findOne({
      where: { userId: transaction?.createdBy },
    });

    const data = await this.transactionRepository.save({
      createdAt: new Date(),
      dataIn: JSON.stringify(transaction.dataIn),
      ...transaction,
      userAgent: transaction.os,
      createdBy,
    });

    return data;
  }

  async closeTransaction(transactionId: string, dataOut: any) {
    this.transactionRepository.update(transactionId, {
      dataOut: JSON.stringify(dataOut),
    });

    return await this.transactionRepository.findOne({
      where: { transactionId },
    });
  }
}
