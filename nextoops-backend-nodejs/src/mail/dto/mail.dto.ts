import { Attachment } from 'nodemailer/lib/mailer';

export class MailDto {
  email: string;
  subject: string;
  template?: string;
  context?: any;
  attachments?: Attachment[];
}
