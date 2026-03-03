## Role: Senior Full-Stack Architect & Vibe Code Expert

## Situation
We are initializing the core infrastructure for "Subly"—a high-end, minimalist subscription manager. This phase focuses on security, internationalization (i18n), real-time currency logic, and a refined Apple-inspired UI foundation.

## Context & Technical Decisions
- **Framework:** Next.js 14+ (App Router).
- **Security:** Implement an `EncryptionService` (AES-256-GCM) and use **Prisma Client Extensions** to automatically encrypt/decrypt sensitive fields (`name`, `amount`) at the database level.
- **i18n:** Use `next-intl` with **Locale-based Routing** (e.g., `/en/dashboard`).
- **Currency:** Real-time fetching of USD/MYR rates with a hardcoded fallback rate of `1 USD = 4.75 MYR`.
- **UI/UX:** Global Page Transitions via `framer-motion`, local font configuration (San Francisco style), and a custom "Apple Green" palette.
- **CI/CD:** GitHub Actions for Linting and Type Checking, optimized for Vercel deployment.

## Task: Infrastructure Implementation

### 1. Environment & Security Foundation
- Create an `EncryptionService` in `/services/encryption.ts` using Node's native `crypto` module.
- Implement a **Prisma Extension** in `/lib/prisma.ts` that:
    - `on save`: Encrypts `name` and `amount` (converted to string if necessary).
    - `on read`: Decrypts these fields back into their original types.
- Setup `.env.example` with placeholders for `ENCRYPTION_KEY` (32-byte hex) and `EXCHANGE_API_KEY`.

### 2. Localization (next-intl)
- Configure `next-intl` for `[locale]` dynamic routing.
- Create `/messages/en.json` and `/messages/zh.json`.
- Implement a `middleware.ts` to handle locale detection and redirection.
- Set up a `Navigation` wrapper to provide type-safe `Link` and `useRouter` hooks.

### 3. Currency & Exchange Intelligence
- Create `/services/exchange.ts` to fetch rates from `ExchangeRate-API`.
- Implement a "Fail-safe" mechanism: if the API call fails or times out, return a static default rate.
- Create a React Hook `useConvertedAmount` to handle real-time UI updates.

### 4. The "Apple" UI Core
- **Typography:** Configure `next/font/local` to support a system-like "San Francisco" typeface.
- **Theme:** Extend `tailwind.config.js` with:
    - `apple-bg`: `#F5F5F7`
    - `apple-success`: `#34C759` (with a soft 10% opacity variant for backgrounds)
    - `apple-card`: `rgba(255, 255, 255, 0.8)` with Backdrop Blur.
- **Transitions:** Create a `PageTransition` component in `/components/layout` using `AnimatePresence` for subtle fade-in/out during route changes.

### 5. DevOps & Quality Control
- Generate a `.github/workflows/ci.yml` to run `npm run lint` and `tsc --noEmit` on every Pull Request to `main` or `develop`.

## Constraints & Quality Standards
- **Clean Code:** Use the Service-Repository pattern; keep business logic out of components.
- **Type Safety:** Ensure 100% TypeScript coverage, especially for the Prisma Extension results.
- **Aesthetics:** Use `framer-motion` for "soft" interactions (stiffness: 300, damping: 30).
- **Performance:** Ensure real-time FX calls are cached for the duration of the session to avoid rate-limiting.