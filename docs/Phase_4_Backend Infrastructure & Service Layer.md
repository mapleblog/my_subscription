## Role: Senior Full-Stack Architect & Vibe Code Expert

## Situation
We are building the backend infrastructure for "Subly"—a high-end subscription manager. This phase focuses on creating a robust Service Layer, type-safe Server Actions, and automated background tasks for payment reminders, all while maintaining "Apple-level" feedback loops.

## Context & Technical Specifications
- **Architecture:** Service-Action Pattern. All business logic resides in `@/services`. Server Actions act as thin, type-safe wrappers.
- **Validation:** Use **Zod** for schema validation. 
- **Error Handling:** Implement a semantic error system that returns specific codes (e.g., `INSUFFICIENT_FUNDS`, `RATE_LIMIT_EXCEEDED`) to trigger specific UI/Haptic feedback.
- **Security & Rate Limiting:** Integrate **Upstash/Redis** to rate-limit sensitive actions (adding subscriptions, fetching FX rates).
- **Background Tasks:** Set up a **Vercel Cron** compatible Route Handler to process "Upcoming Payment" logic every 24 hours.
- **Logging:** Structured JSON logging for better observability in Vercel/CloudWatch.

## Task: Backend Engine Implementation

### 1. The Core Service Layer (`@/services`)
Create decoupled services that interface with the Prisma client (from Phase 3):
- **SubscriptionService:** - `getAll()`: Returns decrypted subscriptions.
    - `create(data)`: Validates input, handles Integer conversion (Ringgit to Cents), and calculates the `nextBillingDate`.
    - `toggleAutoRenew(id)`: Atomic update for the renewal status.
- **NotificationService:** Logic to identify subscriptions due within 3 days and mark them for UI "Alert" states.
- **ExchangeService:** Wrap the Phase 2 logic here with caching (Redis via Upstash) to minimize external API calls.

### 2. Type-Safe Server Actions (`@/actions`)
Use a library like `next-safe-action` or a custom wrapper to ensure:
- **Server-side Validation:** Check Zod schemas before hitting services.
- **Standardized Response:** Return a consistent object: `{ success: boolean, data?: T, error?: { code: string, message: string } }`.
- **Haptic-Ready Errors:** Ensure error codes are granular enough for the frontend to trigger different vibration patterns/animations.

### 3. Rate Limiting Middleware
- Implement a helper using `@upstash/ratelimit`.
- Apply limits to the `createSubscription` and `updateSubscription` actions to prevent DB spam.

### 4. Automated Reminder Engine (Cron)
- Create a Route Handler at `/api/cron/check-payments`.
- **Security:** Protect the route using a `CRON_SECRET` header check.
- **Logic:** Query all active subscriptions where `nextBillingDate` is within the next 72 hours and update an `isUpcoming` flag or prepare a notification queue.

### 5. Structured Logging Utility
- Create `/lib/logger.ts` that outputs:
  `{ "timestamp": "...", "level": "info/error", "action": "...", "metadata": {...} }`
- Ensure all failed Server Actions log their errors with the associated user context (when Auth is added later).

## Constraints & Quality Standards
- **Logic Isolation:** No database calls directly inside Server Actions or Components. Everything must go through a Service.
- **Financial Precision:** Ensure the backend strictly handles Integers (Cents). Multiplication for FX rates must use `BigInt` or careful rounding before saving.
- **Performance:** Cron jobs must be optimized for execution time to stay within Vercel's hobby/pro limits.
- **Clean Code:** Adhere to the "Single Responsibility Principle"—the `SubscriptionService` should not know about HTTP headers or UI states.