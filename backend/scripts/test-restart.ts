import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || '5001';
const BASE_URL = `http://localhost:${PORT}`;

async function runRestartTest() {
  console.log('--------------------------------------------------');
  console.log('🧪 PERSISTENCE ON RESTART TEST SCRIPT');
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

    // 2. Schedule email 2 minutes in the future
    const sendAtDate = new Date(Date.now() + 2 * 60 * 1000);
    const sendAtISO = sendAtDate.toISOString();

    console.log(`2️⃣ Scheduling test email for 2 minutes from now (${sendAtISO})...`);
    const emailRes = await fetch(`${BASE_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: 'restart-demo@example.com',
        subject: 'Persistence Restart Test Email',
        body: 'This email proves that BullMQ delayed jobs survive backend server restarts and Redis re-enqueues!',
        sendAt: sendAtISO,
      }),
    });

    const emailData: any = await emailRes.json();
    if (!emailRes.ok) {
      throw new Error(emailData.error || 'Email scheduling failed');
    }

    const email = emailData.email;
    console.log(`   ✅ Test Email Created!`);
    console.log(`      ID:      ${email.id}`);
    console.log(`      Status:  ${email.status}`);
    console.log(`      Send At: ${email.sendAt}\n`);

    // 3. Output Step-by-Step Restart Instructions for Video Demo
    console.log('--------------------------------------------------');
    console.log('📺 DEMO VIDEO RESTART TEST INSTRUCTIONS');
    console.log('--------------------------------------------------');
    console.log('1. Press Ctrl+C in your running backend terminal to STOP the backend server.');
    console.log('2. (Optional) Flush Redis (`redis-cli flushall`) to simulate server crash & Redis data loss.');
    console.log('3. Restart the backend server by running `npm run dev`.');
    console.log('4. Observe the startup synchronization logs:');
    console.log(`   "📌 Found 1 SCHEDULED email(s) in DB. Re-enqueuing into BullMQ..."`);
    console.log(`   "✅ Successfully synchronized 1/1 SCHEDULED email(s) into BullMQ on boot."`);
    console.log('5. Wait until ' + new Date(email.sendAt).toLocaleTimeString() + ' and verify the status updates to SENT with an Ethereal Preview URL!');
    console.log('--------------------------------------------------\n');
  } catch (err: any) {
    console.error('❌ Restart test script failed:', err.message);
    process.exit(1);
  }
}

runRestartTest();
