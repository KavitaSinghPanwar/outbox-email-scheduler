import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';
import { createEmailSchema, emailQuerySchema } from '../schemas/email.schema';
import { prisma } from '../services/prisma.service';
import { scheduleEmailJob } from '../queues/email.queue';
import { EmailStatus } from '@prisma/client';

const router = Router();

// Protect all email routes with JWT authentication
router.use(authenticateJWT);

// POST /emails - Schedule a new email
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { to, subject, body, sendAt } = createEmailSchema.parse(req.body);

    const targetSendAt = new Date(sendAt);

    // 1. Save email record to Postgres with status SCHEDULED
    const email = await prisma.email.create({
      data: {
        userId,
        to,
        subject,
        body,
        sendAt: targetSendAt,
        status: 'SCHEDULED',
      },
    });

    // 2. Add job to BullMQ queue with delay computed from sendAt
    await scheduleEmailJob(email.id, targetSendAt);

    return res.status(201).json({
      message: 'Email scheduled successfully',
      email,
    });
  } catch (err) {
    next(err);
  }
});

// GET /emails - List all emails for logged-in user, optionally filtered by status
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { status } = emailQuerySchema.parse(req.query);

    const whereCondition: any = { userId };
    if (status) {
      whereCondition.status = status as EmailStatus;
    }

    const emails = await prisma.email.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      emails,
      count: emails.length,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /emails/:id - Cancel a scheduled email job
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const email = await prisma.email.findFirst({
      where: { id, userId },
    });

    if (!email) {
      return res.status(404).json({ error: 'Email record not found' });
    }

    if (email.status !== 'SCHEDULED') {
      return res.status(400).json({ error: `Cannot cancel email in status '${email.status}'. Only SCHEDULED emails can be cancelled.` });
    }

    // 1. Remove job from BullMQ queue if present
    const { emailQueue } = await import('../queues/email.queue');
    const job = await emailQueue.getJob(id);
    if (job) {
      await job.remove();
      console.log(`🗑️ Removed BullMQ job ${id} from queue.`);
    }

    // 2. Update DB record to CANCELLED status so boot sync ignores it
    const updatedEmail = await prisma.email.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    console.log(`🚫 Email ${id} cancelled successfully.`);

    return res.status(200).json({
      message: 'Email scheduled job cancelled successfully',
      email: updatedEmail,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
