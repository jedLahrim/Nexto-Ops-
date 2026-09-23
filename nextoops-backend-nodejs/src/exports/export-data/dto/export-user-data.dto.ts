import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ExportType } from '../enum/export-type.enum';
import { Transform } from 'class-transformer';

export class StartEndDateDto {
  @IsOptional()
  // @Transform(({ value }) => new Date(value))
  startDate?: Date;
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  endDate?: Date;

}

export class ExportUserDataDto extends StartEndDateDto {
  @IsEnum(ExportType)
  @IsOptional()
  exportType?: ExportType;

  @IsOptional()
  @IsString()
  userId: string;
}
