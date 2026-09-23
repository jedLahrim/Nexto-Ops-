import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TagType } from '../entities/tag.entity';
import { SubjectType } from '../../enum/subject-type';

export class CreateTagDto {
  @IsString()
  name: string;

  @IsString()
  alias: string;

  @IsEnum(TagType)
  type: TagType;

  @IsOptional()
  @IsEnum(SubjectType)
  subjectType?: SubjectType;
}
