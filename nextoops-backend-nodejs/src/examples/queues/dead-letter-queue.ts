import { Job, Queue, Worker } from 'bullmq';

/**
 * Example of handling failed jobs using a "Dead Letter Queue" concept in BullMQ.
 * BullMQ automatically handles retries and "failed" status.
 */

const queue = new Queue('reports-queue');

// Worker with failure handling
const worker = new Worker('reports-queue', async (job: Job) => {
  if (job.data.shouldFail) {
    throw new Error('Unrecoverable error in report generation');
  }
  return { status: 'Generated' };
});

// "Dead Letter" Handling: Move to another queue or log specifically
worker.on('failed', async (job: Job | undefined, err: Error) => {
  switch (job.name) {
    case 'reports-queue':
      if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
        console.log(`Moving job ${job.id} to Dead Letter log... Reason: ${err.message}`);
        // Logic to notify developer or store in a separate DB for manual review
        await saveToDeadLetterStorage(job.id, job.data, err.message);
      }
      break;

    default:
  }
});

async function saveToDeadLetterStorage(id: string, data: any, error: string) {
  // DB log...
}
