import { IsArray, IsBoolean, IsDate, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PostContentType, PostType } from '../enum/post-type.enum';
import { Tag } from '../tags/entities/tag.entity';
import { Post } from '../entities/post.entity';
import { CreatePostTranslationDto } from './create-post-translation.dto';
import { Type } from 'class-transformer';
import { Category } from '../categories/entities/category.entity';
import { SubjectType } from '../enum/subject-type';
import { TransformBoolean } from '../../commons/decorators/transform-boolean.decorator';

export class CreatePostDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsArray()
  tags?: Tag[];

  @IsOptional()
  @IsArray()
  categories?: Category[];

  @IsEnum(PostType)
  type: PostType;

  @IsOptional()
  @IsEnum(PostContentType)
  contentType?: PostContentType;

  @IsOptional()
  @IsEnum(SubjectType)
  subjectType?: SubjectType;

  @IsOptional()
  @IsBoolean()
  alwaysVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  // day to make daily insight published if null will be as createdAt
  @IsOptional()
  @IsDate()
  publishedAt?: Date;

  // day to make daily insight will be unpublished if null will stick until will be archived (soft delete)
  @IsOptional()
  @IsDate()
  unpublishedAt?: Date;

  @IsBoolean()
  @TransformBoolean({ defaultValue: true })
  visible: boolean;

  @IsOptional()
  relatedPosts?: Post[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePostTranslationDto)
  translations: CreatePostTranslationDto[];
}
