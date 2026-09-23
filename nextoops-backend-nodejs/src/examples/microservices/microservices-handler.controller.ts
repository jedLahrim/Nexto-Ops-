import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class MicroservicesHandlerController {
  // --- todo Handling send() (Request-Response) ---

  @MessagePattern({ cmd: 'create_product' })
  handleCreateProduct(@Payload() data: Object) {
    console.log('Received redundant product creation request:', data);
    // Logic to save to database goes here
    return { status: 'success', productId: '12345' };
  }

  @MessagePattern({ cmd: 'get_product' })
  handleGetProduct(@Payload() data: { id: string }) {
    return { id: data.id, name: 'Sample Product', price: 100 };
  }

  // --- todo Handling emit() (Event-based / Fire and Forget) ---

  @EventPattern('send_email')
  handleSendEmail(@Payload() data: { email: string; message: string }) {
    console.log(`Processing email event for ${data.email}...`);
    // Logic to send email via Mailchimp/SendGrid goes here
  }

  @EventPattern('send_sms')
  handleSendSms(@Payload() data: { phone: string; message: string }) {
    console.log(`Processing SMS event for ${data.phone}...`);
    // Logic to send SMS via Twilio goes here
  }
}
