import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { redis } from "@/lib/redis";
import prisma from "@/lib/prisma";
import { cookies as getCookies } from "next/headers";
import ThemeInitializer from "@/components/layout/ThemeInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Subly - Dashboard",
  description: "Your subscriptions overview.",
};

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const c = await cookies();
  const auth = c.get("auth");
  if (!auth) {
    redirect("/login");
  }
  // Enforce email verification gate
  let userId = await redis.get<string>(`session:${auth.value}`);
  if (!userId) {
    const session = await prisma.session.findUnique({ where: { token: auth.value } });
    if (session && session.expiresAt > new Date()) {
      userId = session.userId;
    }
  }
  if (!userId) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && !user.isVerified) {
    redirect("/verify/notice");
  }
  const cookieStore = await getCookies();
  const theme = cookieStore.get("theme")?.value;
  const isDark = theme === "dark" ? true : theme === "light" ? false : undefined;

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased pb-20 md:pb-0 ${isDark ? 'dark' : ''}`}>
      <ThemeInitializer />
      <div className="md:hidden sticky top-0 z-50 bg-[#F5F5F7]/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">Subly</h1>
          <details className="relative">
            <summary className="list-none cursor-pointer select-none inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white/90 dark:bg-[#2C2C2E]/95 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-2xl p-2">
              <nav className="space-y-1">
                <a href="/dashboard" className="block px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10">Dashboard</a>
                <a href="/settings" className="block px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10">Settings</a>
              </nav>
            </div>
          </details>
        </div>
      </div>
      <div className="flex min-h-screen bg-[#F5F5F7] dark:bg-[#1C1C1E]">
        <Sidebar userEmail={user?.email || undefined} userDisplayName={user?.displayName || undefined} />
        <main className="flex-1 md:ml-64 transition-all duration-300 w-full">
          {children}
        </main>
      </div>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
