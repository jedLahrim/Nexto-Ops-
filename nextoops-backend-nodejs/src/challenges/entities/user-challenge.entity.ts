import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Challenge } from './challenge.entity';
import { User } from 'src/user/entities/user.entity';

export enum ChallengeStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

@Entity()
@Unique(['userId', 'challengeId'])
export class UserChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: ChallengeStatus.IN_PROGRESS })
  status: ChallengeStatus;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.userChallenges, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  challengeId: string;

  @ManyToOne(() => Challenge, (challenge) => challenge.userChallenges, { onDelete: 'CASCADE' })
  challenge: Challenge;

  @Column()
  startAt: Date;

  @Column({ type: 'int', default: 0 })
  trackedEntryCount: number;

  @Column({ type: 'int', default: 0 })
  trackedEntryDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
