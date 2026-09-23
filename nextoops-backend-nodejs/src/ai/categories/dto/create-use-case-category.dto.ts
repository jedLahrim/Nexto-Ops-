import { IsOptional, IsString } from 'class-validator';
import { TransformBoolean } from '../../../commons/decorators/transform-boolean.decorator';

export class CreateUseCaseCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @TransformBoolean({ defaultValue: false })
  isSandbox?: boolean;
}
