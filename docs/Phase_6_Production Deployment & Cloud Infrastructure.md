## Role: Senior Full-Stack Architect & DevOps Expert

## Situation
We are preparing "Subly" for its official production launch. The goal is to migrate from a local development environment to a high-performance cloud infrastructure on Vercel and Supabase, ensuring "Apple-level" speed (via Edge Runtime) and industrial-grade reliability.

## Context & Technical Specifications
- **Hosting:** Vercel (Production & Preview environments).
- **Database:** Supabase (PostgreSQL) replacing the local SQLite.
- **Optimization:** Use Next.js **Edge Runtime** for high-traffic routes (Dashboard, FX API).
- **Security:** Strict Environment Variable validation and Encryption Key management.
- **Observability:** Sentry for error tracking and Vercel Web Analytics for user insights.
- **Persistence:** Automated backup configuration for the encrypted PostgreSQL database.

## Task: Production Readiness & Deployment

### 1. Database Migration (SQLite to Supabase)
- Update `schema.prisma` to use the `postgresql` provider.
- Configure `DATABASE_URL` and `DIRECT_URL` (for migrations) in Vercel to connect to the Supabase project.
- Implement a **Prisma Migration Script** to initialize the production schema while preserving the encryption logic.

### 2. Environment Integrity & Validation
- Create a `lib/env-check.ts` utility that runs during the build phase.
- It must validate the existence and format of:
    - `ENCRYPTION_KEY` (must be 32-byte hex).
    - `NEXT_PUBLIC_EXCHANGE_API_KEY`.
    - `CRON_SECRET`.
    - `SENTRY_DSN`.
- The build must fail with a descriptive error if any secret is missing.

### 3. Edge Runtime & Performance Optimization
- Configure the following segments to use `runtime = 'edge'`:
    - `app/[locale]/api/exchange/route.ts`
    - `app/[locale]/dashboard/page.tsx` (ensure all services used here are Edge-compatible).
- Implement **Stale-While-Revalidate (SWR)** caching headers for the currency exchange API to ensure sub-100ms response times globally.

### 4. Observability & Error Monitoring
- Initialize **Sentry** using the `@sentry/nextjs` wizard.
- Configure Sentry to capture both server-side (Server Actions) and client-side errors.
- Ensure the `EncryptionService` errors are sanitized so no raw keys or decrypted data are sent to Sentry logs.
- Enable **Vercel Web Analytics** in the `RootLayout` to monitor page performance and core web vitals.

### 5. Automation & Cron Jobs
- Deploy the **Vercel Cron Job** (`/api/cron/check-payments`) to the production environment.
- Verify the `CRON_SECRET` handshake works securely in the live URL.

### 6. Post-Deployment Verification (Smoke Tests)
- Create a `scripts/post-deploy.sh` or a set of manual instructions to:
    - Verify SSL status on the `.vercel.app` domain.
    - Test the `next-intl` routing (ensure `/zh` and `/en` work correctly in production).
    - Trigger a test encryption/decryption cycle to ensure the production key matches the DB state.

## Constraints & Quality Standards
- **Zero-Downtime:** Ensure database migrations are backward compatible.
- **Security First:** No sensitive keys should ever be logged in the Vercel console; use the structured JSON logger defined in Phase 4.
- **Edge Compatibility:** All libraries used in the Dashboard (e.g., Lucide, Framer Motion, Prisma) must be compatible with the Edge Runtime.
- **Vibe Check:** The production "Loading" state (Skeleton Screen) must be perfectly smooth under real-world latency.