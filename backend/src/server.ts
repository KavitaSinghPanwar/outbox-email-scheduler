import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import emailRoutes from './routes/email.routes';
import { errorHandler } from './middleware/error.middleware';
import { mailerService } from './services/mailer.service';
import { startEmailWorker } from './queues/email.worker';
import { syncScheduledEmailsOnBoot } from './services/sync.service';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/emails', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Global Error Middleware
app.use(errorHandler);

async function bootstrap() {
  try {
    console.log('🚀 Bootstrapping Email Job Scheduler Backend...');

    // 1. Initialize Ethereal Email Transporter
    await mailerService.init();

    // 2. Start BullMQ Worker Process
    startEmailWorker();

    // 3. Perform Boot Synchronization for Pending Scheduled Emails
    await syncScheduledEmailsOnBoot();

    // 4. Start HTTP Server
    app.listen(config.port, () => {
      console.log(`🌐 Server running on http://localhost:${config.port}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    });
  } catch (err: any) {
    console.error('💥 Fatal error during server startup:', err.message);
    process.exit(1);
  }
}

bootstrap();
