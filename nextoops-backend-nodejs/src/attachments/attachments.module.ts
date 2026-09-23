import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity';
import { User } from '../user/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Tag } from '../posts/tags/entities/tag.entity';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { HashGuard } from '../user/guards/hash.guard';
import { AttachmentSubscriber } from './subscribers/attachment.subscriber';
import { AudioTranscriptionModule } from '../audio-transcription/audio-transcription.module';
import { AiModule } from '../ai/ai.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AiModule, TypeOrmModule.forFeature([Attachment, User, Post, Tag]), AudioTranscriptionModule, ConfigModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, JwtAuthGuard, HashGuard, AttachmentSubscriber],
  // mean you export AttachmentsService with all what have injected on it like TypeOrmModule.forFeature..etc
  // so no need in other module to inject all those TypeOrmModule.for .. to make the service working
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
