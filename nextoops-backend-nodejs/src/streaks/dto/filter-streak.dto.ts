import { UserType } from '../../user/enums/user-type.enum';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { SortType } from '../../commons/enums/sortType';
import { PaginationDto } from '../../commons/pagination/pagination.dto';

export enum StreakOrderBy {
  UPDATED_AT = 'UPDATED_AT',
  CREATED_AT = 'CREATED_AT',
  ENTRY_AT = 'ENTRY_AT',
}

export class FilterStreakDto extends PaginationDto {
  @IsOptional()
  @IsEnum(StreakOrderBy)
  orderBy?: StreakOrderBy;

  @IsOptional()
  @IsEnum(SortType)
  sortType?: SortType;

}
