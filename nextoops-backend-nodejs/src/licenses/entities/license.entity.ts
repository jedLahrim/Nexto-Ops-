import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Vendor } from '../../vendors/entities/vendor.entity';

@Entity()
export class License {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  softwareName: string;

  @Column({ nullable: true })
  licenseKey: string;

  @ManyToOne(() => Vendor, { nullable: true })
  vendor: Vendor;

  /** 'active' | 'expired' | 'revoked' */
  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'int', default: 1 })
  seats: number;

  @Column({ type: 'int', default: 0 })
  seatsUsed: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  annualCost: number;

  @Column({ nullable: true })
  expiryDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
