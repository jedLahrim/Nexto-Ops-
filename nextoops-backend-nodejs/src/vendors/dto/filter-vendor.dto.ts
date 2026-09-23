import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../commons/pagination/pagination.dto';
import { VendorCategory } from '../enums/vendor-category.enum';
import { VendorStatus } from '../enums/vendor-status.enum';

export class FilterVendorDto extends PaginationDto {
  @IsEnum(VendorCategory)
  @IsOptional()
  category?: VendorCategory;

  @IsEnum(VendorStatus)
  @IsOptional()
  status?: VendorStatus;
}
