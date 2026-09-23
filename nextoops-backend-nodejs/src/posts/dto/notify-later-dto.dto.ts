import { Transform } from 'class-transformer';

export class NotifyLaterDtoDto {
  @Transform(({ value }) => new Date(value))
  date: Date;
}
