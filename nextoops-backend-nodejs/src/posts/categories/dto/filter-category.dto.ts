import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { SortType } from '../../../commons/enums/sortType';
import { PaginationDto } from '../../../commons/pagination/pagination.dto';
import { getTrimesterByWeek } from '../../../commons/utils';
import { SubjectType } from '../../enum/subject-type';

export enum CategoryOrderBy {
  CREATED_AT = 'CREATED_AT',
  NAME = 'NAME',
}

export class FilterCategoryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CategoryOrderBy)
  orderBy?: CategoryOrderBy;

  @IsOptional()
  @IsNumber()
  week?: number;
  @IsOptional()
  @IsEnum(SortType)
  sortType?: SortType;
  @IsOptional()
  @IsEnum(SubjectType)
  subjectType?: SubjectType;

  get trimester(): number | null {
    return getTrimesterByWeek(this.week);
  }
}
