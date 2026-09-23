import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { LanguageCode } from '../../user/enums/language-code';
import { TransformJson } from '../../commons/decorators/transform-json.decorator';

export class CreatePostTranslationDto {
  @IsString()
  title: string;

  @IsEnum(LanguageCode)
  languageCode: LanguageCode;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  html?: string;

  @TransformJson
  @IsOptional()
  quillData?: JSON;

  @IsString()
  @IsOptional()
  externalUrl?: string;

  @IsOptional()
  attachments?: Attachment[];

  @IsOptional()
  primaryAttachment?: Attachment;

  @IsOptional()
  secondaryAttachment?: Attachment;
}
