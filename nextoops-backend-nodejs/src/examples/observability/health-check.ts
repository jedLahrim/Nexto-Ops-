import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck, TypeOrmHealthIndicator } from '@nestjs/terminus';

/**
 * Example of Health Check endpoints using NestJS Terminus.
 * Used by Kubernetes or Load Balancers to determine liveness/readiness.
 */

@Controller('health')
export class HealthCheckController {
    constructor(
        private health: HealthCheckService,
        private http: HttpHealthIndicator,
        private db: TypeOrmHealthIndicator,
    ) { }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            // Check if external API is up
            () => this.http.pingCheck('google', 'https://google.com'),
            // Check if Database is reachable
            () => this.db.pingCheck('database'),
        ]);
    }
}
