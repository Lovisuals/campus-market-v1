"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState({
    totalSold: 0,
    totalBought: 0,
    responseTime: "< 5 mins",
    completionRate: 100,
  });

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Please log in to view your profile</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21] pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="px-4 py-8 text-center">
          <div className="w-24 h-24 rounded-full bg-wa-teal mx-auto mb-4 flex items-center justify-center text-4xl">
            👤
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.full_name}</h1>
          <p className="text-gray-500 text-sm">{user.phone_number}</p>
          <p className="text-gray-500 text-sm">{user.campus}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 px-4 py-6">
          <div className="p-4 bg-gray-50 dark:bg-[#202c33] rounded-xl text-center">
            <p className="text-2xl font-black text-wa-teal">{stats.totalSold}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Items Sold</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-[#202c33] rounded-xl text-center">
            <p className="text-2xl font-black text-wa-teal">{stats.totalBought}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Items Bought</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-[#202c33] rounded-xl text-center">
            <p className="text-2xl font-black text-wa-teal">{stats.responseTime}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Response</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-[#202c33] rounded-xl text-center">
            <p className="text-2xl font-black text-wa-teal">{stats.completionRate}%</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Completion Rate</p>
          </div>
        </div>

        {/* Rating */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⭐</span>
            <div>
              <p className="text-xl font-black text-gray-900 dark:text-white">{user.rating.toFixed(1)}</p>
              <p className="text-sm text-gray-500">{user.total_reviews} reviews</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-6 space-y-3">
          <button className="w-full py-3 bg-wa-teal text-white font-bold rounded-lg hover:bg-wa-dark-teal">
            ✏️ Edit Profile
          </button>
          <button className="w-full py-3 bg-gray-100 dark:bg-[#202c33] text-gray-900 dark:text-white font-bold rounded-lg">
            🔐 Account Settings
          </button>
        </div>
      </div>
    </main>
  );
}
