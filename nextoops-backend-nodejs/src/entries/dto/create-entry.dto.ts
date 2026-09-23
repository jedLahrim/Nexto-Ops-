import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EmotionState } from '../enums/emotion-state.enum';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { SubjectType } from '../../posts/enum/subject-type';
import { TransformStringToArray } from '../../commons/decorators/transform-include.decorator';

export class CreateEntryDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  attachments?: Attachment[];

  @IsOptional()
  voiceAttachment?: Attachment;

  @IsOptional()
  @IsString()
  useCaseId?: string;

  @IsOptional()
  @IsBoolean()
  randomUseCase?: boolean;

  @IsString()
  entryCategoryId: string;

  @IsOptional()
  @IsEnum(EmotionState)
  emotion?: EmotionState;

  @IsOptional()
  @IsString()
  data?: string;


  @IsOptional()
  @TransformStringToArray
  activities?: string[];

  @IsOptional()
  @TransformStringToArray
  feelings?: string[];
}
