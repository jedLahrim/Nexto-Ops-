import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Constant } from '../../commons/constant';

@Injectable()
export class MicroservicesNotificationService {
  constructor(@Inject(Constant.NOTIFY_SERVICE) private readonly client: ClientProxy) {}

  sendEmailNotification(email: string, message: string) {
    // todo emit() is used for Event-based pattern (Fire and forget)
    this.client.emit('send_email', { email, message });
  }

  async sendSmsNotification(phone: string, message: string) {
    return this.client.emit('send_sms', { phone, message });
  }
}
