# 🚀 Outbox Email Job Scheduler

## Overview
Outbox Email Job Scheduler is a full-stack, production-ready email scheduling monorepo built with Node.js, Express, TypeScript, PostgreSQL (via Prisma), BullMQ, Redis, Nodemailer (Ethereal Email), and React + Vite + Tailwind CSS. The system allows users to schedule emails for future delivery with strict persistence across server restarts, rate-limited dispatches, worker concurrency management, and real-time dashboard tracking.

---

## Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **PostgreSQL**: Local Homebrew PostgreSQL instance or Docker container (`v15+`)
- **Redis**: Local Redis server or Docker container (`v7+`) running on port `6379`
- **npm**: v9+ (comes bundled with Node.js)

---

## How to Run the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Environment Setup:
   Create a `.env` file in `backend/` (or copy from `.env.example`):
   ```env
   PORT=5001
   DATABASE_URL="postgresql://kavitasinghpanwar@localhost:5432/email_scheduler"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="super-secret-jwt-key-change-in-production"

   SEED_USER_EMAIL="admin@example.com"
   SEED_USER_PASSWORD="password123"

   WORKER_CONCURRENCY=5
   RATE_LIMIT_MAX=10
   RATE_LIMIT_DURATION_MS=60000
   ```

4. Database Migration & Seeding:
   ```bash
   # Run Prisma Migrations
   npm run prisma:migrate -- --name init

   # Seed Demo User (admin@example.com / password123)
   npm run prisma:seed
   ```

5. Start the Development Server (API + BullMQ Worker + Boot Sync):
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5001`. On boot, it automatically initializes an Ethereal Email test account and logs connection details.*

---

## How to Run the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Environment Setup (Optional):
   Create a `.env` file in `frontend/` if overriding default API URL:
   ```env
   VITE_API_URL=http://localhost:5001
   ```

4. Start Vite Development Server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied) in your browser.*

5. Log in using seeded credentials:
   - **Email**: `admin@example.com`
   - **Password**: `password123`

---

## How Ethereal Email is Set Up

- **Zero-Config Fake SMTP**: On server boot (`mailer.service.ts`), Nodemailer automatically invokes `nodemailer.createTestAccount()` to generate dynamic Ethereal Email test credentials.
- **Printed Webmail Credentials**: Startup logs display the generated Ethereal test user, password, and webmail login URL (`https://ethereal.email/login`).
- **Live Preview Links**: When an email job transitions to `SENT`, Nodemailer returns a preview URL (`nodemailer.getTestMessageUrl(info)`). This URL is saved in PostgreSQL (`etherealPreviewUrl`) and rendered as a clickable **View Inbox** link directly on the React dashboard table rows.

---

## Environment Variables Table

### Backend (`backend/.env`)

| Variable | Purpose | Example Value |
| :--- | :--- | :--- |
| `PORT` | Express server HTTP port | `5001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://kavitasinghpanwar@localhost:5432/email_scheduler` |
| `REDIS_URL` | Redis connection URL for BullMQ | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for signing auth tokens | `super-secret-jwt-key-change-in-production` |
| `SEED_USER_EMAIL` | Default seeded user login email | `admin@example.com` |
| `SEED_USER_PASSWORD` | Default seeded user login password | `password123` |
| `WORKER_CONCURRENCY` | Max simultaneous jobs per worker process | `5` |
| `RATE_LIMIT_MAX` | Max emails dispatched per rate duration window | `10` |
| `RATE_LIMIT_DURATION_MS` | Rate limit window duration in milliseconds | `60000` |
| `ETHEREAL_USER` | (Optional) Explicit Ethereal account username | `user@ethereal.email` |
| `ETHEREAL_PASS` | (Optional) Explicit Ethereal account password | `secretpass` |

### Frontend (`frontend/.env`)

| Variable | Purpose | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base HTTP endpoint for backend Express API | `http://localhost:5001` |

---

## Architecture Overview

```text
               +-------------------------------------------------+
               |                   React UI                      |
               | (Dashboard, Compose Modal, Status Filters, Links)|
               +-----------------------+-------------------------+
                                       | HTTP / REST (JWT)
                                       v
               +-------------------------------------------------+
               |               Express API Server                |
               +-----------------------+-------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
        +--------------------+                   +-------------------+
        |  PostgreSQL (DB)   |                   |   BullMQ / Redis  |
        | Source of Truth    |                   |   Delayed Queue   |
        +---------+----------+                   +---------+---------+
                  |                                        |
                  |     (Boot Sync & Job ID Mapping)       |
                  +-------------------+--------------------+
                                      |
                                      v
                        +---------------------------+
                        |      BullMQ Worker        |
                        | (Concurrency & Limiter)   |
                        +-------------+-------------+
                                      |
                                      v
                        +---------------------------+
                        |   Nodemailer / Ethereal   |
                        |   (Fake SMTP & Preview)   |
                        +---------------------------+
```

