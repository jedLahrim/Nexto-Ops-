import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /** e.g. 'Hardware', 'Software', 'Services', 'Training', 'Infrastructure' */
  @Column()
  category: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  allocatedAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  spentAmount: number;

  /** fiscal year e.g. '2026' */
  @Column({ nullable: true })
  fiscalYear: string;

  /** 'planned' | 'approved' | 'active' | 'closed' */
  @Column({ default: 'planned' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
