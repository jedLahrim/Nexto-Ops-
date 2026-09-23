import { PaginationDto } from 'src/commons/pagination/pagination.dto';
import { IsOptional } from 'class-validator';

export class FilterMoodDto extends PaginationDto {
  @IsOptional()
  startDate: Date;
  @IsOptional()
  endDate: Date;
}
