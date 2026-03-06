import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
  title: "Subly - Subscription Manager",
  description: "Track and manage your subscriptions with ease.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await getCookies();
  const theme = cookieStore.get("theme")?.value;
  const isDark = theme === "dark" ? true : theme === "light" ? false : undefined;
  return (
    <html lang="en" className={isDark ? 'dark' : ''}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-20 md:pb-0`}
      >
        <ThemeInitializer />
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#1C1C1E]">
          {children}
        </div>
      </body>
    </html>
  );
}
