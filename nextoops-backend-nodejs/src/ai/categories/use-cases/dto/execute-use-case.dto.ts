import { ExportUserDataDto } from '../../../../exports/export-data/dto/export-user-data.dto';
import { TransformJson } from '../../../../commons/decorators/transform-json.decorator';
import { IsEnum, IsOptional } from 'class-validator';
import { UseCaseMetaData } from './use-case-meta-data.dto';
import { AIProvider } from '../../../ai.service';
import { TimeFrame } from '../../ai-insights/entities/ai-insight.entity';
import { TransformBoolean } from '../../../../commons/decorators/transform-boolean.decorator';

export enum UserDataType {
  ENTRIES = 'ENTRIES',
}

export class ExecuteUseCaseDto extends ExportUserDataDto {
  @TransformJson
  @IsOptional()
  metaData?: UseCaseMetaData;

  @IsEnum(AIProvider)
  @IsOptional()
  aiProvider?: AIProvider;

  @IsOptional()
  timeFrame?: TimeFrame;

  @IsOptional()
  @TransformBoolean({ defaultValue: true })
  allowNotify?: boolean;
}
