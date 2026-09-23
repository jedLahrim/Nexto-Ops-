import * as winston from 'winston';

/**
 * Example of Structured Logging with Winston.
 * It formats logs as JSON for easy ingestion by ELK/Splunk/Datadog.
 */

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'yozen-backend' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Usage
// logger.error('Database connection failed', { errorCode: 500, db: 'postgres' });
// logger.info('User logged in', { userId: 123 });
