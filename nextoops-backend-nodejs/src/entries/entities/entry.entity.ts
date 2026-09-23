import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { UseCase } from '../../ai/categories/use-cases/entities/use-case.entity';
import { EmotionState } from '../enums/emotion-state.enum';
import { Exclude, Expose } from 'class-transformer';
import { EntryCategory } from '../entries-categotries/entities/entries-categotry.entity';
import { AttachmentEntry } from '../../posts/entities/attachment-entry.entity';
import { isEmpty } from 'lodash';

@Entity()
export class Entry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ default: EmotionState.HAPPY })
  emotion: EmotionState;

  @OneToMany(() => AttachmentEntry, (attachmentEntry) => attachmentEntry.entry, {
    // to have nested save
    cascade: true,
  })
  @Exclude()
  attachmentsEntry: AttachmentEntry[];

  @OneToOne(() => Attachment, (voiceAttachment) => voiceAttachment.entry, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'voiceAttachmentId' })
  voiceAttachment?: Attachment;

  @Column({ nullable: true })
  voiceAttachmentId?: string;

  @ManyToOne(() => UseCase, (useCase) => useCase.entries, { nullable: true, onDelete: 'SET NULL' })
  useCase?: UseCase;

  @Column({ nullable: true })
  useCaseId?: string;

  @ManyToOne(() => EntryCategory, (entryCategory) => entryCategory.entries, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  entryCategory: EntryCategory;

  @Column()
  entryCategoryId: string;

  @Column({ type: 'text', nullable: true })
  overview?: string | null;

  @Column({ type: 'simple-array', nullable: true })
  activities?: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  feelings?: string[] | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ManyToOne(() => User, (user) => user.entries, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'text', nullable: true })
  data?: string | null;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // @Expose({ name: 'letters' })
  // get letters(): number {
  //   return this.text.length;
  // }
  @Expose({ name: 'words' })
  get words(): number {
    if (isEmpty(this.text)) return 0;
    // count of words by splitting the text by spaces
    const wordsArray = this.text.trim().split(/\s+/);
    return wordsArray.length;
  }

  @Expose({ name: 'text' })
  get text(): string {
    return this.content ?? this.voiceAttachment?.transcription;
  }

  @Expose({ name: 'attachments' })
  get attachments() {
    return this.attachmentsEntry?.map((value) => value.attachment);
  }

  @Expose({ name: 'attachmentUrls' })
  get attachmentUrls(): string[] {
    return this.attachmentsEntry?.map((value) => value.attachment?.url);
  }
}
