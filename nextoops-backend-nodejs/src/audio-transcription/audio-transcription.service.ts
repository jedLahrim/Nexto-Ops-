import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { AiService } from 'src/ai/ai.service';
import { Repository } from 'typeorm';
import axios from 'axios';
import { AIAudioQueueProcessor } from './queue/audio-queue.processor';

export class TranscribeDto {
  file: Express.Multer.File;
  attachmentId: string;
  enableSummary: boolean;
  summaryMaxCharacters?: number;
  enableInstantTranscript?: boolean;

  constructor(object?: Partial<TranscribeDto>) {
    Object.assign(this, object);
  }
}

@Injectable()
export class AudioTranscriptionService {
  constructor(
    private configService: ConfigService,
    @InjectQueue('transcription_queue') private audioQueue: Queue,
    @InjectRepository(Attachment) private readonly attachmentRepo: Repository<Attachment>,
    private readonly aiService: AiService,
    private readonly aIAudioQueueProcessor: AIAudioQueueProcessor,
  ) {}
  async transcribe(dto: TranscribeDto) {
    const { file, attachmentId, enableSummary, summaryMaxCharacters, enableInstantTranscript } = dto;

    const data = {
      attachmentId,
      enableSummary,
      audio: file.buffer, // always pass raw Buffer
      fileName: file.originalname,
      summaryMaxCharacters,
    };

    if (enableInstantTranscript) {
      // call processor logic directly
      // we mock a Bull Job shape: only `.data` is used inside processor
      const fakeJob = { data } as Job;
      return this.aIAudioQueueProcessor.transcriptSummaryOperationJob(fakeJob);
    }

    // otherwise queue it
    await this.audioQueue.add('transcribe_summary_audio_file', data, {
      jobId: uuid(),
      removeOnComplete: true,
      removeOnFail: true,
    });
  }

  /*private async _checkQueueJob(file: Express.Multer.File) {
    const audioTranscription = await this.audioTranscriptionRepo.findOne({
      where: { fileName: file?.originalname },
    });
    const job = await this.audioQueue.getJob(audioTranscription?.jobId);
    return { job, audioTranscription };
  }*/

  async transcribeAttachmentById(attachmentId: string): Promise<string> {
    // 1. Load the attachment
    const attachment = await this.attachmentRepo.findOne({ where: { id: attachmentId } });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // 2. Return cached transcription if it already exists
    if (attachment.transcription?.trim()) {
      return attachment.transcription;
    }

    if (!attachment.url) {
      throw new NotFoundException('Attachment URL not found');
    }

    // 3. Download the audio file from storage (S3/Spaces/etc.)
    const response = await axios.get<ArrayBuffer>(attachment.url, {
      responseType: 'arraybuffer',
      timeout: 120_000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // 4. Pick a safe filename (required by OpenAI Whisper)
    const fileName = attachment.name?.match(/\.\w+$/) ? attachment.name : 'audio.mp4';

    // 5. Transcribe using AI service
    const transcription = await this.aiService.speechToText(Buffer.from(response.data), fileName);

    // 6. Save the transcription back to DB
    attachment.transcription = transcription ?? '';
    await this.attachmentRepo.save(attachment);

    // 7. Return plain text
    return attachment.transcription;
  }
}
