import { IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ChallengeDifficulty } from '../enum/challenge-difficulty.enum';
import { Attachment } from 'src/attachments/entities/attachment.entity';
import { Expose, Type } from 'class-transformer';
import { CreateChallengeTranslationDto } from './create-challenge-translation.dto';
import { GradientBgType } from '../../entries/entries-categotries/enums/gradient-type.enum';

export class CreateChallengeDto {
  @IsString()
  name: string;
  @IsString()
  alias: string;

  // @IsOptional()
  @IsString()
  entryCategoryId: string;

  // @IsOptional()
  @IsString()
  useCaseId: string;

  @IsOptional()
  @IsEnum(ChallengeDifficulty)
  challengeDifficulty?: ChallengeDifficulty;

  @IsOptional()
  duration?: number;

  @IsInt()
  participantsCount?: number;

  @IsOptional()
  photoAttachment?: Attachment;



  @IsEnum(GradientBgType)
  colorType: GradientBgType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateChallengeTranslationDto)
  translations: CreateChallengeTranslationDto[];
}
