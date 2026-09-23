import { IsOptional } from 'class-validator';
import { Constant } from '../constant';

export class PaginationDto {
  @IsOptional()
  take: number;
  @IsOptional()
  skip: number;

  constructor(take?: number, skip?: number) {
    this.take = take ?? Constant.TAKE;
    this.skip = skip ?? Constant.SKIP;
  }
}
