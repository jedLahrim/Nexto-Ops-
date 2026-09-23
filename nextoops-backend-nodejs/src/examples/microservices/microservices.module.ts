import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { MicroservicesProductService } from './product.service';
import { MicroservicesNotificationService } from './notification.service';
import { Constant } from '../../commons/constant';
// Redis is used for Product Service (message broker pattern - pub/sub, queuing)
// while TCP is used for Notify Service (direct point-to-point communication for real-time notifications).
@Module({
  imports: [
    ClientsModule.register([
      {
        name: Constant.PRODUCT_SERVICE,
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
      {
        name: Constant.NOTIFY_SERVICE,
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 8888,
        },
      },
    ]),
  ],
  providers: [MicroservicesProductService, MicroservicesNotificationService],
  exports: [MicroservicesProductService, MicroservicesNotificationService],
})
export class MicroservicesModule {}
