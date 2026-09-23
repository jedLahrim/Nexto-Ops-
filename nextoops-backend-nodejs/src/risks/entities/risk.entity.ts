import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Risk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  /** 'Low' | 'Medium' | 'High' | 'Critical' */
  @Column({ default: 'Medium' })
  likelihood: string;

  /** 'Low' | 'Medium' | 'High' | 'Critical' */
  @Column({ default: 'Medium' })
  impact: string;

  /** 'open' | 'mitigated' | 'accepted' | 'closed' */
  @Column({ default: 'open' })
  status: string;

  @Column('text', { nullable: true })
  mitigationPlan: string;

  @ManyToOne(() => User, { nullable: true })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
