## Role: Senior Full-Stack Architect & Vibe Code Expert

## Situation
We are crafting the frontend for "Subly," a minimalist subscription manager. The goal is to implement a high-fidelity, Apple-inspired user interface that feels fluid, organic, and premium, utilizing the backend services and database structure established in previous phases.

## Context & Technical Specifications
- **Framework:** Next.js 14+ (App Router) with `framer-motion` for high-end animations.
- **Styling:** Tailwind CSS + Shadcn/UI (specifically using `vaul` for drawers).
- **Navigation:** Bottom Tab Bar (fixed) for a mobile-first iOS experience.
- **Theme:** - **Light Mode:** Apple Off-white (#F5F5F7) background with high-contrast typography.
    - **Dark Mode:** "Midnight Grey" (Deep blue-tinted dark grey) instead of pure black.
- **Currency Display:** All amounts fetched from the backend as Integers (Cents) must be formatted correctly to MYR (e.g., 3490 -> RM 34.90).

## Task: UI/UX Implementation

### 1. Global Layout & Theme Configuration
- Implement a `RootLayout` that supports a fixed **Bottom Tab Bar** (Icons: Dashboard, Analytics, Settings).
- Configure the **Midnight Grey** dark theme in `tailwind.config.js`.
- Use `framer-motion`'s `AnimatePresence` to handle smooth page transitions between tabs.

### 2. The Dashboard "Hero" Component
- **Visuals:** Create a "Big Number" display showing the Total Monthly Spend.
- **Background:** Implement an animated **Mesh Gradient** background (soft, moving blobs of color) behind the total spend.
- **Logic:** Use a `useCountUp` hook or Framer Motion to animate the total amount from 0 to the current value on load.

### 3. The Subscription List & Cards
- **Haptic UI:** Each subscription card must feature a "Press-Down" effect using `framer-motion` (`whileTap={{ scale: 0.98 }}`).
- **Visuals:** Include a blurred shadow that expands slightly when the card is pressed.
- **Structure:** Display a brand logo placeholder (initials or Lucide icon), service name, and the "Upcoming Payment" tag if applicable.

### 4. Interactive Drawer (The "Add" Experience)
- Use the **Vaul** (Drawer) component for adding/editing subscriptions.
- The drawer should slide up from the bottom with a dimmed backdrop.
- **Smart Form:** Include fields for Name, Amount (masking input for decimal behavior while sending integers to the backend), Cycle, and Category.

### 5. Skeleton Loaders & States
- Implement **Apple-style Skeleton Screens** for the dashboard and list items using a subtle "shimmer" effect.
- Create an **Empty State** for new users: A clean, centered layout with a "Clarity starts here" message and a prominent "Add Subscription" call-to-action.

### 6. Animation Specs (The "Apple" Feel)
- Use "Spring" physics for all movements: `stiffness: 260, damping: 20`.
- Implement a staggered entrance animation for list items when the dashboard loads.

## Constraints & Quality Standards
- **Responsive:** The design must look like a native app on mobile and a focused, centered card layout on desktop.
- **Performance:** Ensure the Mesh Gradient does not cause high CPU usage (use CSS transitions or optimized canvas where possible).
- **Accessibility:** Ensure all interactive elements have sufficient tap targets (minimum 44x44px) and appropriate ARIA labels.
- **Clean Code:** Use atomic components (e.g., `Button.tsx`, `SubscriptionCard.tsx`, `SpendDisplay.tsx`).