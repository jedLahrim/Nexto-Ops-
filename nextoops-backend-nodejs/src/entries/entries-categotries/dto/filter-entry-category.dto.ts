import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../commons/pagination/pagination.dto';
import { SortType } from 'src/commons/enums/sortType';
import { TransformStringToArray } from '../../../commons/decorators/transform-include.decorator';

export enum EntryCategoryOrderBy {
  CREATED_AT = 'CREATED_AT',
  NAME = 'NAME',
}

export class FilterEntryCategoryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(EntryCategoryOrderBy)
  orderBy?: EntryCategoryOrderBy;

  @IsEnum(SortType)
  @IsOptional()
  sortType?: SortType;

  @IsOptional()
  @TransformStringToArray
  include?: string[];
}
