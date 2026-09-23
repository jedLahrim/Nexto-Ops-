import { IsDate, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TransformJson } from '../../../../commons/decorators/transform-json.decorator';
import { UseCaseMetaData } from '../../use-cases/dto/use-case-meta-data.dto';
import { Type } from 'class-transformer';
import { RateInsight, TimeFrame } from '../entities/ai-insight.entity';
import { GradientBgType } from '../../../../entries/entries-categotries/enums/gradient-type.enum';

export class CreateAiInsightDto {
  @IsString()
  question: string;

  @IsString()
  shortText: string;

  @IsString()
  description: string;

  @IsString()
  answer?: string;

  @IsOptional()
  @IsEnum(RateInsight)
  rate?: RateInsight;

  @IsOptional()
  @IsEnum(TimeFrame)
  timeFrame?: TimeFrame;

  @IsOptional()
  @IsDate()
  timeFrameStartDate?: Date;

  @IsOptional()
  @IsDate()
  timeFrameEndDate?: Date;

  @IsString()
  useCaseId?: string;

  @TransformJson
  @IsOptional()
  @ValidateNested()
  @Type(() => UseCaseMetaData)
  metaData?: UseCaseMetaData;

  @IsObject()
  output: Record<string, any>;


  @IsOptional()
  colorType?: GradientBgType;
  // @TransformJson
  // @IsOptional()
  // @ValidateNested()
  // @Type(() => InsightContent)
  // output?: InsightContent;
}
