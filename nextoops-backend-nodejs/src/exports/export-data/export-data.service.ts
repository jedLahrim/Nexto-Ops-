import { BadRequestException, Injectable } from '@nestjs/common';
import * as excel from 'exceljs';
import { ExportType } from './enum/export-type.enum';
import { AppError } from '../../commons/errors/app-error';
import { ERR_EXPORT_DOCUMENT } from '../../commons/errors/errors-codes';
import { Response } from 'express';
import { ExportProvider } from './enum/export-provider.enum';
import * as xlsx from 'xlsx';
import { WritingOptions } from 'xlsx';
import { first, isEmpty } from 'lodash';
import { ExportDataDto } from '../../user/dto/export-data.dto';

@Injectable()
export class ExportDataService {
  constructor() {}

  async export(
    dataDtos: ExportDataDto[],
    docName: string,
    exportType: ExportType,
    sheetNames: string[],
    res: Response,
    exportProvider: ExportProvider,
  ) {
    switch (exportProvider) {
      case ExportProvider.EXCEL_JS:
        await this.exportUsingExelJs(dataDtos, docName, exportType, sheetNames, res);
        break;
      case ExportProvider.XLSX:
        await this._exportUsingXlsx(dataDtos, docName, exportType, sheetNames, res);
        break;
    }
  }

  _getFileNameByExportType(type: ExportType, docName: string) {
    // Save the workbook to a file
    const exportedAt = new Date().toISOString().replace('/', '_');
    const ext = this._getExtensionByExportType(type);
    return `SenLife_Document_${docName}_${exportedAt}.${ext}`;
  }

  _getExtensionByExportType(type: ExportType) {
    switch (type) {
      case ExportType.PDF:
        return 'pdf';
      case ExportType.CSV:
        return 'csv';
      case ExportType.EXCEL:
        return 'xlsx';
    }
  }

  private _setColumnsInWorkSheet<T>(childData: T[], worksheet: excel.Worksheet) {
    if (childData.length != 0)
      // Set the columns in the worksheet
      worksheet.columns = Object.keys(childData[0]).map((key) => ({
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '#15ce93' },
        },
        header: key,
        key: key,
        width: 20, // You can set a default width here
        font: { color: { argb: '#40C8F1' } },
      })) as Partial<excel.Column>[];
  }

  private _initExcelJs(workbook: excel.Workbook, sheetNames: string[]): excel.Worksheet[] {
    // Create a new Excel workbook and worksheet
    return sheetNames.map((sheetName) => workbook.addWorksheet(sheetName));
  }

  private _addDataToWorkSheet<T>(childData: T[], worksheet: excel.Worksheet) {
    childData.forEach((row) => {
      worksheet.addRow(row);
    });
  }

  private async _exportUsingXlsx(
    dataDtos: ExportDataDto[],
    docName: string,
    exportType: ExportType,
    sheetNames: string[],
    res: Response,
  ) {
    switch (exportType) {
      case ExportType.EXCEL:
        const filename = this._getFileNameByExportType(exportType, docName);
        const worksheets = this._convertDataToWorksheets(dataDtos);
        try {
          const workbook = xlsx.utils.book_new();
          const buffer = this._getFileBuffer(sheetNames, workbook, worksheets);
          this._downloadExcelFile(res, filename, buffer);
        } catch (e) {
          throw new BadRequestException(new AppError(ERR_EXPORT_DOCUMENT));
        }
        break;
      case ExportType.PDF:
        //TODO
        break;
      case ExportType.CSV:
        //TODO
        break;
    }
  }

  private async exportUsingExelJs(
    dataDtos: ExportDataDto[],
    docName: string,
    exportType: ExportType,
    sheetNames: string[],
    res: Response,
  ) {
    const filename = this._getFileNameByExportType(exportType, docName);
    switch (exportType) {
      case ExportType.EXCEL:
        const workbook = new excel.Workbook();
        const worksheets = this._initExcelJs(workbook, sheetNames);
        dataDtos.forEach((value, index) => {
          this._setColumnsInWorkSheet(value.data, worksheets[index]);
          // Add the data to the worksheet
          this._addDataToWorkSheet(value.data, worksheets[index]);
        });

        try {
          // res.contentType('text/xlsx');
          // res.contentType('application/vnd.ms-excel');

          // from buffer
          const buffer = await workbook.xlsx.writeBuffer();
          this._downloadExcelFile(res, filename, buffer);
          // from stream
          /*await workbook.xlsx.writeFile(path);
          const file = await fs.createReadStream(path);
          file.pipe(res);*/
        } catch (e) {
          throw new BadRequestException(new AppError(ERR_EXPORT_DOCUMENT));
        }
        break;
      case ExportType.CSV:
        // TODO:
        break;
      case ExportType.PDF:
        // TODO:
        break;
    }
  }

  private _downloadExcelFile(res: Response, filename: string, buffer: excel.Buffer) {
    res.attachment(filename);
    res.contentType('application/xlsx');
    res.send(buffer);
  }

  private _getFileBuffer(sheetNames: string[], workbook: xlsx.WorkBook, worksheets: xlsx.WorkSheet[]) {
    // Add worksheets to the workbook
    worksheets.forEach((worksheet, index) => {
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetNames[index]);
    });

    // Convert the workbook to an Excel file buffer
    return xlsx.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    } as WritingOptions);
  }

  private _convertDataToWorksheets(dataDtos: ExportDataDto[]): xlsx.WorkSheet[] {
    return dataDtos
      .filter((value) => !isEmpty(value.data))
      .map((value) =>
        xlsx.utils.json_to_sheet(value.data, {
          header: Object.keys(first(value.data)),
        }),
      );
  }
}
