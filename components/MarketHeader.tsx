"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function MarketHeader() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    timerRef.current = setTimeout(() => {
      const key = prompt("🔐 ADMIN ACCESS REQUIRED");
      if (key === "admin123") router.push("/admin/dashboard");
    }, 3000);
  };

  const handleEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div className="flex justify-between items-end mb-6 select-none pt-4">
      <div 
        onMouseDown={handleStart} 
        onMouseUp={handleEnd}
        onTouchStart={handleStart} 
        onTouchEnd={handleEnd}
        className="cursor-pointer active:opacity-50 transition-opacity"
      >
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Market<span className="text-wa-teal">P2P</span>
        </h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Live Student Feed
        </p>
      </div>
    </div>
  );
}