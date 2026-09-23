import { Module } from '@nestjs/common';
import { StreaksService } from './streaks.service';
import { StreaksController } from './streaks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Streak } from './entities/streak.entity';

@Module({

  imports: [TypeOrmModule.forFeature([Streak])],
  providers: [StreaksService],
  controllers: [StreaksController],
  exports: [StreaksService],
})
export class StreaksModule {}
