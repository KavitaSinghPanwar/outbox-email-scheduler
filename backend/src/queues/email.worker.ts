import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME } from './email.queue';
import { redisConnection } from '../config/redis';
import { config } from '../config/env';
import { prisma } from '../services/prisma.service';
import { mailerService } from '../services/mailer.service';

interface EmailJobData {
  emailId: string;
}

export function startEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { emailId } = job.data;
      console.log(`⚙️ Worker processing job ${job.id} for Email ID ${emailId}`);

      const email = await prisma.email.findUnique({
        where: { id: emailId },
      });

      if (!email) {
        console.warn(`⚠️ Email record ${emailId} not found in database. Skipping.`);
        return;
      }

      if (email.status !== 'SCHEDULED') {
        console.log(`ℹ️ Email record ${emailId} already processed (status: ${email.status}). Skipping.`);
        return;
      }

      try {
        const result = await mailerService.sendEmail({
          to: email.to,
          subject: email.subject,
          body: email.body,
        });

        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            etherealPreviewUrl: result.previewUrl || null,
            error: null,
          },
        });

        console.log(`✅ Job ${job.id} completed: Email ${emailId} updated to SENT.`);
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error occurred while sending email';
        console.error(`❌ Job ${job.id} failed for Email ${emailId}: ${errorMessage}`);

        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: 'FAILED',
            error: errorMessage,
          },
        });

        throw err; // Re-throw to inform BullMQ of failure
      }
    },
    {
      connection: redisConnection,
      concurrency: config.workerConcurrency,
      limiter: {
        max: config.rateLimitMax,
        duration: config.rateLimitDurationMs,
      },
    }
  );

  worker.on('active', (job) => {
    console.log(`🔄 BullMQ Job ${job.id} is now active.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ BullMQ Job ${job?.id} failed with error: ${err.message}`);
  });

  worker.on('completed', (job) => {
    console.log(`🎉 BullMQ Job ${job.id} finished execution successfully.`);
  });

  console.log(`👷 Worker started listening on queue '${EMAIL_QUEUE_NAME}' with concurrency=${config.workerConcurrency}, rateLimit=${config.rateLimitMax} jobs / ${config.rateLimitDurationMs}ms`);

  return worker;
}
