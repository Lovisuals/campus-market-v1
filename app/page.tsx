"use client"; // Safety Switch

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  // We use client-side logic to avoid Server Crashes
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-white"></div>; // Prevent hydration mismatch

  return (
    <main className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center pt-20 pb-10 px-4 text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
          Buy & Sell on <span className="text-wa-teal">Campus</span>
        </h1>
        <p className="text-gray-500 text-lg md:text-xl max-w-xl mx-auto font-medium">
          The fastest P2P marketplace for Nigerian students. No signups, just deals.
        </p>
        
        <div className="flex gap-3 justify-center mt-4">
          <Link 
            href="/market"
            className="bg-wa-teal text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform active:scale-95"
          >
            Start Trading 🚀
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 py-12 max-w-5xl mx-auto">
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-bold text-xl mb-2">Instant Speed</h3>
          <p className="text-gray-500 text-sm">No accounts needed. Connect directly via WhatsApp.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-3xl mb-3">🛡️</div>
          <h3 className="font-bold text-xl mb-2">Verified Students</h3>
          <p className="text-gray-500 text-sm">Trade safely within your campus community.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-3xl mb-3">💸</div>
          <h3 className="font-bold text-xl mb-2">Zero Fees</h3>
          <p className="text-gray-500 text-sm">We don't take a cut. 100% of the money is yours.</p>
        </div>
      </section>
    </main>
  );
}