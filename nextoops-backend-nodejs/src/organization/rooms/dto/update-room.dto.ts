import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { RoomType } from '../enums/room-type.enum';

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(RoomType)
  @IsOptional()
  roomType?: RoomType;

  @IsString()
  @IsOptional()
  building?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
