import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { redis } from "@/lib/redis";
import prisma from "@/lib/prisma";

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

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased pb-20 md:pb-0`}
    >
      <div className="flex min-h-screen bg-[#F5F5F7] dark:bg-[#1C1C1E]">
        <Sidebar />
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
