import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UseCaseCategory } from '../../entities/usecase-category.entity';
import { UseCaseMetaData } from '../dto/use-case-meta-data.dto';
import { AiInsight } from '../../ai-insights/entities/ai-insight.entity';
import { Exclude } from 'class-transformer';
import { SubjectType } from '../../../../posts/enum/subject-type';
import { AIProvider } from '../../../ai.service';
import { EntryCategory } from '../../../../entries/entries-categotries/entities/entries-categotry.entity';
import { Challenge } from '../../../../challenges/entities/challenge.entity';
import { Entry } from '../../../../entries/entities/entry.entity';
import { UseCaseTranslation } from './use-case-translation.entity';
import { LanguageCode } from '../../../../user/enums/language-code';

export enum UseCaseLength {
  SHORT = 'SHORT',
  LONG = 'LONG',
}

@Entity()
export class UseCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column('simple-json', { nullable: true })
  metaData?: UseCaseMetaData;

  @Column('simple-json', { nullable: true })
  jsonSchema?: JSON;

  @Column({ default: AIProvider.OPEN_AI })
  aiProvider: AIProvider;

  @Column({ default: SubjectType.WELLNESS })
  subjectType: SubjectType;

  @Column()
  shortText: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  defaultInsight: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => UseCaseCategory, (category) => category.useCases, {
    onDelete: 'CASCADE',
  })
  useCaseCategory: UseCaseCategory;

  @Exclude()
  @OneToMany(() => AiInsight, (aiInsight) => aiInsight.useCase)
  aiInsights?: AiInsight[];

  @Column({ nullable: true })
  useCaseCategoryId?: string;

  @Column({ default: 4 })
  requiredTrackingCount: number;

  @ManyToOne(() => EntryCategory, (entryCategory) => entryCategory.useCases, {
    onDelete: 'CASCADE',
  })
  entryCategory: EntryCategory;

  @Column({ nullable: true })
  entryCategoryId?: string;

  @OneToOne(() => Challenge, (challenge) => challenge.useCase, {})
  challenge?: Challenge;

  @Column({ default: UseCaseLength.SHORT })
  length: UseCaseLength;

  @OneToMany(() => Entry, (entry) => entry.useCase)
  entries?: Entry[];

  @OneToMany(() => UseCaseTranslation, (translation) => translation.base)
  translations: UseCaseTranslation[];

  languageCode: LanguageCode;

  @Column('simple-json', { nullable: true })
  extraData: Record<string, unknown>;
}
