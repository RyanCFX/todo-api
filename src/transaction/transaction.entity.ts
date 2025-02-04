// MODULOS DE TERCEROS
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

// ENTIDADES
import { User } from 'src/user/user.entity';

@Entity('transactions')
@Index('idx_transactions_transaction_id', ['transactionId'])
@Index('idx_transactions_created_at', ['createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid', { name: 'transaction_id' })
  transactionId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'data_in', type: 'varchar', length: 3000 })
  dataIn: string;

  @Column({ name: 'data_out', type: 'varchar', length: 3000 })
  dataOut: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 100 })
  userAgent: string;

  @Column({ name: 'entity', type: 'varchar', length: 400 })
  entity: string;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  // @OneToMany(() => CnfLocation, (location) => location.transaction)
  // locations: CnfLocation[];

  // @OneToMany(() => League, (league) => league.transaction)
  // leagues: League[];

  // @OneToMany(() => Team, (team) => team.transaction)
  // teams: Team[];

  // @OneToMany(
  //   () => PaymentSupplier,
  //   (paymentSupplier) => paymentSupplier.transaction,
  // )
  // paymentSuppliers: PaymentSupplier[];

  // @OneToMany(() => TradeOffer, (tradeOffer) => tradeOffer.transaction)
  // tradeOffers: TradeOffer[];

  // @OneToMany(() => Offer, (offer) => offer.transaction)
  // offers: Offer[];

  // @OneToMany(() => Player, (player) => player.transaction)
  // players: Player[];

  // @OneToMany(() => AttributeType, (attributeType) => attributeType.transaction)
  // attributeTypes: AttributeType[];

  // @OneToMany(() => Statistic, (statistic) => statistic.transaction)
  // statistics: Statistic[];

  // @OneToMany(() => Postcard, (attribute) => attribute.transaction)
  // postcards: Postcard[];

  // @OneToMany(() => HistPlayersAttributes, (attribute) => attribute.transaction)
  // histPlayersAttributes: HistPlayersAttributes[];

  // @OneToMany(() => PlayerAttribute, (attribute) => attribute.transaction)
  // playersAttributes: PlayerAttribute[];

}
