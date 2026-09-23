import { Controller, Get } from '@nestjs/common';
import { StatusService } from './status.service';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AppFeaturesHealthIndicator } from './indicators/app-features-health.indicator';
import { Constant } from '../commons/constant';

@Controller('status')
export class StatusController {
  private readonly _MAX_MEMORY_HEAP: number;

  constructor(
    private readonly statusService: StatusService,
    private readonly health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private appFeaturesHealthIndicator: AppFeaturesHealthIndicator,
    private configService: ConfigService,
  ) {
    this._MAX_MEMORY_HEAP = configService.get('MAX_MEMORY_HEAP');
  }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('webApp', Constant.WEB_APP_LINK),
      () => this.http.pingCheck('website', Constant.WEBSITE_LINK),
      () => this.db.pingCheck('database'),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      () => this.memory.checkHeap('memoryHeap', this._MAX_MEMORY_HEAP * 1024 * 1024),
    ]);
  }

  @Get('app-features')
  @HealthCheck()
  checkAppFeatures() {
    const healthIndicatorsFunctions = this.appFeaturesHealthIndicator.isHealthy().map((value) => () => value);
    return this.health.check([...healthIndicatorsFunctions]);
  }

  @Get('database')
  @HealthCheck()
  checkDatabase() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('storage')
  @HealthCheck()
  checkStorage() {
    return this.health.check([() => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 })]);
  }

  @Get('memory')
  @HealthCheck()
  checkMemory() {
    return this.health.check([() => this.memory.checkHeap('memory_heap', this._MAX_MEMORY_HEAP * 1024 * 1024)]);
  }
}
