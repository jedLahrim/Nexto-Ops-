import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { RoomType } from '../enums/room-type.enum';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  @Index()
  roomType: RoomType;

  @Column({ nullable: true })
  building?: string;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  department?: Department;

  @Column({ nullable: true })
  @Index()
  departmentId?: string;

  @Column({ nullable: true })
  capacity?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
