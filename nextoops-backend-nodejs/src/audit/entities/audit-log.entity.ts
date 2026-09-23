import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

/**
 * Append-only audit log. Never edited or deleted.
 * Written inside every ERP mutation for full traceability.
 */
@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User;

  @Column({ nullable: true })
  @Index()
  userId?: string;

  @Column({ nullable: true })
  userLabel?: string;

  /** e.g. asset.create, incident.update, vendor.delete */
  @Column()
  action: string;

  /** The entity type: asset, incident, vendor, etc. */
  @Column()
  @Index()
  entity: string;

  @Column({ nullable: true })
  @Index()
  entityId?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
