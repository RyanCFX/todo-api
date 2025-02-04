import { Group } from 'src/group/group.entity';
import { Status } from 'src/status/status.entity';
import { User } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid', { name: 'task_id' })
  taskId: string;

  @Column('varchar', { length: 500 })
  title: string;

  @Column('varchar', { length: 500 })
  description: string;

  @Column('char')
  status: string;

  @Column('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column('timestamp', { name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.createdTasks)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => Group, (group) => group.tasks)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @OneToMany(() => MedStatusTask, (med) => med.task)
  medStatusCode: MedStatusTask[];
}

@Entity('med_status_task')
export class MedStatusTask {
  @PrimaryGeneratedColumn('uuid', { name: 'med_id' })
  medId: string;

  @Column('char')
  status: string;

  @Column('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column('timestamp', { name: 'created_at' })
  createdAt: Date;

  @Column('timestamp', { name: 'end_at' })
  endAt: Date;

  @ManyToOne(() => Task, (task) => task.medStatusCode)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => Status, (status) => status.medTasks)
  @JoinColumn({ name: 'status_code' })
  statusCode: Status;

  @ManyToOne(() => User, (user) => user.statusTasks)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
