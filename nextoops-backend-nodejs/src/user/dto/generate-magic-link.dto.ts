import { IsOptional, IsString } from 'class-validator';
import { TransformJson } from '../../commons/decorators/transform-json.decorator';

export class GenerateMagicLinkDto {
  @IsString()
  userId: string;
  @TransformJson
  @IsOptional()
  metaData?: JSON;
}
