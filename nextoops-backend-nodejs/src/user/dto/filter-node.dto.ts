import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserType } from '../../user/enums/user-type.enum';
import { PaginationDto } from '../../commons/pagination/pagination.dto';
import { TransformStringToArray } from '../../commons/decorators/transform-include.decorator';
import { SortType } from '../../commons/enums/sortType';

export enum NodeOrderBy {
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
  NAME = 'NAME',
}

export class FilterNodeDto extends PaginationDto {
  @IsOptional()
  @TransformStringToArray
  userTypes?: UserType[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(NodeOrderBy)
  orderBy?: NodeOrderBy;

  @IsOptional()
  @IsEnum(SortType)
  sortType?: SortType;

  @IsOptional()
  @IsBoolean()
  forceBusinessUsersOnly?: boolean;

  @IsOptional()
  depth?: number;

  @IsOptional()
  exactDepth?: boolean;

  @IsOptional()
  @TransformStringToArray
  include?: string[];

  constructor(
    take: number,
    skip: number,
    depth?: number,
    userTypes?: UserType[],
    search?: string,
    exactDepth?: boolean,
    include?: string[],
    orderBy?: NodeOrderBy,
  ) {
    super(take, skip);
    this.userTypes = userTypes;
    this.search = search;
    this.depth = depth;
    this.exactDepth = exactDepth;
    this.include = include;
    this.orderBy = orderBy;
  }
}
