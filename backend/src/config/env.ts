import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://kavitasinghpanwar@localhost:5432/email_scheduler',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
  seedUserEmail: process.env.SEED_USER_EMAIL || 'admin@example.com',
  seedUserPassword: process.env.SEED_USER_PASSWORD || 'password123',
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
  rateLimitDurationMs: parseInt(process.env.RATE_LIMIT_DURATION_MS || '60000', 10),
};
