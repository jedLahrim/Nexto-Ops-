import { AIModel, AIProvider } from '../ai.service';
import { IsEnum, IsOptional } from 'class-validator';

export class CreateChatAIDto {
  @IsOptional()
  model?: AIModel;

  @IsOptional()
  @IsEnum(AIProvider)
  aiProvider?: AIProvider;

  @IsOptional()
  maxResponseLength?: number;

  @IsOptional()
  userId?: string;

  @IsOptional()
  inputVariables?: Record<string, boolean | number | string>;

  @IsOptional()
  outputVariables?: Record<string, boolean | number | string>;

  @IsOptional()
  jsonSchema?: Record<string, any>;
}
