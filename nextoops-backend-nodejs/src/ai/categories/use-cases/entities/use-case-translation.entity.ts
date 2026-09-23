import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UseCase } from './use-case.entity';
import { LanguageCode } from '../../../../user/enums/language-code';

@Entity()
@Unique(['languageCode', 'baseId'])
export class UseCaseTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  languageCode: LanguageCode;

  @Column()
  shortText: string;

  @ManyToOne(() => UseCase, (base) => base.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'baseId' })
  base: UseCase;

  @Column()
  baseId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

