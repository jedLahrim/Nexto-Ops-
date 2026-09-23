import { Module } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { UserModule } from 'src/user/user.module';
import { HashGuard } from 'src/user/guards/hash.guard';
import { JwtAuthGuard } from 'src/user/guards/jwt-auth.guard';
import { Suggestion } from './entities/suggestion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Suggestion, User]),
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [SuggestionsController],
  providers: [SuggestionsService, HashGuard, JwtAuthGuard],
  exports: [SuggestionsService],
})
export class SuggestionsModule {}
