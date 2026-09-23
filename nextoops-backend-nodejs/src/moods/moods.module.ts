import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mood } from './entities/mood.entity';
import { MoodsService } from './moods.service';
import { MoodsController } from './moods.controller';
import { Entry } from '../entries/entities/entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mood, Entry])],
  controllers: [MoodsController],
  providers: [MoodsService],
  exports: [MoodsService],
})
export class MoodsModule {}
