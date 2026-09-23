import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VendorCategory } from '../enums/vendor-category.enum';
import { VendorStatus } from '../enums/vendor-status.enum';

export class CreateVendorDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(VendorCategory)
  category: VendorCategory;

  @IsEnum(VendorStatus)
  @IsOptional()
  status?: VendorStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
