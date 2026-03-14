// BullMQ job queue configuration
// Used for: email sending, PDF generation, materialized view refresh, scheduled tasks

import { Queue, Worker, type Job } from 'bullmq';
export type { Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';

// Shared Redis connection for all queues
const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,  // Required by BullMQ
  enableReadyCheck: false,
});
const connection = redis as unknown as import('bullmq').ConnectionOptions;

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

// ── Queue Definitions ──────────────────────────────────────────────────

export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 1000 },  // Keep last 1000 completed
    removeOnFail: { count: 5000 },       // Keep last 5000 failed for debugging
  },
});

export const pdfQueue = new Queue('pdf', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export const notificationQueue = new Queue('notification', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 2000 },
    removeOnFail: { count: 5000 },
  },
});

export const scheduledQueue = new Queue('scheduled', {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

// ── Worker Registration Helper ─────────────────────────────────────────

export function createWorker<T>(
  queueName: string,
  processor: (job: Job<T>) => Promise<void>,
  concurrency = 5
): Worker<T> {
  const worker = new Worker<T>(queueName, processor, {
    connection,
    concurrency,
  });

  worker.on('completed', (job) => {
    console.log(`[Queue:${queueName}] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Queue:${queueName}] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// ── Scheduled Jobs (cron) ──────────────────────────────────────────────

export async function setupScheduledJobs(): Promise<void> {
  // Vendor RFQ digest — every 6 hours
  await scheduledQueue.upsertJobScheduler('vendor-digest', {
    pattern: '0 */6 * * *',  // Every 6 hours
  }, {
    name: 'vendor-digest',
    data: { type: 'vendor_digest' },
  });

  // Refresh materialized views — 2am daily
  await scheduledQueue.upsertJobScheduler('refresh-stats', {
    pattern: '0 2 * * *',  // Daily at 2am
  }, {
    name: 'refresh-stats',
    data: { type: 'refresh_materialized_views' },
  });

  // Auto-close expired tenders — every hour
  await scheduledQueue.upsertJobScheduler('auto-close-tenders', {
    pattern: '0 * * * *',  // Every hour
  }, {
    name: 'auto-close-tenders',
    data: { type: 'auto_close_expired_tenders' },
  });

  console.log('[Queue] Scheduled jobs registered');
}

// ── Graceful Shutdown ──────────────────────────────────────────────────

export async function closeQueues(): Promise<void> {
  await emailQueue.close();
  await pdfQueue.close();
  await notificationQueue.close();
  await scheduledQueue.close();
  await redis.quit();
}
