import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { AppFeaturesHealthIndicator } from './indicators/app-features-health.indicator';

@Module({
  controllers: [StatusController],
  providers: [StatusService, AppFeaturesHealthIndicator],
  imports: [TerminusModule, ConfigModule],
})
export class StatusModule {}
