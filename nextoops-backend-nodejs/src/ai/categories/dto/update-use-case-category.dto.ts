import { PartialType } from '@nestjs/mapped-types';
import { CreateUseCaseCategoryDto } from './create-use-case-category.dto';

export class UpdateUseCaseCategoryDto extends PartialType(CreateUseCaseCategoryDto) {}
