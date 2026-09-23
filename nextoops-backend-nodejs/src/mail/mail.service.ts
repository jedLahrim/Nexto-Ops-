import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MailDto } from './dto/mail.dto';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendMail(dto: MailDto) {
    try {
      return await this.mailerService.sendMail({
        to: dto.email,
        subject: dto.subject,
        template: dto.template,
        context: dto.context,
      });
    } catch (e) {
      console.log(e);
    }
  }
}
