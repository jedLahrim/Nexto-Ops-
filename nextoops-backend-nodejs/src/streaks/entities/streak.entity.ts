import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Streak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entryAt: Date;

  @ManyToOne(() => User,(user)=>user.streaks, { onDelete: 'CASCADE' })
  createdBy: User;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
