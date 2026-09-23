import { IsEnum, IsOptional } from 'class-validator';
import { SortType } from '../../commons/enums/sortType';
import { PaginationDto } from '../../commons/pagination/pagination.dto';

export enum NotificationOrderBy {
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
}

export class FilterNotificationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SortType)
  sortType?: SortType;

  @IsEnum(NotificationOrderBy)
  @IsOptional()
  orderBy?: NotificationOrderBy;
}
