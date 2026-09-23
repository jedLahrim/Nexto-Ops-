import { User } from '../../user/entities/user.entity';
import { AiInsight } from '../../ai/categories/ai-insights/entities/ai-insight.entity';
import { ExecuteUseCaseDto } from '../../ai/categories/use-cases/dto/execute-use-case.dto';

export class SubscriptionChangedEvent {
  userId: string;
}
