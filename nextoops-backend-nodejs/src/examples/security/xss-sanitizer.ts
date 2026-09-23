import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as xss from 'xss';

/**
 * Example of an XSS Sanitizer Interceptor.
 * It automatically cleans incoming body and query parameters from malicious scripts.
 */

@Injectable()
export class XssSanitizerInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();

        if (req.body) {
            req.body = this.sanitize(req.body);
        }
        if (req.query) {
            req.query = this.sanitize(req.query);
        }

        return next.handle();
    }

    private sanitize(data: any): any {
        if (typeof data === 'string') {
            return xss.filterXSS(data);
        }

        if (typeof data === 'object' && data !== null) {
            Object.keys(data).forEach((key) => {
                data[key] = this.sanitize(data[key]);
            });
        }

        return data;
    }
}
