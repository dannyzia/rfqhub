// BullMQ workers — process background jobs
// Run as a separate process: ts-node-dev src/workers/index.ts

import { createWorker } from '../config/queue';
import type { Job } from 'bullmq';
import { emailService } from '../services/email.service';
import { pdfService } from '../services/pdf.service';
import { db } from '../config/database';
import { sql } from 'drizzle-orm';

// ── Email Worker ───────────────────────────────────────────────

interface EmailJob {
  to: string;
  templateKey: string;
  variables: Record<string, unknown>;
}

createWorker<EmailJob>('email', async (job: Job<EmailJob>) => {
  const { to, templateKey, variables } = job.data;
  await emailService.sendTemplated(to, templateKey, variables);
}, 3);  // 3 concurrent email sends

// ── PDF Worker ─────────────────────────────────────────────────

interface PDFJob {
  type: 'procurement_report' | 'evaluation_report';
  data: any;
  callbackUrl?: string;  // Where to POST the generated PDF
}

createWorker<PDFJob>('pdf', async (job: Job<PDFJob>) => {
  const { type, data } = job.data;

  let buffer: Buffer;
  if (type === 'procurement_report') {
    buffer = await pdfService.generateProcurementReport(data);
  } else if (type === 'evaluation_report') {
    buffer = await pdfService.generateEvaluationReport(data);
  } else {
    throw new Error(`Unknown PDF type: ${type}`);
  }

  // TODO: Upload to R2 and notify user
  console.log(`[PDF Worker] Generated ${type} (${buffer.length} bytes)`);
}, 2);  // 2 concurrent PDF generations

// ── Notification Worker ────────────────────────────────────────

interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  message: string;
  payload?: object;
}

createWorker<NotificationJob>('notification', async (job: Job<NotificationJob>) => {
  // Direct DB insert + Socket.io push handled by notificationService.create()
  const { notificationService } = await import('../services/notification.service');
  await notificationService.create({
    recipient_id: job.data.userId,
    type: job.data.type,
    title: job.data.title,
    message: job.data.message,
    payload: job.data.payload ?? null,
    channel: 'both',
  });
}, 10);  // High concurrency for notifications

// ── Scheduled Job Worker ───────────────────────────────────────

interface ScheduledJob {
  type: string;
}

createWorker<ScheduledJob>('scheduled', async (job: Job<ScheduledJob>) => {
  switch (job.data.type) {
    case 'vendor_digest':
      console.log('[Scheduled] Running vendor RFQ digest...');
      // TODO: Aggregate new RFQs, send digest email to vendor orgs
      break;

    case 'refresh_materialized_views':
      console.log('[Scheduled] Refreshing materialized views...');
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_procurement_stats`);
      break;

    case 'auto_close_expired_tenders':
      console.log('[Scheduled] Auto-closing expired tenders...');
      await db.execute(sql`
        UPDATE tenders
        SET status = 'closed', updated_at = NOW()
        WHERE status IN ('published', 'open')
        AND submission_deadline < NOW()
      `);
      break;

    default:
      console.warn(`[Scheduled] Unknown job type: ${job.data.type}`);
  }
}, 1);  // Sequential for scheduled jobs

console.log('[Workers] All workers started');
