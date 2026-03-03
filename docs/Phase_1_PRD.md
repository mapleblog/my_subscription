## 1. Project Essence & Vibe

**"Subly"** is a high-end, minimalist personal subscription manager. The design philosophy follows **Apple’s Human Interface Guidelines**: heavy use of white space, subtle shadows, refined typography (San Francisco style), and smooth transitions. The core "vibe" is **Clarity and Control**—removing the anxiety of "hidden" digital costs through a beautiful, glanceable interface.

------

## 2. Technical Stack & Constraints

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + Framer Motion (for Apple-like fluidity)
- **Database:** Prisma ORM (SQLite for MVP, migratable to PostgreSQL)
- **Components:** Shadcn/UI (customized for rounded, minimalist aesthetic)
- **Localization:** i18n support (English & Simplified Chinese)
- **Mobile:** 100% Responsive / PWA-ready (Mobile-first design)
- **Security:** Field-level encryption for sensitive subscription details at rest.

------

## 3. Core MVP Requirements (The "What")

- **Dashboard:** A "Big Number" display showing the Total Monthly Spend in **MYR**.
- **Currency Intelligence:** Integrated API (e.g., ExchangeRate-API) to automatically convert USD subscriptions to MYR based on daily rates.
- **Subscription Management:**
  - Add/Edit/Delete subscriptions.
  - Toggle for "Auto-renew" status.
  - Visual indicators for "Upcoming Payment" (within 3 days).
- **The "Apple" Feel:** Card-based layout with haptic-like visual feedback on click.

------

## 4. Data Structure (Prisma Schema)

Code snippet

```
model Subscription {
  id              String   @id @default(cuid())
  name            String   // Name of service (e.g., Netflix)
  amount          Float    // Numeric value
  currency        String   @default("MYR") // MYR, USD, etc.
  cycle           String   // Monthly, Yearly, Quarterly
  startDate       DateTime
  nextBillingDate DateTime
  paymentMethod   String?  // e.g., Wise, MBB Visa, Apple Pay
  isAutoRenew     Boolean  @default(true)
  category        String?  // Entertainment, Productivity, etc.
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

------

## 5. Vibe Coding Prompt Template (RCC + SCF Framework)

*Copy and paste the section below into your AI Code Editor to begin.*

> ### **Role: Senior Full-Stack Architect & Vibe Coder**
>
> **Situation:** I am building a personal subscription manager titled "Subly" for a founder who values Apple-level minimalism and code scalability.
>
> **Context:** > - **Tech Stack:** Next.js (App Router), Prisma, Tailwind, Shadcn/UI.
>
> - **Primary Currency:** MYR (Malaysian Ringgit).
> - **Localization:** Needs to support EN/CN.
> - **Constraints:** Mobile-first, responsive, and modular. No Auth for now, but the folder structure must anticipate `NextAuth` integration later.
>
> **Task:** Generate the Phase 1 Foundation:
>
> 1. **Project Setup:** Initialize Next.js with a clean, modular folder structure (`/components`, `/lib`, `/services`, `/hooks`).
> 2. **Visual Style:** Use a "Glassmorphism" or "Apple Minimalist" theme. High-contrast typography, soft borders, and `#F5F5F7` background.
> 3. **Core Feature:** Create a Dashboard with a summary card showing "Total Monthly Spend" and a list of subscriptions.
> 4. **Currency Logic:** Implement a utility to fetch USD/MYR exchange rates and display the converted total.
> 5. **Data Safety:** Implement a simple encryption middleware for the `amount` and `name` fields before saving to the DB.
>
> **Constraints & Quality:**
>
> - Follow "Clean Code" principles (SOLID).
> - Use Lucide-React for icons.
> - Ensure all components are accessible (Aria-labels).
> - Every interaction must have a subtle `framer-motion` fade or scale effect.

------

## 6. Future Expansion Declarations (Scalability)

To ensure the code remains healthy for the founder's vision:

- **Auth Ready:** Use `/api/auth/[...nextauth]` placeholders in the route structure.
- **Analytics Ready:** Create a reserved `/analytics` page directory for future Recharts/Chart.js implementation.
- **Extension Ready:** Design the API endpoints to be RESTful so a Chrome Extension can eventually POST data to the same schema.

------

## 7. Security & Compliance

- **Encryption:** Use `crypto-js` for AES-256 encryption on sensitive string fields.
- **Environment Variables:** All API keys (Exchange rate API) must be strictly handled via `.env.local`.