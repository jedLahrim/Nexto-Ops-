import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Vendor } from '../../vendors/entities/vendor.entity';

@Entity()
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @ManyToOne(() => Vendor, { nullable: true })
  vendor: Vendor;

  /** 'draft' | 'active' | 'expired' | 'terminated' */
  @Column({ default: 'draft' })
  status: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  value: number;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
