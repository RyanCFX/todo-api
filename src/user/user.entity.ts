// MODULOS DE TERCEROS
import { Group, MedGroupUser } from 'src/group/group.entity';
import { MedStatusTask, Task } from 'src/task/task.entity';
import { Transaction } from 'src/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
@Index('idx_users_user_id', ['userId'])
@Index('idx_users_created_at', ['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'email', type: 'varchar', length: 100 })
  email: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'lastname', type: 'varchar', length: 100 })
  lastname: string;

  @Column({ name: 'status', type: 'char' })
  status: string;

  @Column({ name: 'transaction_id', type: 'varchar', nullable: true })
  transactionId: string;

  @Column({ name: 'password', type: 'varchar', length: 200 })
  password: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.createdBy)
  transactions: Transaction[];

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  @OneToMany(() => Group, (group) => group.createdBy)
  createdGroups: Group[];

  @OneToMany(() => MedGroupUser, (group) => group.user)
  medGroups: MedGroupUser[];

  @OneToMany(() => MedStatusTask, (med) => med.createdBy)
  statusTasks: MedStatusTask[];
}
