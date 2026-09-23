import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Example of Correlation ID Middleware.
 * It assigns a unique ID to every request, allowing you to trace logs across different services.
 */

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: any, res: any, next: () => void) {
        // Check if correlation ID already exists in headers (passed from ingress/gateway)
        const correlationId = req.headers['x-correlation-id'] || uuidv4();

        // Attach to request for logging
        req.correlationId = correlationId;

        // Return to client in headers
        res.setHeader('x-correlation-id', correlationId);

        next();
    }
}
