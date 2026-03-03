import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Subly - Subscription Manager",
  description: "Track and manage your subscriptions with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
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
      </body>
    </html>
  );
}
