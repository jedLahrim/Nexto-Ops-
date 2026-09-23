import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PermissionSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  /** Array of ErpModuleKey strings stored as JSON */
  @Column('simple-json')
  modules: string[];

  /** Whether this is a built-in preset (seeded) */
  @Column({ default: false })
  isBuiltIn: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
