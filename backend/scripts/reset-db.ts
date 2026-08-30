import { prisma } from '../src/services/prisma.service';
import { emailQueue } from '../src/queues/email.queue';
import { redisConnection } from '../src/config/redis';

async function resetDatabase() {
  console.log('--------------------------------------------------');
  console.log('🧹 DATABASE RESET SCRIPT');
  console.log('--------------------------------------------------\n');

  try {
    // 1. Delete all Email records from PostgreSQL
    console.log('1️⃣ Truncating Email records in PostgreSQL database...');
    const result = await prisma.email.deleteMany({});
    console.log(`   ✅ Removed ${result.count} email record(s) from database.\n`);

    // 2. Clean and drain BullMQ queue in Redis
    console.log('2️⃣ Cleaning BullMQ redis queue...');
    await emailQueue.drain();
    await emailQueue.clean(0, 0, 'completed');
    await emailQueue.clean(0, 0, 'failed');
    await emailQueue.clean(0, 0, 'delayed');
    await emailQueue.clean(0, 0, 'wait');
    await emailQueue.clean(0, 0, 'active');
    console.log('   ✅ Redis queue drained and cleaned.\n');

    // 3. Confirm Seeded User is Intact
    const userCount = await prisma.user.count();
    console.log(`3️⃣ Demo User Status: ${userCount} user(s) remain in database (seeded user preserved).\n`);

    console.log('--------------------------------------------------');
    console.log('✨ Database reset complete! Ready for demo video recording.');
    console.log('--------------------------------------------------\n');
  } catch (err: any) {
    console.error('❌ Error during DB reset:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await emailQueue.close();
    await redisConnection.quit();
  }
}

resetDatabase();
