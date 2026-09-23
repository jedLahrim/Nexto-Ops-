import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TransformJson } from '../../../../commons/decorators/transform-json.decorator';
import { Type } from 'class-transformer';
import { UseCaseMetaData } from './use-case-meta-data.dto';
import { UseCaseLength } from '../entities/use-case.entity';
import { CreateUseCaseTranslationDto } from './create-use-case-translation.dto';

export class CreateUseCaseDto {
  @IsString()
  question: string;

  @IsString()
  shortText: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsOptional()
  jsonSchema?: JSON;

  @IsString()
  @IsOptional()
  entryCategoryId?: string;

  @IsOptional()
  @IsNumber()
  requiredTrackingCount: number;

  @IsOptional()
  @IsBoolean()
  defaultInsight?: boolean;

  @TransformJson
  @IsOptional()
  @ValidateNested()
  @Type(() => UseCaseMetaData)
  metaData?: UseCaseMetaData;

  @IsOptional()
  @IsEnum(UseCaseLength)
  length?: UseCaseLength;

  @IsOptional()
  @TransformJson
  extraData?: {};

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUseCaseTranslationDto)
  translations?: CreateUseCaseTranslationDto[];
}
