import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Navbar from "@/components/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/config";
import { Toaster } from 'sonner';
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StravAwesome - Track Your Training Progress",
  description: "Track, analyze, and optimize your Strava training activities with AI-powered insights",
  keywords: ["strava", "training", "fitness", "running", "cycling", "analytics"],
  authors: [{ name: "StravAwesome" }],
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <NextAuthProvider session={session}>
              <Navbar />
              <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                  {children}
                </div>
              </main>
              <Toaster position="top-right" richColors />
            </NextAuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
