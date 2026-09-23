import { IsEnum, IsOptional } from 'class-validator';
import { UserType } from '../../user/enums/user-type.enum';
import { PaginationDto } from '../../commons/pagination/pagination.dto';

export class FilterFaqDto extends PaginationDto {
  @IsEnum(UserType)
  @IsOptional()
  userType: UserType;
}
