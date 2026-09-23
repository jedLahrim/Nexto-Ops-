import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Example of API Key Authentication Strategy.
 * Simple but effective for service-to-service communication or public APIs.
 */

@Injectable()
export class ApiKeyGuard implements CanActivate {
    private readonly VALID_API_KEY = process.env.SERVICE_API_KEY || 'yozen_secret_key_2025';

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey || apiKey !== this.VALID_API_KEY) {
            throw new UnauthorizedException('Invalid or missing API Key');
        }

        return true;
    }
}
