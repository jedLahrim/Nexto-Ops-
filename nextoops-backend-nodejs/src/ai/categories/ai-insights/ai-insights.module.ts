import { Module } from '@nestjs/common';
import { AiInsightsService } from './ai-insights.service';
import { AiInsightsController } from './ai-insights.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiInsight } from './entities/ai-insight.entity';
import { AiModule } from '../../ai.module';
import { ShareModule } from '../../../share/share.module';
import { PermissionModule } from '../../../permission/permission.module';
import { NotificationsModule } from '../../../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([AiInsight]), AiModule, ShareModule, PermissionModule, NotificationsModule],
  controllers: [AiInsightsController],
  providers: [AiInsightsService],
  exports: [AiInsightsService],
})
export class AiInsightsModule {}
