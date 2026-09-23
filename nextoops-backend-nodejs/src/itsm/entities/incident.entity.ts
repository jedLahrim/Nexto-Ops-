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
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Auto-generated friendly ID like INC-001 */
  @Column({ unique: true })
  ticketNumber: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ default: 'new' })
  status: string;

  @Column({ default: 'Low' })
  priority: string;

  /** Which module this ticket belongs to: 'incident', 'problem', 'change' */
  @Column({ default: 'incident' })
  type: string;

  @ManyToOne(() => User, { nullable: true })
  reporter: User;

  @ManyToOne(() => User, { nullable: true })
  assignee: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;
}
