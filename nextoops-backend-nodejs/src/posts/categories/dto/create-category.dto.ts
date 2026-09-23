import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Attachment } from '../../../attachments/entities/attachment.entity';
import { CategoryBasedOn } from '../entities/category.entity';
import { SubjectType } from '../../enum/subject-type';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(CategoryBasedOn)
  basedOn: CategoryBasedOn;

  @IsString()
  alias: string;

  @IsString()
  key: string;

  @IsOptional()
  @IsNumber()
  trimester: number;

  @IsOptional()
  imageAttachment?: Attachment;

  @IsOptional()
  @IsEnum(SubjectType)
  subjectType?: SubjectType;
}
