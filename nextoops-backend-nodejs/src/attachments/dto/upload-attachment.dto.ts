import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AttachmentType } from '../enums/attachment-type';
import { TransformJson } from '../../commons/decorators/transform-json.decorator';
import { TransformBoolean } from '../../commons/decorators/transform-boolean.decorator';

export class UploadAttachmentDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @TransformBoolean({ defaultValue: false })
  compress: boolean;
  @IsOptional()
  @IsNumber()
  @Max(100)
  @Min(0)
  compressQuality: number;

  @IsEnum(AttachmentType)
  type: AttachmentType;

  @IsOptional()
  @IsBoolean()
  enableTranscript: boolean;

  @IsOptional()
  @IsBoolean()
  enableSummary: boolean;

  @IsOptional()
  @IsBoolean()
  @TransformBoolean({ defaultValue: false })
  enableInstantThumbnail: boolean;

  @IsOptional()
  @IsBoolean()
  @TransformBoolean({ defaultValue: false })
  enableInstantTranscript: boolean;

  @IsOptional()
  @IsNumber()
  summaryMaxCharacters: number;

  @IsOptional()
  @TransformBoolean({ defaultValue: false })
  public: boolean;

  @IsOptional()
  @TransformJson
  metaData?: {};
}
