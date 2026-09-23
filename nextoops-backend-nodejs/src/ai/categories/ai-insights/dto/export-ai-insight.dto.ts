import { IsEnum } from 'class-validator';
import { ExportType } from '../../../../exports/export-data/enum/export-type.enum';

export class ExportAiInsightDto {
  @IsEnum(ExportType)
  exportType: ExportType;
}
