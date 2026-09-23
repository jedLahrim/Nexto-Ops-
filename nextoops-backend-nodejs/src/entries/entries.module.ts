import { Module } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { EntriesController } from './entries.controller';
import { AttachmentsModule } from 'src/attachments/attachments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UseCasesModule } from 'src/ai/categories/use-cases/use-cases.module';
import { AudioTranscriptionModule } from 'src/audio-transcription/audio-transcription.module';
import { Entry } from './entities/entry.entity';
import { EntryCategory } from './entries-categotries/entities/entries-categotry.entity';
import { EntryCategoriesModule } from './entries-categotries/entry-categories.module';
import { ChallengesModule } from 'src/challenges/challenges.module';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { UseCase } from '../ai/categories/use-cases/entities/use-case.entity';
import { AiService } from '../ai/ai.service';
import { AttachmentEntry } from '../posts/entities/attachment-entry.entity';

@Module({
  controllers: [EntriesController],
  providers: [EntriesService,AiService],
  exports: [EntriesService],
  imports: [
    TypeOrmModule.forFeature([Entry, EntryCategory, Attachment,UseCase,AttachmentEntry]),
    AttachmentsModule,
    AudioTranscriptionModule,
    // UseCasesModule,
    EntryCategoriesModule,
    ChallengesModule,
  ],
})
export class EntriesModule {}
