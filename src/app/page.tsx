import { redirect } from 'next/navigation';

/**
 * Root Page Component
 * 
 * This component serves as the entry point for the application root route (/).
 * It automatically redirects the user to the dashboard page (/dashboard).
 * 
 * Implementation Details:
 * - Uses Next.js `redirect` function for server-side redirection.
 * - Redirects to `/dashboard` where the main dashboard content resides.
 */
export default function Home() {
  redirect('/dashboard');
}
