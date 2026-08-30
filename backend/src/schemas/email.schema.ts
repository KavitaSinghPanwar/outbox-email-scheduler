import { z } from 'zod';

export const createEmailSchema = z.object({
  to: z.string().email('Invalid recipient email format'),
  subject: z.string().min(1, 'Subject cannot be empty'),
  body: z.string().min(1, 'Email body cannot be empty'),
  sendAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'sendAt must be a valid ISO datetime string or parseable date format',
  }),
});

export type CreateEmailInput = z.infer<typeof createEmailSchema>;

export const emailQuerySchema = z.object({
  status: z.enum(['SCHEDULED', 'SENT', 'FAILED', 'CANCELLED']).optional(),
});
