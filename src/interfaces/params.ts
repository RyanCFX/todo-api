import { User } from 'src/user/user.entity';

export interface TransactionData {
  userAgent: string;
  ip: string;
  user: User;
  transactionId?: string;
}
