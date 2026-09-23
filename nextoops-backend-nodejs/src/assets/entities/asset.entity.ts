import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  assetTag: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  serialNumber: string;

  /** Status: In Use, Available, Broken, Retired */
  @Column({ default: 'Available' })
  status: string;

  /** Whether this is an inventory asset or a stock consumable */
  @Column({ default: 'inventory' })
  type: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ManyToOne(() => User, { nullable: true })
  assignedTo: User;

  @Column({ nullable: true })
  purchaseDate: Date;

  @Column({ nullable: true })
  warrantyExpiry: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
