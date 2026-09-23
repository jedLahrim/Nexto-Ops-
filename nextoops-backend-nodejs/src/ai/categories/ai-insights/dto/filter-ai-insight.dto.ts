import { PaginationDto } from '../../../../commons/pagination/pagination.dto';
import { SortType } from '../../../../commons/enums/sortType';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TimeFrame } from '../entities/ai-insight.entity';

export enum AiInsightOrderBy {
  UPDATED_AT = 'UPDATED_AT',
  CREATED_AT = 'CREATED_AT',
}

export class FilterAiInsightDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AiInsightOrderBy)
  orderBy: AiInsightOrderBy;

  @IsOptional()
  @IsEnum(SortType)
  sortType: SortType;

  @IsOptional()
  @IsEnum(TimeFrame)
  timeFrame?: TimeFrame;
}
