import { Attachment } from '../../attachments/entities/attachment.entity';

export class AttachmentUploadedEvent {
  attachment: Attachment;
  file: Express.Multer.File;
  bucket: string;
}
