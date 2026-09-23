import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { EmotionState } from '../../entries/enums/emotion-state.enum';
import { User } from '../../user/entities/user.entity';
import { Exclude } from 'class-transformer';

@Entity()
@Unique(['date', 'userId'])
export class Mood {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude()
  @ManyToOne(() => User, (user) => user.moods, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  date?: Date;

  @Column({ nullable: true })
  dominantEmotion?: EmotionState;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
