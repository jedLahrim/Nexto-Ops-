import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../../../user/entities/user.entity';
import { Exclude } from 'class-transformer';
import { UseCaseMetaData } from '../../use-cases/dto/use-case-meta-data.dto';
import { UseCase } from '../../use-cases/entities/use-case.entity';
import { GradientBgType } from '../../../../entries/entries-categotries/enums/gradient-type.enum';

export enum RateInsight {
  BAD = 'BAD',
  GOOD = 'GOOD',
  LOVE_IT = 'LOVE_IT',
}

type Json = Record<string, any>;

export enum TimeFrame {
  DAILY = 'DAILY',
  THREE_DAYS = 'THREE_DAYS',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

@Entity()
export class AiInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column()
  shortText: string;

  @Column({ nullable: true })
  rate?: RateInsight;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ nullable: true })
  timeFrame: TimeFrame;

  @Column({ nullable: true })
  timeFrameStartDate?: Date;

  @Column({ nullable: true })
  timeFrameEndDate?: Date;

  // @Column('simple-json')
  // output: InsightContent;
  @Column({ type: 'simple-json' })
  output: Json;

  @Column('simple-json', { nullable: true })
  metaData?: UseCaseMetaData;

  @Column()
  userId: string;

  // @Column()
  // childId: string;

  @Exclude()
  @ManyToOne(() => User, (user) => user.aiInsights, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => UseCase, (useCase) => useCase.aiInsights, {
    onDelete: 'SET NULL',
  })
  useCase?: UseCase;

  @Column({ nullable: true })
  useCaseId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: GradientBgType.GRADIENT1 })
  colorType: GradientBgType;
}
