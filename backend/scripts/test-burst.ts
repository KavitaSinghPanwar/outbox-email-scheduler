import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || '5001';
const BASE_URL = `http://localhost:${PORT}`;

async function runBurstTest() {
  console.log('--------------------------------------------------');
  console.log('⚡ RATE LIMITING & CONCURRENCY BURST TEST SCRIPT');
  console.log('--------------------------------------------------\n');

  try {
    // 1. Authenticate with demo user
    console.log('1️⃣ Authenticating with demo user...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SEED_USER_EMAIL || 'admin@example.com',
        password: process.env.SEED_USER_PASSWORD || 'password123',
      }),
    });

    const loginData: any = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(loginData.error || 'Authentication failed');
    }

    const token = loginData.token;
    console.log('   ✅ Auth successful. Token received.\n');

    // 2. Schedule a burst of 15 emails at nearly the exact same sendAt (+5s)
    const BURST_COUNT = 15;
    const targetTime = new Date(Date.now() + 5000).toISOString();

    console.log(`2️⃣ Burst scheduling ${BURST_COUNT} emails to send at target: ${targetTime}...`);

    const promises = [];
    for (let i = 1; i <= BURST_COUNT; i++) {
      promises.push(
        fetch(`${BASE_URL}/emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: `burst-user-${i}@example.com`,
            subject: `Burst Test Email #${i}`,
            body: `Testing rate limiting and worker concurrency for email #${i}`,
            sendAt: targetTime,
          }),
        })
      );
    }

    const results = await Promise.all(promises);
    console.log(`   ✅ Successfully enqueued ${results.length} emails into DB and BullMQ queue!\n`);

    // 3. Print observation instructions for video demo
    const maxLimit = process.env.RATE_LIMIT_MAX || '10';
    const durationMs = process.env.RATE_LIMIT_DURATION_MS || '60000';
    const concurrency = process.env.WORKER_CONCURRENCY || '5';

    console.log('--------------------------------------------------');
    console.log('📺 DEMO VIDEO BURST TEST OBSERVATIONS');
    console.log('--------------------------------------------------');
    console.log(`• Configured Worker Concurrency: ${concurrency}`);
    console.log(`• Configured Rate Limiter:       ${maxLimit} jobs / ${durationMs}ms`);
    console.log('');
    console.log('WHAT TO OBSERVE IN THE BACKEND TERMINAL & REACT DASHBOARD:');
    console.log(`1. In backend logs, you will see BullMQ process up to ${maxLimit} emails within the rate limit window.`);
    console.log(`2. The remaining ${BURST_COUNT - parseInt(maxLimit, 10)} emails will be throttled by BullMQ's rate limiter until the duration resets.`);
    console.log(`3. On the React Dashboard, watch status badges update in real-time from SCHEDULED to SENT in rate-controlled batches!`);
    console.log('--------------------------------------------------\n');
  } catch (err: any) {
    console.error('❌ Burst test script failed:', err.message);
    process.exit(1);
  }
}

runBurstTest();
