import { forwardRef, Module } from '@nestjs/common';
import { UseCasesService } from './use-cases.service';
import { UseCasesController } from './use-cases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UseCase } from './entities/use-case.entity';
import { AiModule } from '../../ai.module';
import { UseCaseCategory } from '../entities/usecase-category.entity';
import { AiInsightsModule } from '../ai-insights/ai-insights.module';
import { NotificationsModule } from '../../../notifications/notifications.module';
import { EntriesModule } from '../../../entries/entries.module';
import { UseCaseTranslation } from './entities/use-case-translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UseCase, UseCaseCategory, UseCaseTranslation]), forwardRef(() => EntriesModule), AiModule, AiInsightsModule, NotificationsModule],
  controllers: [UseCasesController],
  providers: [UseCasesService, UseCasesController],
  exports: [UseCasesService, UseCasesController],
})
export class UseCasesModule {
}
