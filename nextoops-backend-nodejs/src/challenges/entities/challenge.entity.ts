import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntryCategory } from 'src/entries/entries-categotries/entities/entries-categotry.entity';
import { ChallengeTranslation, WhatToExpect } from './challenge-translation.entity';
import { ChallengeDifficulty } from '../enum/challenge-difficulty.enum';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { GradientBgType } from '../../entries/entries-categotries/enums/gradient-type.enum';
import { LanguageCode } from '../../user/enums/language-code';
import { Exclude, Expose } from 'class-transformer';
import { ChallengeStatus, UserChallenge } from './user-challenge.entity';
import { UseCase } from '../../ai/categories/use-cases/entities/use-case.entity';

@Entity()
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  alias: string;

  @OneToOne(() => EntryCategory, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entryCategoryId' })
  entryCategory: EntryCategory;

  @Column()
  entryCategoryId: string;

  @Column()
  duration: number;

  @Exclude()
  @OneToMany(() => UserChallenge, (userChallenge) => userChallenge.challenge)
  userChallenges: UserChallenge[];

  @Column({ type: 'int', default: 0 })
  participantsCount: number;

  @OneToOne(() => UseCase, (useCase) => useCase.challenge, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'useCaseId' })
  useCase: UseCase;

  @Column({ nullable: true })
  useCaseId: string;

  @OneToOne(() => Attachment, (photoAttachment) => photoAttachment.challenge, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'photoAttachmentId' })
  photoAttachment?: Attachment;

  @Expose({ name: 'photoUrl' })
  get photoUrl(): string {
    return this.photoAttachment?.url;
  }

  @Column({ nullable: true })
  photoAttachmentId?: string;
  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: ChallengeDifficulty.EASY })
  challengeDifficulty: ChallengeDifficulty;

  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => ChallengeTranslation, (translation) => translation.base)
  translations: ChallengeTranslation[];

  @Column({ default: GradientBgType.GRADIENT1 })
  colorType: GradientBgType;

  languageCode: LanguageCode;
  title: string;
  description?: string;
  html?: string;
  whatToExpect?: WhatToExpect;
  startAt: Date;
  trackedEntryCount: number;
  trackedEntryDays: number;
  status: ChallengeStatus;
}
