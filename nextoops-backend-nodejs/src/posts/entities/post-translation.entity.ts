import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { Exclude, Expose } from 'class-transformer';
import { AttachmentPost } from './attachment-post.entity';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { LanguageCode } from '../../user/enums/language-code';

@Entity()
@Unique(['languageCode', 'baseId'])
export class PostTranslation {
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
  quillData: JSON;

  @Column({ type: 'text', nullable: true })
  externalUrl?: string;
  @OneToOne(() => Attachment, (attachment) => attachment.primaryPostTranslation, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  // @Exclude()
  @JoinColumn()
  primaryAttachment?: Attachment;
  @OneToOne(() => Attachment, (attachment) => attachment.secondaryPostTranslation, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  // @Exclude()
  @JoinColumn()
  secondaryAttachment?: Attachment;
  @OneToMany(() => AttachmentPost, (attachmentPost) => attachmentPost.postTranslation, {
    // to have nested save
    cascade: true,
  })
  @Exclude()
  attachmentPosts: AttachmentPost[];
  @ManyToOne(() => Post, (base) => base.translations, {
    onDelete: 'CASCADE',
  })
  base: Post;
  @Column()
  baseId: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  @Expose({ name: 'primaryAttachmentUrl' })
  get primaryAttachmentUrl(): string {
    return this.primaryAttachment?.url;
  }

  @Expose({ name: 'secondaryAttachmentUrl' })
  get secondaryAttachmentUrl(): string {
    return this.secondaryAttachment?.url;
  }

  @Expose({ name: 'attachmentUrls' })
  get attachmentUrls(): string[] {
    return this.attachmentPosts?.map((value) => value.attachment?.url);
  }

  @Expose({ name: 'attachments' })
  get attachments() {
    return this.attachmentPosts?.map((value) => value.attachment);
  }
}
