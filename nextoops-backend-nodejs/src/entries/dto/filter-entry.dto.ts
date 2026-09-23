import { PaginationDto } from 'src/commons/pagination/pagination.dto';
import { IsOptional, IsString } from 'class-validator';
import { TransformStringToArray } from '../../commons/decorators/transform-include.decorator';
export class FilterEntryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;


  @IsOptional()
  @IsString()
  entryCategoryId?: string;

  @IsOptional()
  startDate: Date;
  @IsOptional()
  endDate: Date;

  @IsOptional()
  @TransformStringToArray
  include?: string[];
}
