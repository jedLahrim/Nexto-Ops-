import { UserType } from '../../user/enums/user-type.enum';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Attachment } from '../../attachments/entities/attachment.entity';

export class CreateTutorialDto {
  @IsString()
  name: string;
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsNotEmpty()
  videoAttachment: Attachment;
}
