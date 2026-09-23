import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';
import { SubscriptionType } from '../enum/subscription-type.enum';
import { Currency } from '../enum/currency.enum';
import { PeriodType } from '../enum/period-type.enum';
import { Store } from '../enum/store.enum';

export class SubscriptionBase extends BaseEntity {
  @Column({ type: 'simple-json' })
  metaData: Record<string, unknown>;

  @Column()
  type: SubscriptionType;

  @Column({ nullable: true })
  currency?: Currency;

  @Column()
  periodType: PeriodType;

  @Column()
  entitlementId: string;

  @Column({ nullable: true })
  transactionId?: string;

  @Column({ type: 'double' })
  price: number;

  @Column()
  isFamilyShare: boolean;

  @Column()
  store: Store;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column()
  countryCode: string;

  @Column({ nullable: true })
  purchasedAt?: Date;

  @Column({ nullable: true })
  expirationAt?: Date;

  @Column({ nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  uncancelledAt?: Date;

  @Column({ nullable: true })
  renewalAt?: Date;

  @Column({ nullable: true })
  issuedAt?: Date;

  @Column({ nullable: true })
  pausedAt?: Date;
  @Column({ nullable: true })
  presentedOfferingId?: string;

  @Column({ nullable: true })
  productId?: string;

  @Column({ nullable: true, type: 'double' })
  commissionPercentage?: number;

  @Column({ nullable: true, type: 'double' })
  takeHomePercentage?: number;
}
