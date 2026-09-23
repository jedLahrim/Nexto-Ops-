import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SortType } from '../../commons/enums/sortType';
import { PaginationDto } from '../../commons/pagination/pagination.dto';

export enum TaskOrderBy {
  UPDATED_AT = 'UPDATED_AT',
  CREATED_AT = 'CREATED_AT',
  NAME = 'NAME',
}

export class TaskFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TaskOrderBy)
  orderBy?: TaskOrderBy;

  @IsOptional()
  @IsEnum(SortType)
  sortType?: SortType;

}
