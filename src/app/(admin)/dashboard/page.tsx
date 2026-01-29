"use client";

import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
  });

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">📊 Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-3xl font-black text-blue-600">{stats.totalUsers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
          </div>
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-3xl font-black text-green-600">{stats.totalListings}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Listings</p>
          </div>
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-3xl font-black text-yellow-600">{stats.pendingApprovals}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
          </div>
          <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-3xl font-black text-purple-600">₦{stats.totalRevenue}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-6 bg-gray-100 dark:bg-[#202c33] rounded-lg hover:shadow-md transition-shadow text-left">
            <p className="font-bold text-gray-900 dark:text-white">✅ Approve Listings</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review pending listings</p>
          </button>
          <button className="p-6 bg-gray-100 dark:bg-[#202c33] rounded-lg hover:shadow-md transition-shadow text-left">
            <p className="font-bold text-gray-900 dark:text-white">🚩 Moderation Queue</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review flagged content</p>
          </button>
        </div>
      </div>
    </main>
  );
}
