import { UserType } from '../../user/enums/user-type.enum';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { SortType } from '../../commons/enums/sortType';
import { PaginationDto } from '../../commons/pagination/pagination.dto';

export enum TutorialOrderBy {
  UPDATED_AT = 'UPDATED_AT',
  CREATED_AT = 'CREATED_AT',
}

export class FilterTutorialDto extends PaginationDto {
  @IsEnum(UserType)
  @IsOptional()
  userType: UserType;

  @IsOptional()
  @IsEnum(TutorialOrderBy)
  orderBy?: TutorialOrderBy;

  @IsOptional()
  @IsEnum(SortType)
  sortType?: SortType;

  @IsOptional()
  @IsBoolean()
  mine: boolean;
}
