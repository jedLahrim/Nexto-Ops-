import { Module } from '@nestjs/common';
import { AudioTranscriptionService } from './audio-transcription.service';
import { BullModule } from '@nestjs/bull';
import { AudioTranscriptionController } from './audio-transcription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from '../attachments/entities/attachment.entity';
import { AiModule } from '../ai/ai.module';
import { AIAudioQueueProcessor } from './queue/audio-queue.processor';
import { AiService } from 'src/ai/ai.service';

@Module({
  imports: [
    AiModule,
    TypeOrmModule.forFeature([Attachment]),
    BullModule.registerQueue({
      name: 'transcription_queue',
    }),
  ],
  providers: [AudioTranscriptionService, AIAudioQueueProcessor, AiService],
  controllers: [AudioTranscriptionController],
  exports: [AudioTranscriptionService, AIAudioQueueProcessor],
})
export class AudioTranscriptionModule {}
