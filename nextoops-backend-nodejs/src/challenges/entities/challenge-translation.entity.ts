import {
  Entity,
  Unique,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Challenge } from './challenge.entity';
import { LanguageCode } from '../../user/enums/language-code';

@Entity()
@Unique(['languageCode', 'baseId'])
export class ChallengeTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  languageCode: LanguageCode;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  html?: string;

  @Column('simple-json', { nullable: true })
  whatToExpect?: WhatToExpect;

  @ManyToOne(() => Challenge, (base) => base.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'baseId' })
  base: Challenge;
  @Column()
  baseId: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}

export type WhatToExpect = {
  stages?: string[];
  goals?: string[];
};
