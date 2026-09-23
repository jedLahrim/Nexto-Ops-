import { PaginationDto } from '../../../commons/pagination/pagination.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { SortType } from '../../../commons/enums/sortType';
import { TransformStringToArray } from '../../../commons/decorators/transform-include.decorator';

export enum CategoryOrder {
  UPDATED_AT = 'UPDATED_AT',
  CREATED_AT = 'CREATED_AT',
  NAME = 'NAME',
}

export class FilterInsightCategoryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CategoryOrder)
  orderBy?: CategoryOrder;

  @IsOptional()
  @IsEnum(SortType)
  sortType?: SortType;

  @IsOptional()
  @TransformStringToArray
  include?: string[];
}
