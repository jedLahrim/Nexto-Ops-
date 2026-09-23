import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { PostTranslation } from './post-translation.entity';

@Entity()
export class AttachmentPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 0 })
  orderIndex?: number;

  @ManyToOne(() => PostTranslation, (postTranslation) => postTranslation.attachmentPosts, { onDelete: 'CASCADE' })
  postTranslation: PostTranslation;

  @Column()
  postTranslationId: string;

  @ManyToOne(() => Attachment, (attachment) => attachment.attachmentPosts, { onDelete: 'CASCADE' })
  attachment: Attachment;

  @Column()
  attachmentId: string;
}
