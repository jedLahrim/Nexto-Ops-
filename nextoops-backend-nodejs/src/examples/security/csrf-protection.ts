import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import * as csurf from 'csurf';
import * as cookieParser from 'cookie-parser';

/**
 * Example of CSRF protection setup.
 * Note: csurf is deprecated but often used as a reference. 
 * Modern apps typically use SameSite: Strict/Lax cookies instead.
 */

@Module({})
export class CsrfProtectionModule { }

async function bootstrap() {
    const app = await NestFactory.create(CsrfProtectionModule);

    // Cookie parser is required for csurf
    app.use(cookieParser());

    // Apply CSRF protection
    app.use(csurf({ cookie: true }));

    // Middleware to provide the CSRF token to the client (e.g., in a header or cookie)
    app.use((req: any, res: any, next: any) => {
        const token = req.csrfToken();
        res.cookie('XSRF-TOKEN', token);
        res.locals.csrfToken = token;
        next();
    });

    await app.listen(3000);
}
