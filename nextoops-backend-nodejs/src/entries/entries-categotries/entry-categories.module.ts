import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntryCategoriesController } from './entry-categories.controller';
import { EntryCategoriesService } from './entry-categories.service';
import { EntryCategory } from './entities/entries-categotry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EntryCategory])],
  controllers: [EntryCategoriesController],
  providers: [EntryCategoriesService],
})
export class EntryCategoriesModule {}
