export type EmailStatus = 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
}

export interface Email {
  id: string;
  userId: string;
  to: string;
  subject: string;
  body: string;
  sendAt: string;
  status: EmailStatus;
  error?: string | null;
  etherealPreviewUrl?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface EmailListResponse {
  emails: Email[];
  count: number;
}
