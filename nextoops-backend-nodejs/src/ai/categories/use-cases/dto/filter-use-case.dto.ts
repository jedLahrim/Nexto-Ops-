import { PaginationDto } from '../../../../commons/pagination/pagination.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { SortType } from '../../../../commons/enums/sortType';
import { TransformStringToArray } from '../../../../commons/decorators/transform-include.decorator';
import { UseCaseLength } from '../entities/use-case.entity';
import { LanguageCode } from '../../../../user/enums/language-code';

export enum UseCaseOrderBy {
  UPDATED_AT = 'UPDATED_AT',
  CREATED_AT = 'CREATED_AT',
  TEXT = 'TEXT',
}

export class FilterUseCaseDto extends PaginationDto {
  @IsEnum(UseCaseOrderBy)
  @IsOptional()
  orderBy?: UseCaseOrderBy;

  @IsOptional()
  @IsEnum(SortType)
  sortType?: SortType;

  @IsOptional()
  categoryId: string;

  @IsOptional()
  entryCategoryId: string;

  @IsOptional()
  @TransformStringToArray
  include?: string[];

  @IsOptional()
  @IsEnum(UseCaseLength)
  length?: UseCaseLength;
}
