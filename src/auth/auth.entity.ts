// MODULOS DE TERCEROS
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity('validation_codes')
@Index('idx_validation_codes_code_id', ['codeId'])
@Index('idx_validation_codes_created_at', ['createdAt'])
export class ValidationCode {
  @PrimaryGeneratedColumn('uuid', { name: 'code_id' })
  codeId: string;

  @Column('varchar', { length: 4 })
  code: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column('varchar', { name: 'type_code', length: 100 })
  codeType: string;

  @Column('varchar', { length: 100 })
  ip: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'validated_at' })
  validatedAt: Date;

  @Column('varchar', { name: 'status_code', length: 100 })
  statusCode: string;

  @Column('varchar', { name: 'user_agent', length: 400 })
  userAgent: string;

  @Column('int', { name: 'retries_total', default: 0 })
  retriesTotal: number;
}

@Entity('validation_code_types')
export class ValidationCodeType {
  @PrimaryColumn('varchar', { name: 'type_code', length: 100 })
  codeType: 'RESTORE_PASSWORD' | 'SIGNUP';

  @Column('varchar', { length: 400 })
  description: string;
}
