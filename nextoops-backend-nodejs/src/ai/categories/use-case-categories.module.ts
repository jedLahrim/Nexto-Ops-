import { Module } from '@nestjs/common';
import { UseCaseCategoriesService } from './use-case-categories.service';
import { UseCaseCategoriesController } from './use-case-categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UseCaseCategory } from './entities/usecase-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UseCaseCategory])],
  controllers: [UseCaseCategoriesController],
  providers: [UseCaseCategoriesService],
})
export class UseCaseCategoriesModule {}
