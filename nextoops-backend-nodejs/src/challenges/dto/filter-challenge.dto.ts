import { PaginationDto } from 'src/commons/pagination/pagination.dto';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { TransformBoolean } from 'src/commons/decorators/transform-boolean.decorator';
import { SortType } from 'src/commons/enums/sortType';
import { ChallengeDifficulty } from '../enum/challenge-difficulty.enum';

export enum ChallengeOrderBy {
  UPDATED_AT = 'UPDATED_AT',
  CREATED_AT = 'CREATED_AT',
}
export class FilterChallengeDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @TransformBoolean({ defaultValue: false })
  includeAllTranslations: boolean;

  @IsOptional()
  @IsEnum(ChallengeOrderBy)
  orderBy?: ChallengeOrderBy;
  @IsOptional()
  @IsEnum(SortType)
  sortType?: SortType;
  @IsOptional()
  challengeDifficulty?: ChallengeDifficulty[];

  @IsOptional()
  @IsString()
  entryCategoryId?: string;
}