### 1. How Scheduling Works
- **Database as Source of Truth**: When a user submits an email through `POST /emails`, the backend writes the job record to PostgreSQL first with status `SCHEDULED`.
- **BullMQ Delayed Queue**: The backend computes the target delay (`delay = Math.max(0, sendAt.getTime() - Date.now())`) and adds a job payload `{ emailId }` to BullMQ (`email-queue`).
- **Worker Execution**: When the delay timer expires in Redis, BullMQ promotes the job to active state. The worker fetches the email record from PostgreSQL, sends it via Nodemailer/Ethereal, and updates status to `SENT` with `sentAt` timestamp and `etherealPreviewUrl`.

### 2. How Persistence on Restart is Handled
- **Restart Recovery**: If the backend crashes, restarts, or Redis is flushed, scheduled jobs are not lost because PostgreSQL holds all `SCHEDULED` records.
- **Boot Synchronization (`syncScheduledEmailsOnBoot`)**: On server boot, the application queries PostgreSQL for all `SCHEDULED` emails. For each email found, it computes the remaining delay and re-enqueues the job into BullMQ.
- **Idempotent Job IDs**: Every BullMQ job is added with `jobId: email.id` matching PostgreSQL's primary key. BullMQ guarantees that if a job with ID `email.id` already exists in Redis, re-enqueuing is ignored, preventing duplicate execution.
- **Test Script**: Run `npm run test:restart` in `backend/` to schedule an email 2 minutes out and follow step-by-step terminal instructions to test killing and restarting the server.

### 3. How Rate Limiting & Concurrency are Implemented
- **Worker Concurrency**: Configured via `WORKER_CONCURRENCY` (e.g. `5`). Passed directly into BullMQ `Worker` options (`concurrency: config.workerConcurrency`) to process up to 5 jobs concurrently per worker instance.
- **Rate Limiting**: Configured via `RATE_LIMIT_MAX` and `RATE_LIMIT_DURATION_MS` (e.g. `10` jobs per `60,000ms`). Passed directly into BullMQ `Worker` options (`limiter: { max, duration }`). When a burst of scheduled emails target the same timestamp, BullMQ automatically throttles dispatches beyond the limit.
- **Test Script**: Run `npm run test:burst` in `backend/` to schedule 15 emails at once and observe rate-limited worker dispatch in action.

---

## Features Implemented

### Backend
- [x] **Scheduler**: `POST /emails` accepts recipient, subject, body, and ISO `sendAt`, saves to PostgreSQL as `SCHEDULED`, and enqueues to BullMQ with computed delay.
- [x] **Persistence**: Boot sync queries PostgreSQL for `SCHEDULED` jobs and re-enqueues with `jobId: email.id` idempotency.
- [x] **Rate Limiting**: Native BullMQ queue limiter (`max` jobs per `duration`) enforcing execution throttling under load.
- [x] **Concurrency**: Worker initialized with `WORKER_CONCURRENCY` for parallel processing limits.

### Frontend
- [x] **Login**: JWT authentication form with demo user auto-fill banner and session state handling.
- [x] **Dashboard**: Metrics summary cards (Total, Scheduled, Sent, Failed), status filter tabs, auto-refresh toggle (5s), and manual refresh.
- [x] **Compose**: Modal dialog with To, Subject, Body, datetime-local picker, and quick preset buttons (`+1 min`, `+5 min`, `+1 hr`).
- [x] **Tables**: Styled data table displaying recipient, body snippet, status badges, timestamps, and direct clickable Ethereal preview links.

---

## Assumptions, Shortcuts & Trade-offs

1. **Single Seeded Demo User**:
   - *Reality*: Authentication uses a single seeded user (`admin@example.com` / `password123`) created via `prisma/seed.ts`.
   - *Trade-off*: Multi-tenant user registration, password resets, and refresh token rotation were omitted as permitted by assignment scope.

2. **In-Process Worker for Local Dev**:
   - *Reality*: Express API server and BullMQ worker run inside the same Node.js process on `npm run dev`.
   - *Trade-off*: Simplifies local setup to a single command. In production, worker processes would run in isolated containers.

3. **No Automatic Failure Retry Policy**:
   - *Reality*: When email sending fails, the worker catches the exception and immediately updates status to `FAILED` with error text.
   - *Trade-off*: Automatic exponential backoff retries were omitted so delivery failures are reflected immediately in the UI.

4. **Ethereal Fake SMTP**:
   - *Reality*: Ethereal Email test accounts are generated dynamically at runtime.
   - *Trade-off*: Ideal for zero-config demo evaluation. Production requires real SMTP providers (AWS SES, SendGrid, Resend).
