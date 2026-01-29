"use client";

import { useState } from "react";

export default function ModerationPage() {
  const [flaggedItems, setFlaggedItems] = useState([]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">🚩 Moderation Queue</h1>

        {flaggedItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-[#202c33] rounded-lg">
            <p className="text-gray-500 text-lg">No flagged content</p>
            <p className="text-gray-400 text-sm">All items are compliant with community guidelines</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedItems.map((item: any) => (
              <div key={item.id} className="p-6 bg-gray-50 dark:bg-[#202c33] rounded-lg border border-gray-200 dark:border-[#2a3942]">
                {/* Flagged item content */}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
