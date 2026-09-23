import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import helmet from 'helmet';

/**
 * Example of basic security setup using Helmet and CORS.
 * Helmet sets various HTTP headers to help protect your app from well-known web vulnerabilities.
 */

@Module({})
export class SecurityHeadersModule { }

async function bootstrap() {
    const app = await NestFactory.create(SecurityHeadersModule);

    // Enable Helmet for security headers
    app.use(helmet());

    // Configure CORS securely
    app.enableCors({
        origin: ['https://yozen.com', 'https://admin.yozen.com'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    // Explicit security headers can be set if needed
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });

    await app.listen(3000);
}
