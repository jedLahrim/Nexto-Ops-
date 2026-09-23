import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from './entities/incident.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { ItsmService } from './itsm.service';
import { ItsmController } from './itsm.controller';
import { MauticModule } from '../mail/mautic/mautic.module';
import { UserModule } from '../user/user.module';
import { TicketGateway } from './gateways/ticket.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident, TicketMessage]),
    MauticModule,
    UserModule,
  ],
  controllers: [ItsmController],
  providers: [ItsmService, TicketGateway],
  exports: [ItsmService],
})
export class ItsmModule {}
