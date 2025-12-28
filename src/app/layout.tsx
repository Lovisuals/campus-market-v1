import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light" // Defaulting to light for better product visibility
          enableSystem
          disableTransitionOnChange
        >
          {/* WhatsApp-Style Sticky Header */}
          <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xs">C</span>
                </div>
                <span className="font-black text-xl tracking-tighter uppercase italic">
                  Market<span className="text-green-600">P2P</span>
                </span>
              </Link>
              
              <nav className="flex items-center gap-4">
                <Link 
                  href="/market" 
                  className="text-sm font-bold text-gray-600 hover:text-green-600 transition-colors"
                >
                  Browse
                </Link>
                <Link 
                  href="/post" 
                  className="bg-green-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100"
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
      </body>
    </html>
  );
}