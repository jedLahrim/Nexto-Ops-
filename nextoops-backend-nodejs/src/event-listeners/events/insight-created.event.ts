import { User } from '../../user/entities/user.entity';
import { AiInsight } from '../../ai/categories/ai-insights/entities/ai-insight.entity';

export class InsightCreatedEvent {
  createdBy: User;
  insight: AiInsight;
}
