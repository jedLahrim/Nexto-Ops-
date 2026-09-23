import { PartialType } from '@nestjs/mapped-types';
import { CreatePostTranslationDto } from './create-post-translation.dto';

export class UpdatePostTranslationDto extends PartialType(CreatePostTranslationDto) {}
