export class ExportDataDto {
  title?: string;
  data?: Record<string, any>[];

  constructor(data?: Record<string, any>[], title?: string) {
    this.title = title;
    this.data = data;
  }
}
