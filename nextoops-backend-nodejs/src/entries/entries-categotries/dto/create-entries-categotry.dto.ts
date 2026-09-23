import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Attachment } from '../../../attachments/entities/attachment.entity';
import { GradientBgType } from '../enums/gradient-type.enum';

export class CreateEntryCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  alias: string;

  @IsOptional()
  imageAttachment?: Attachment;

  @IsOptional()
  colorType?: GradientBgType;
}
