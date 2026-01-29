"use client";

import { useState } from "react";

export default function ChatsPage() {
  const [chats, setChats] = useState([]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-[#111b21] border-b border-gray-100 dark:border-[#2a3942] px-4 py-4">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">💬 Chats</h1>
        </div>

        {/* Chat List */}
        <div className="divide-y divide-gray-100 dark:divide-[#2a3942]">
          {chats.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No chats yet</p>
              <p className="text-gray-400 text-sm">Start chatting when you find an item</p>
            </div>
          ) : (
            chats.map((chat: any) => (
              <div key={chat.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#202c33] cursor-pointer transition-colors">
                {/* Chat item content */}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
