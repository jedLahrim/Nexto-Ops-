import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { HealthCheckController } from '../observability/health-check';

/**
 * Example of an Integration Test using Supertest.
 * Tests how components interact via HTTP without starting the full server.
 */

describe('HealthCheckController (Integration)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [HealthCheckController],
            // Note: In integration tests, you'd usually provide mock/stub indicators
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('/health (GET) should check system status', () => {
        return request(app.getHttpServer())
            .get('/health')
            .expect(200);
    });

    afterAll(async () => {
        await app.close();
    });
});
