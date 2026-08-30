import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export async function scheduleEmailJob(emailId: string, sendAt: Date): Promise<void> {
  const delay = Math.max(0, sendAt.getTime() - Date.now());
  
  await emailQueue.add(
    'send-email',
    { emailId },
    {
      delay,
      jobId: emailId, // Crucial: Ties BullMQ job ID to PostgreSQL Email ID for restart deduplication
    }
  );
  
  console.log(`📅 Enqueued job for Email ID ${emailId} with delay ${delay}ms (target: ${sendAt.toISOString()})`);
}
