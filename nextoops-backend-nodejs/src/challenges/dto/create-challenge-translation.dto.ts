import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LanguageCode } from '../../user/enums/language-code';
import { TransformJson } from '../../commons/decorators/transform-json.decorator';
import { WhatToExpect } from '../entities/challenge-translation.entity';

export class CreateChallengeTranslationDto {
  @IsString()
  title: string;

  @IsEnum(LanguageCode)
  languageCode: LanguageCode;

  @IsString()
  description: string;

  @TransformJson
  @IsOptional()
  whatToExpect?: WhatToExpect;
}
