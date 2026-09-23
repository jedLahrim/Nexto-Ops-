import { Injectable } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';

/**
 * Example of a Producer-Consumer pattern using BullMQ (Redis-based).
 * One part of the app adds jobs to the queue, while workers process them asynchronously.
 */

@Injectable()
export class BullQueueExample {
    private mailQueue = new Queue('mail-sending', {
        connection: { host: 'localhost', port: 6379 },
    });

    // --- PRODUCER ---
    async sendEmail(userId: string, content: string) {
        console.log(`Adding email job for user ${userId} to queue...`);
        await this.mailQueue.add(
            'send-welcome-email',
            { userId, content },
            { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
        );
    }

    async sendPasswordReset(userId: string, resetLink: string) {
        await this.mailQueue.add(
            'send-password-reset',
            { userId, resetLink },
        );
    }

    // --- CONSUMER (Worker) ---
    // In a real app, this might be in a separate process/file
    private initializeWorker() {
        const worker = new Worker(
            'mail-sending',
            async (job: Job) => {
                // Here is how you differentiate between multiple events/jobs in one queue:
                switch (job.name) {
                    case 'send-welcome-email':
                        console.log(`Sending welcome email to user ${job.data.userId}`);
                        await this.processWelcomeEmail(job.data);
                        break;

                    case 'send-password-reset':
                        console.log(`Sending reset link to user ${job.data.userId}`);
                        await this.processPasswordReset(job.data);
                        break;

                    default:
                }

                console.log(`Job ${job.id} (${job.name}) completed!`);
            },
            { connection: { host: 'localhost', port: 6379 } },
        );

        worker.on('failed', (job, err) => {
            console.error(`Job ${job?.id} failed: ${err.message}`);
        });
    }

    private async processWelcomeEmail(data: any) { /* Logic */ }
    private async processPasswordReset(data: any) { /* Logic */ }
}
