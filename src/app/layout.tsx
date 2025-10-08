import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
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
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <NextAuthProvider session={session}>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Toaster position="top-right" richColors />
          </NextAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
