import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Campus Market P2P",
  description: "The fastest way to sell as a student. NO SIGNUP, JUST BUY/SELL",
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
      <body className="bg-white text-gray-900 antialiased min-h-screen flex flex-col">
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {/* WhatsApp-Style Sticky Header */}
            <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-wa-teal to-[#006d59] shadow-md">
              <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-wa-teal font-black text-lg">🛍️</span>
                  </div>
                  <span className="font-black text-lg tracking-tight text-white">
                    Campus Market
                  </span>
                </Link>
                
                <nav className="flex items-center gap-1 sm:gap-3">
                  <Link 
                    href="/market" 
                    className="text-sm font-bold text-white hover:bg-white/20 transition-all px-3 py-2 rounded-lg"
                  >
                    📦 Browse
                  </Link>
                  <Link 
                    href="/chats" 
                    className="text-sm font-bold text-white hover:bg-white/20 transition-all px-3 py-2 rounded-lg relative"
                  >
                    💬 Chats
                    <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></span>
                  </Link>
                  <Link 
                    href="/post" 
                    className="bg-white text-wa-teal px-4 py-2 rounded-full text-xs font-black hover:shadow-lg transition-all"
                  >
                    Sell Fast
                  </Link>
                </nav>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow">
              {children}
            </main>

            {/* Mobile-Friendly Footer */}
            <footer className="border-t border-gray-100 py-8 bg-gray-50/50">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-sm text-gray-400 font-medium">
                  © 2025 Campus Market P2P • Built for Students
                </p>
              </div>
            </footer>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}