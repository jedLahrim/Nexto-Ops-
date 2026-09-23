import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { AiService } from '../../ai/ai.service';
import { InternalServerErrorException } from '@nestjs/common';
import { ERR_SERVER_ERROR } from '../../commons/errors/errors-codes';
import { AppError } from '../../commons/errors/app-error';

abstract class IAudioQueueProcessor {
  abstract transcriptSummaryOperationJob(job: Job);
}

/*@Processor('transcription_queue')
export class AudioQueueProcessor implements IAudioQueueProcessor {
  private readonly _credentials;
  private _RECOGNITION_LANG_CODES = ['en-gb', 'en-US'];

  constructor(
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    private configService: ConfigService,
  ) {
    this._credentials = JSON.parse(
      this.configService.get('GOOGLE_SPEECH_TO_TEXT_SERVICE_ACCOUNT'),
    );
  }

  private async _summaryTranscriptAudio(
    transcription: string,
    attachmentId: string,
  ): Promise<string> {
    // TODO: chatGPT to convert text to summary
    const summary = 'TODO ChatGPT';

    const updateResult = await this.attachmentRepo.update(
      { id: attachmentId },
      {
        summary,
      },
    );

    if (updateResult.affected == null || updateResult.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_ALLERGIE));
    }

    return transcription;
  }

  private async _transcriptAudio(job: Job): Promise<string> {
    const speechClient = new v2.SpeechClient({
      credentials: this._credentials,
    });
    const recognizerRequest = this._getRecognizerRequest();
    const recognizerOperation = await this._getRecognizerOperation(
      speechClient,
      job,
      recognizerRequest,
    );
    const recognizerName = recognizerOperation.result['name'];

    const transcriptionRequest = this._getTranscriptionRequest(
      recognizerName,
      job,
    );

    try {
      const response = await speechClient.recognize(transcriptionRequest);
      const result = response[0].results;
      const transcription = result
        .map((value) => value.alternatives[0].transcript.trim())
        .join(' ');

      const id = job.data.attachmentId;
      const attachment = await this.attachmentRepo.findOneOrFail({
        where: { id },
      });
      attachment.transcription = transcription;
      attachment.metaData = {
        ...(attachment.metaData || {}),
        transcriptResult: result,
      };
      await this.attachmentRepo.save(attachment);
      return transcription;
    } catch (e) {
      throw new NotFoundException(new AppError(ERR_TRANSCRIPT));
    }
  }

  private _getTranscriptionRequest(recognizerName: string, job: Job) {
    const transcriptionRequest: IRecognizeRequest = {
      recognizer: recognizerName,

      config: {
        // Automatically detects audio encoding
        autoDecodingConfig: {},
      },
      content: job.data.audio,
    };
    return transcriptionRequest;
  }

  async _getRecognizerOperation(
    speechClient: v2.SpeechClient,
    job: Job,
    recognizerRequest,
  ) {
    try {
      const operation = await speechClient.createRecognizer(recognizerRequest);
      return operation[0];
    } catch (e) {
      console.log(e);
    }
  }

  @Process('transcribe_summary_audio_file')
  async transcriptSummaryOperationJob(job: Job) {
    try {
      /!*      console.log(
        `transcribe_summary_audio_file called JobId=${job.id} recognizerId=${job.data.recognizerRequest.recognizerId}`,
      );*!/
      const transcription = await this._transcriptAudio(job);
      const enableSummary = job.data.enableSummary ?? false;
      if (enableSummary) {
        await this._summaryTranscriptAudio(
          transcription,
          job.data.attachmentId,
        );
      }
    } catch (e) {
      throw new InternalServerErrorException(new AppError(ERR_SERVER_ERROR));
    }
  }

  private _getRecognizerRequest() {
    return {
      parent: `projects/${this._credentials.project_id}/locations/global`,
      recognizerId: `senlife-recognizer-${uuid()}`,
      recognizer: {
        languageCodes: this._RECOGNITION_LANG_CODES,
        model: 'latest_long',
      },
    };
  }
}*/

@Processor('transcription_queue')
export class AIAudioQueueProcessor implements IAudioQueueProcessor {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    private aiService: AiService,
  ) {}

  @Process('transcribe_summary_audio_file')
  async transcriptSummaryOperationJob(job: Job): Promise<Attachment> {
    try {
      const data = job.data;
      const id = data.attachmentId;
      let attachment = await this.attachmentRepo.findOneOrFail({
        where: { id },
      });

      const transcription = await this.aiService.speechToText(data.audio, data.fileName);

      attachment.transcription = transcription;
      await this.attachmentRepo.save(attachment);

      if (data.enableSummary ?? false) {
        attachment.summary = await this.aiService.textSummary(transcription, data.summaryMaxCharacters);
        await this.attachmentRepo.save(attachment);
      }

      return attachment;
    } catch (e) {
      console.log(`transcribe_summary_audio_file error=${e}`);
      throw new InternalServerErrorException(new AppError(ERR_SERVER_ERROR));
    }
  }
}
