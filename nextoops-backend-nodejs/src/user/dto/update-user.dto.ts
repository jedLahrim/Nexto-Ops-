import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  userId?: string;

  // as PartialType can't have @TransformBoolean
  @IsOptional()
  allowUpdateMailing: boolean = true;
}
