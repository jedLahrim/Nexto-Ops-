import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { User } from '../user/entities/user.entity';
import { GetUser } from '../user/get-user.decorator';
import { AuthOrHashGuard } from '../user/guards/auth-or-hash/auth-or-hash.guard';
import { AudioTranscriptionService, TranscribeDto } from '../audio-transcription/audio-transcription.service';
import { AttachmentType } from './enums/attachment-type';
import { ConfigService } from '@nestjs/config';
import { Constant } from '../commons/constant';
import { AppError } from '../commons/errors/app-error';
import { ERR_MAX_UPLOAD_SIZE, ERR_TOO_SMALL_ENTRY } from '../commons/errors/errors-codes';
import pTimeout from 'p-timeout';
import { AttachmentUploadedEvent } from '../event-listeners/events/attachment-uploaded.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { UserTypeGuard } from '../user/guards/user-type.guard';
import { UserType } from '../user/enums/user-type.enum';

@Controller('attachments')
export class AttachmentsController {
  production: boolean;

  constructor(
    private readonly attachmentService: AttachmentsService,
    private readonly audioTranscriptionService: AudioTranscriptionService,
    private readonly configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.production = this.configService.get('ENV') == 'prod';
  }

  @Get(':id')
  @UseGuards(AuthOrHashGuard)
  findOne(@Param('id') id: string) {
    return this.attachmentService.findOne(id);
  }

  @Post('/upload')
  @UseGuards(AuthOrHashGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadAttachmentDto, @GetUser() user: User) {
    const fileSizeInMB = this._checkFileSize(file.size, dto.type);

    switch (dto.type) {
      case AttachmentType.IMAGE:
        if (dto.compress || fileSizeInMB > 1) {
          try {
            await pTimeout(this.attachmentService.compressImage(file, dto.compressQuality ?? 60), 3000);
          } catch (e) {}
        }
        const attachment = await this.attachmentService.upload(file, dto, user);

        const attachmentUploadedEvent: AttachmentUploadedEvent = {
          attachment: attachment,
          file: file,
          bucket: this._getBucket(dto.public),
        };
        this.eventEmitter.emit('attachment.uploaded', attachmentUploadedEvent);
        return attachment;
      case AttachmentType.AUDIO:
        const saved = await this.attachmentService.upload(file, dto, user);

        if (dto.enableTranscript) {
          const transcribeDto = new TranscribeDto({
            enableInstantTranscript: dto.enableInstantTranscript,
            file,
            attachmentId: saved.id,
            enableSummary: dto.enableSummary ?? false,
            summaryMaxCharacters: dto.summaryMaxCharacters,
          });
          if (dto.enableInstantTranscript) {
            const attachment = await this.audioTranscriptionService.transcribe(transcribeDto);
            if (attachment.transcriptionWords <= Constant.ALLOW_TRANSCRIPTION_MIN_WORDS) {
              throw new ConflictException(new AppError(ERR_TOO_SMALL_ENTRY));
            }
            return attachment;
          } else {
            await this.audioTranscriptionService.transcribe(transcribeDto);
          }
        }
        return saved;
      default:
        return this.attachmentService.upload(file, dto, user);
    }
  }

  @Delete(':id')
  @UseGuards(AuthOrHashGuard)
  remove(@Param('id') id: string) {
    return this.attachmentService.remove(id);
  }

  @Post('apply-blur-hash')
  @UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
  async applyBlurHash(@Body('retryTimes') retryTimes: number) {
    for (let i = 0; i < retryTimes; i++) {
      await this.attachmentService.handleAttachmentApplyBlur();
    }
  }

  private _checkFileSize(size: number, type: AttachmentType) {
    const maxSize = Constant.MAX_ATTACHMENT_SIZE_MO[type];

    // convert file size from BYTE to MB
    const fileSizeInMB = size / (1024 * 1024);
    if (fileSizeInMB > maxSize)
      throw new ConflictException(new AppError(ERR_MAX_UPLOAD_SIZE, { maxSizeMo: Constant.MAX_ATTACHMENT_SIZE_MO }));

    return fileSizeInMB;
  }

  private _getBucket(publicUpload: boolean) {
    return publicUpload ? Constant.STATIC_BUCKET_FOLDER : this.configService.get('AWS_BUCKET_NAME');
  }
}
