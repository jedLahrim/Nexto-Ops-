import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Exclude } from 'class-transformer';
import { AttachmentType } from '../enums/attachment-type';
import { Tutorial } from '../../tutorials/entities/tutorial.entity';
import { AttachmentPost } from '../../posts/entities/attachment-post.entity';
import { PostTranslation } from '../../posts/entities/post-translation.entity';
import { Category } from '../../posts/categories/entities/category.entity';
import { EntryCategory } from '../../entries/entries-categotries/entities/entries-categotry.entity';
import { AttachmentEntry } from '../../posts/entities/attachment-entry.entity';
import { isEmpty } from 'lodash';
import { Challenge } from '../../challenges/entities/challenge.entity';
import { Entry } from '../../entries/entities/entry.entity';

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  url: string;

  @Exclude()
  @Column({ nullable: true, type: 'text' })
  key: string;

  @Exclude()
  @Column({ nullable: true, type: 'text' })
  bucket: string;

  @Column({ nullable: true, type: 'text' })
  blurHash?: string;

  @Column({ nullable: true, type: 'text' })
  thumbnailUrl?: string;

  @Exclude()
  @Column({ nullable: true, type: 'text' })
  thumbnailKey?: string;

  @Column({ nullable: true, type: 'text' })
  thumbnailBlurHash?: string;

  @Column({ default: AttachmentType.FILE })
  type: AttachmentType;

  @Exclude()
  @OneToOne(() => User, (user) => user.profileImageAttachment, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  user?: User;

  @Exclude()
  @OneToOne(() => Category, (category) => category.imageAttachment, {
    onDelete: 'CASCADE',
  })
  category: Category;

  @Exclude()
  @OneToOne(() => Challenge, (challenge) => challenge.photoAttachment, {
    onDelete: 'CASCADE',
  })
  challenge: Challenge;

  @Exclude()
  @OneToOne(() => Entry, (entry) => entry.voiceAttachment, {
    onDelete: 'CASCADE',
  })
  entry: Entry;

  @Exclude()
  @OneToOne(() => EntryCategory, (entryCategory) => entryCategory.imageAttachment, {
    onDelete: 'CASCADE',
  })
  entryCategory: EntryCategory;

  @Column('simple-json', { nullable: true })
  metaData: Record<string, unknown>;

  @OneToOne(() => PostTranslation, (postTranslation) => postTranslation.primaryAttachment, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  primaryPostTranslation?: PostTranslation;

  @OneToOne(() => PostTranslation, (postTranslation) => postTranslation.secondaryAttachment, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  secondaryPostTranslation?: PostTranslation;

  @OneToMany(() => AttachmentPost, (attachmentPost) => attachmentPost.postTranslation)
  attachmentPosts: AttachmentPost[];

  @OneToMany(() => AttachmentEntry, (attachmentEntry) => attachmentEntry.entry)
  attachmentsEntry: AttachmentEntry[];

  @Exclude()
  @OneToOne(() => Tutorial, (tutorial) => tutorial.videoAttachment)
  tutorial: Tutorial;

  @Exclude()
  @Column({ nullable: true })
  documentChildId?: string;

  @Column({ type: 'text', nullable: true })
  transcription?: string;

  get transcriptionWords(): number {
    if (isEmpty(this.transcription)) return 0;
    // count of words by splitting the text by spaces
    const wordsArray = this.transcription.trim().split(/\s+/);
    return wordsArray.length;
  }

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Exclude()
  @Column({ nullable: true })
  jobId?: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  @Exclude()
  @ManyToOne(() => User, (user) => user.uploadedAttachments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  uploadedBy?: User;

  @Exclude()
  @Column({ nullable: true })
  uploadedById?: string;
}
