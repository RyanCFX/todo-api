import { MedStatusTask } from 'src/task/task.entity';
import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';

@Entity('status')
export class Status {
  @PrimaryColumn('varchar', { name: 'status_code', length: 100 })
  statusCode: string;

  @Column({ type: 'varchar', length: 400 })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  color: string;

  @Column({ type: 'uuid', name: 'transaction_id' })
  transactionId: string;

  @Column({ name: 'status', type: 'char', default: 'A' })
  status: string;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => MedStatusTask, (med) => med.statusCode)
  medTasks: MedStatusTask[];
}
