import { Task } from 'src/task/task.entity';
import { User } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid', { name: 'group_id' })
  groupId: string;

  @Column('varchar', { length: 200 })
  name: string;

  @Column('varchar', { name: 'group_code', length: 500 })
  groupCode: string;

  @Column('varchar', { length: 500 })
  password: string;

  @Column('char')
  status: string;

  @Column('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column('timestamp', { name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.createdGroups)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToMany(() => MedGroupUser, (group) => group.group)
  medUsers: MedGroupUser[];

  @OneToMany(() => Task, (task) => task.group)
  tasks: Task[];
}

@Entity('med_group_users')
export class MedGroupUser {
  @PrimaryGeneratedColumn('uuid', { name: 'med_id' })
  medId: string;

  @Column('char')
  status: string;

  @Column('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column('timestamp', { name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.medGroups)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Group, (group) => group.medUsers)
  @JoinColumn({ name: 'group_id' })
  group: Group;
}
