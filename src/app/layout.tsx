import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BottomFabricNav } from "@/components/layout/bottom-fabric-nav";
import { Toaster } from "@/components/ui/toaster";
import { MobileBridge } from "@/components/mobile/mobile-bridge";
import Script from "next/script";
import LiveTicker from "@/components/layout/live-ticker";
import { AdminSetup } from "@/components/auth/AdminSetup";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Campus Market P2P | Buy & Sell on Campus",
  description: "The #1 student marketplace for buying, selling, and connecting across Nigerian campuses.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Campus Market",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: "#00a884",
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
        <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense fallback={null}>
              <AdminSetup />
            </Suspense>
            <LiveTicker />
            {/* Main Content Area - The Stream resides here */}
            <main className="flex-grow relative z-0">
              {children}
            </main>

            {/* NEXUS Bottom Fabric Navigation */}
            <BottomFabricNav />
            <Toaster />
            <MobileBridge />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}