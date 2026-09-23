import { Module } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntryCategory } from 'src/entries/entries-categotries/entities/entries-categotry.entity';
import { Challenge } from './entities/challenge.entity';
import { HashGuard } from 'src/user/guards/hash.guard';
import { JwtAuthGuard } from 'src/user/guards/jwt-auth.guard';
import { UserChallenge } from './entities/user-challenge.entity';
import { Entry } from 'src/entries/entities/entry.entity';
import { ChallengeTranslation } from './entities/challenge-translation.entity';

@Module({
  controllers: [ChallengesController],
  providers: [ChallengesService, JwtAuthGuard, HashGuard],
  imports: [TypeOrmModule.forFeature([Challenge, EntryCategory, UserChallenge, Entry, ChallengeTranslation])],
  exports: [ChallengesService],
})
export class ChallengesModule {}
