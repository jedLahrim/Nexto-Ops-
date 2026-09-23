import { CreateUseCaseDto } from './create-use-case.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUseCaseDto extends PartialType(CreateUseCaseDto) {}
