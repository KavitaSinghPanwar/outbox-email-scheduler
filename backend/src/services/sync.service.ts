import { prisma } from './prisma.service';
import { scheduleEmailJob } from '../queues/email.queue';

export async function syncScheduledEmailsOnBoot(): Promise<void> {
  console.log('🔄 Checking database for pending SCHEDULED emails to synchronize with queue...');

  try {
    const pendingEmails = await prisma.email.findMany({
      where: {
        status: 'SCHEDULED',
      },
    });

    if (pendingEmails.length === 0) {
      console.log('✨ No pending SCHEDULED emails found in database.');
      return;
    }

    console.log(`📌 Found ${pendingEmails.length} SCHEDULED email(s) in DB. Re-enqueuing into BullMQ...`);

    let enqueuedCount = 0;
    for (const email of pendingEmails) {
      await scheduleEmailJob(email.id, email.sendAt);
      enqueuedCount++;
    }

    console.log(`✅ Successfully synchronized ${enqueuedCount}/${pendingEmails.length} SCHEDULED email(s) into BullMQ on boot.`);
  } catch (err: any) {
    console.error('❌ Error during email boot synchronization:', err.message);
  }
}
