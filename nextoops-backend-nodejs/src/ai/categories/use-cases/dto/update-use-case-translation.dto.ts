import { PartialType } from '@nestjs/mapped-types';
import { CreateUseCaseTranslationDto } from './create-use-case-translation.dto';

export class UpdateUseCaseTranslationDto extends PartialType(CreateUseCaseTranslationDto) {
}

