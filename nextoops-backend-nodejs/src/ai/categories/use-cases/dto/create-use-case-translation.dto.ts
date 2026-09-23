import { IsEnum, IsString } from 'class-validator';
import { LanguageCode } from '../../../../user/enums/language-code';

export class CreateUseCaseTranslationDto {
  @IsString()
  shortText: string;

  @IsEnum(LanguageCode)
  languageCode: LanguageCode;
}

