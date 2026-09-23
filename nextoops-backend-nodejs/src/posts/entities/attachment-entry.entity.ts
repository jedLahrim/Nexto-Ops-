import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { PostTranslation } from './post-translation.entity';
import { Entry } from '../../entries/entities/entry.entity';

@Entity()
export class AttachmentEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 0 })
  orderIndex?: number;

  @ManyToOne(() => Entry, (entry) => entry.attachmentsEntry, { onDelete: 'CASCADE' })
  entry: Entry;

  @Column()
  entryId: string;

  @ManyToOne(() => Attachment, (attachment) => attachment.attachmentPosts, { onDelete: 'CASCADE' })
  attachment: Attachment;

  @Column()
  attachmentId: string;
}
