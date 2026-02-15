import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BottomFabricNav } from "@/components/layout/bottom-fabric-nav";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Campus Market P2P | Buy & Sell on Campus",
  description: "The #1 student marketplace for buying, selling, and connecting across Nigerian campuses.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <body className="bg-nexus-dark text-gray-100 antialiased min-h-screen flex flex-col pb-24 selection:bg-nexus-primary selection:text-white">
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Main Content Area - The Stream resides here */}
            <main className="flex-grow relative z-0">
              {children}
            </main>

            {/* NEXUS Bottom Fabric Navigation */}
            <BottomFabricNav />
            <Toaster />

          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}