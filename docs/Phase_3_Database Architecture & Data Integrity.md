## Role: Senior Full-Stack Architect & Vibe Code Expert

## Situation
We are implementing the data layer (Phase 3) for "Subly"—a premium, minimalist subscription manager. The goal is to move from a basic schema to a production-grade relational structure that supports encryption, high-precision financial data, and sophisticated categorization.

## Context & Technical Specifications
- **Database:** Prisma ORM with SQLite (MVP), configured for future PostgreSQL migration.
- **Precision:** Use **Integer (Cents/Sen)** for all currency amounts to ensure zero floating-point errors.
- **Security:** Fields `name`, `amount`, and `paymentMethod` must be flagged for the Prisma Encryption Extension (implemented in Phase 2).
- **Normalization:** - Separate `Category` model for rich metadata (icons, colors).
    - Separate `Currency` model for symbols (RM, $) and formatting rules.
- **Performance:** Strategic indexing on billing dates to power a high-performance dashboard.
- **Vibe Check:** The seeding process must populate the app with "Apple-tier" services (iCloud, Apple One, etc.) using refined metadata.

## Task: Database Implementation & Deployment

### 1. Advanced Prisma Schema Design
Define a robust `schema.prisma` with the following relations:
- **Subscription Model:**
    - `amount`: Int (store as cents).
    - `name`, `paymentMethod`: Encrypted strings.
    - `nextBillingDate`: DateTime with `@index` for dashboard sorting.
    - Foreign keys to `Category` and `Currency`.
- **Category Model:**
    - `name`, `slug`, `icon` (Lucide name), and `color` (Hex).
    - Support for an optional `monthlyBudget` (Int).
- **Currency Model:**
    - `code` (USD, MYR), `symbol` ($, RM), and `precision` (default 2).

### 2. Migration & Shadow DB Configuration
- Configure the `datasource` to support a `shadowDatabaseUrl` in the `.env` to facilitate smooth migrations when moving to PostgreSQL.
- Generate the initial migration with a descriptive name: `init_normalized_finance_schema`.

### 3. Apple-Aesthetic Seed Engine
Create a `prisma/seed.ts` that:
- Deletes existing records to ensure a clean slate.
- Creates default **Categories**: `Productivity` (Blue), `Entertainment` (Purple), `Services` (Grey), `Health` (Green).
- Creates **Currencies**: MYR (Primary), USD (Secondary).
- Seeds "Subly-style" **Subscriptions**: 
    - *Apple One* (MYR 34.90 -> 3490).
    - *iCloud+* (MYR 3.90 -> 390).
    - *ChatGPT Plus* (USD 20.00 -> 2000).
    - *Netflix* (MYR 55.00 -> 5500).

### 4. Data Access Layer (Services)
- Create `/services/subscription.service.ts` to handle:
    - `createSubscription`: Automatically calculating the first `nextBillingDate` based on `startDate` and `cycle`.
    - `getDashboardSummary`: Aggregating totals by converting all currencies to MYR (using the `ExchangeService` from Phase 2).

### 5. Deployment Readiness
- Update `package.json` scripts to include `prisma:seed`.
- Ensure `DATABASE_URL` and `SHADOW_DATABASE_URL` are handled correctly for Vercel's ephemeral environments.

## Constraints & Quality Standards
- **Financial Integrity:** Never store decimals. All arithmetic must be done in integers and formatted only at the UI layer.
- **Relational Integrity:** Use `onDelete: Cascade` where appropriate to ensure no orphaned subscriptions.
- **Type Safety:** Ensure the generated Prisma Client is utilized with strict TypeScript interfaces for all service returns.
- **Vibe:** Icons used in seeds must be from `lucide-react` and match the Apple aesthetic (e.g., `layout-grid`, `play-circle`, `cloud`, `cpu`).