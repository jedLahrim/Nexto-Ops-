import { PartialType } from '@nestjs/mapped-types';
import { CreateChallengeTranslationDto } from './create-challenge-translation.dto';

export class UpdateChallengeTranslationDto extends PartialType(CreateChallengeTranslationDto) {}
