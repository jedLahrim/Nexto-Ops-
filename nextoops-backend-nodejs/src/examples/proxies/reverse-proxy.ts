import { NestFactory } from '@nestjs/core';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * Example of a Reverse Proxy using http-proxy-middleware in NestJS.
 * This can be used to route requests to other microservices or external APIs.
 */

@Module({})
export class ReverseProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        createProxyMiddleware({
          target: 'https://api.external-service.com',
          changeOrigin: true,
          pathRewrite: {
            '^/api/proxy': '', // remove '/api/proxy' from the path
          },
          // @ts-ignore
          on: (proxyReq: { setHeader: (arg0: string, arg1: string) => void }, req: any, res: any) => {
            // Add custom headers to the proxied request
            proxyReq.setHeader('x-proxied-by', 'Yozen-Reverse-Proxy');
          },
        }),
      )
      .forRoutes('/api/proxy');
  }
}

async function bootstrap() {
  const app = await NestFactory.create(ReverseProxyModule);
  await app.listen(3001);
}
