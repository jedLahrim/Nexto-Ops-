import { Controller, Param, Post } from '@nestjs/common';
import { AudioTranscriptionService } from './audio-transcription.service';

@Controller('audio-transcription')
export class AudioTranscriptionController {
  constructor(private readonly audioTranscriptionService: AudioTranscriptionService) {}
  @Post(':id/transcribe')
  async transcribeAttachment(@Param('id') id: string) {
    const text = await this.audioTranscriptionService.transcribeAttachmentById(id);
    return { id, transcription: text };
  }
}
