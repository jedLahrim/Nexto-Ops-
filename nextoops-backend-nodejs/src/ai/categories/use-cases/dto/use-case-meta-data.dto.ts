import { ArrayNotEmpty, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserDataType } from './execute-use-case.dto';
import { FilterEntryDto } from '../../../../entries/dto/filter-entry.dto';

export enum TimelineType {
  RELATIVE = 'RELATIVE',
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  ALL_TIME = 'ALL_TIME',
}

export class LastTimeLine {
  @IsOptional()
  years?: number;
  @IsOptional()
  months?: number;
  @IsOptional()
  days?: number;
  @IsOptional()
  hours?: number;
  @IsOptional()
  minutes?: number;
  @IsOptional()
  seconds?: number;
  @IsOptional()
  milliseconds?: number;

  @IsEnum(TimelineType)
  type: TimelineType;
}

export class UsedUserMetaData {
  @IsOptional()
  @ValidateNested()
  @Type(() => LastTimeLine)
  lastTimeline?: LastTimeLine;

  @IsOptional()
  @ArrayNotEmpty()
  @IsEnum(UserDataType, { each: true })
  userDataTypes?: UserDataType[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterEntryDto)
  filterEntryDto?: FilterEntryDto;
}

export class UseCaseMetaData {
  @IsOptional()
  @ValidateNested()
  @Type(() => UsedUserMetaData)
  usedUserData?: UsedUserMetaData;
}
