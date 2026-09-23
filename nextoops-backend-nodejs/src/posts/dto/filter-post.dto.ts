import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SortType } from '../../commons/enums/sortType';
import { PaginationDto } from '../../commons/pagination/pagination.dto';
import { TransformBoolean } from '../../commons/decorators/transform-boolean.decorator';
import { PostContentType, PostType } from '../enum/post-type.enum';
import { TransformPostContentTypes } from '../../commons/decorators/transform-content-types.decorator';
import { TransformStringToArray } from '../../commons/decorators/transform-include.decorator';
import { SubjectType } from '../enum/subject-type';

export enum PostOrderBy {
  UPDATED_AT = 'UPDATED_AT',
  CREATED_AT = 'CREATED_AT',
  PUBLISHED_AT = 'PUBLISHED_AT',
  VIEWS = 'VIEWS',
}

export class FilterPostDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  @IsEnum(SubjectType)
  subjectType?: SubjectType;

  @IsOptional()
  @IsEnum(PostOrderBy)
  orderBy?: PostOrderBy;

  @IsOptional()
  @IsEnum(SortType)
  sortType?: SortType;

  @IsOptional()
  @TransformPostContentTypes
  contentTypes?: PostContentType[];

  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @TransformStringToArray
  symptomIds?: string[];

  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  includeHidden?: boolean;

  @IsOptional()
  @IsBoolean()
  @TransformBoolean({ defaultValue: false })
  includeAllTranslations: boolean;

  @IsOptional()
  @TransformStringToArray
  include?: string[];

  @IsOptional()
  startDate: Date;
  @IsOptional()
  endDate: Date;

  @IsOptional()
  @TransformStringToArray
  tagIds?: string[];

  @IsOptional()
  @TransformStringToArray
  categoriesIds?: string[];

  @IsOptional()
  @IsString()
  postRelatedId?: string;

  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  viewed?: boolean;

  @IsOptional()
  @IsNumber()
  randomNumber?: number;
}
