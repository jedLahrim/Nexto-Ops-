import { PartialType } from '@nestjs/mapped-types';
import { CreateEntryCategoryDto } from './create-entries-categotry.dto';

export class UpdateEntriesCategotryDto extends PartialType(CreateEntryCategoryDto) {}
