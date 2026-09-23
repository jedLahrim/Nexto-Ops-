import { Module } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';

@Module({})
export class FastifyModule {}

export async function bootstrap() {
  const app = await NestFactory.create(FastifyModule, new FastifyAdapter({ logger: true }) as any);

  // todo 1. Helmet — security headers
  // app.use(fastifyHelmet());

  // todo 2. Rate limiting
  //   app.use(rateLimit({ windowMs: 60000, max: 100 }));

  // todo 3. Input validation
  //   app.post('/order', validateSchema(orderSchema), handler);

  // todo 4. CORS locked down
  //   app.use(cors({ origin: ['https://myapp.com'] }));

  // todo 5. JWT short-lived + refresh token rotation
  // Access token: 15min, Refresh token: 7 days

  // todo 6. Secrets in env vars, never hardcoded

  await app.listen(3000);
}
bootstrap();
