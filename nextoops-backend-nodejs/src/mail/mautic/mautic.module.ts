import { Module } from '@nestjs/common';
import { MauticService } from './mautic.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../user/entities/user.entity';
import { ExportDataModule } from '../../exports/export-data/export-data.module';
import { MauticController } from './mautic.controller';
import { BullModule } from '@nestjs/bull';
import { MauticQueueProcessor } from './queue/import-contacts-queue.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ExportDataModule,
    BullModule.registerQueue({
      name: 'mautic_queue',
    }),
  ],
  providers: [MauticService, MauticQueueProcessor],
  exports: [MauticService, MauticQueueProcessor],
  controllers: [MauticController],
})
export class MauticModule {}
