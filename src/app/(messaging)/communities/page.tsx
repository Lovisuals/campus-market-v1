"use client";

import { useState } from "react";

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-[#111b21] border-b border-gray-100 dark:border-[#2a3942] px-4 py-4">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">👥 Communities</h1>
        </div>

        {/* Communities Grid */}
        <div className="p-4">
          {communities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No communities yet</p>
              <p className="text-gray-400 text-sm">Join campus communities to connect</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {communities.map((community: any) => (
                <div
                  key={community.id}
                  className="p-4 bg-gray-50 dark:bg-[#202c33] rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Community card content */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
