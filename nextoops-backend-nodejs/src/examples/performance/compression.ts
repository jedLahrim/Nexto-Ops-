import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import * as compression from 'compression';

/**
 * Example of HTTP Compression setup.
 * Reduces the size of response bodies, which improves performance and saves bandwidth.
 */

@Module({})
export class CompressionModule {}

async function bootstrap() {
  const app = await NestFactory.create(CompressionModule);

  // Apply Gzip/Brotli compression to all responses
  app.use(
    compression({
      // level between 1 - 10
      level: 6, // Tradeoff between CPU and compression ratio
      threshold: 1024, // Only compress if payload > 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    }),
  );

  await app.listen(3000);
}
