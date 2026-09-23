import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class FcmSubscribedTopic {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  topic: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.fcmSubscribedTopics, {
    onDelete: 'CASCADE',
  })
  @Exclude()
  user: User;

  @Column()
  @Exclude()
  userId: string;
}
