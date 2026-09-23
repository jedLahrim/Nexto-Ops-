import { AiInsightActions } from '../enum/ai-insight-actions.enum';
import { IsEnum } from 'class-validator';

export class ModifyAiInsightDto {
  @IsEnum(AiInsightActions)
  iInsightActions: AiInsightActions;
}
