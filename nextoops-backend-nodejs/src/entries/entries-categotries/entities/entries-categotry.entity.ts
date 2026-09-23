import { Exclude, Expose } from 'class-transformer';
import { I18nContext } from 'nestjs-i18n';
import { Challenge } from 'src/challenges/entities/challenge.entity';
import { Entry } from 'src/entries/entities/entry.entity';
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
import { UseCase } from '../../../ai/categories/use-cases/entities/use-case.entity';
import { Attachment } from '../../../attachments/entities/attachment.entity';
import { GradientBgType } from '../enums/gradient-type.enum';

@Entity()
export class EntryCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;
  @Column()
  alias: string;

  @Exclude()
  @Column({ nullable: true })
  challengeId?: string;

  @OneToMany(() => Entry, (e) => e.entryCategory)
  entries?: Entry[];

  @OneToOne(() => Challenge, (e) => e.entryCategory, { onDelete: 'SET NULL' })
  challenge?: Challenge;

  @OneToMany(() => UseCase, (useCase) => useCase.entryCategory)
  useCases: UseCase[];

  @OneToOne(() => Attachment, (attachment) => attachment.entryCategory, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  imageAttachment?: Attachment;

  @Expose({ name: 'imageUrl' })
  get imageUrl(): string {
    return this.imageAttachment?.url;
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ default: GradientBgType.GRADIENT1 })
  colorType: GradientBgType;

  setI18n(i18n: I18nContext): EntryCategory {
    this.name = i18n.t(`locale.${this.alias}`, { defaultValue: this.name });
    return this;
  }
}
