import { Module } from '@nestjs/common';
import { ExportDataService } from './export-data.service';

@Module({
  providers: [ExportDataService],
  exports: [ExportDataService],
})
export class ExportDataModule {}
