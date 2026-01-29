"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Chat {
  id: string;
  listing_id?: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  listing_title?: string;
  listing_image?: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatsPage() {
  const supabase = createClient();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
        // Mock chat data for demo
        setChats([
          {
            id: "chat-1",
            other_user_id: "user-2",
            other_user_name: "Sarah (iPhone Seller)",
            other_user_avatar: "👩‍🦰",
            last_message: "Yes, it's available and in mint condition!",
            last_message_time: "2 min",
            unread_count: 0,
            listing_title: "iPhone 13 Pro Max 256GB",
            listing_image: "📱",
          },
          {
            id: "chat-2",
            other_user_id: "user-3",
            other_user_name: "Chioma (Textbook Buyer)",
            other_user_avatar: "👩‍🎓",
            last_message: "Is the discrete mathematics book still available?",
            last_message_time: "15 min",
            unread_count: 1,
            listing_title: "Discrete Mathematics - 3rd Edition",
            listing_image: "📚",
          },
          {
            id: "chat-3",
            other_user_id: "user-4",
            other_user_name: "Tunde (Laptop Inquiry)",
            other_user_avatar: "👨‍💻",
            last_message: "What's the lowest price for the MacBook?",
            last_message_time: "1 hour",
            unread_count: 0,
            listing_title: "MacBook Air M1 2022",
            listing_image: "💻",
          },
        ]);
      }
      setIsLoading(false);
    };
    loadUser();
  }, [supabase]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUserId) return;

    const message = {
      id: `msg-${Date.now()}`,
      chat_id: selectedChat.id,
      sender_id: currentUserId,
      content: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#111b21]">
        <div className="max-w-2xl mx-auto p-4">
          <p className="text-center text-gray-500">Loading chats...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21] flex flex-col">
      {/* Header */}
      {selectedChat ? (
        <div className="sticky top-0 z-40 bg-white dark:bg-[#111b21] border-b border-gray-100 dark:border-[#2a3942] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSelectedChat(null)}
            className="text-wa-teal font-bold text-lg"
          >
            ←
          </button>
          <div className="flex-1">
            <h2 className="font-black text-gray-900 dark:text-white">
              {selectedChat.other_user_avatar} {selectedChat.other_user_name}
            </h2>
            <p className="text-xs text-gray-500">{selectedChat.listing_title}</p>
          </div>
        </div>
      ) : (
        <div className="sticky top-0 z-40 bg-white dark:bg-[#111b21] border-b border-gray-100 dark:border-[#2a3942] px-4 py-4">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">💬 Chats</h1>
          <p className="text-xs text-gray-500 mt-1">Your conversations about listings</p>
        </div>
      )}

      {selectedChat ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">{selectedChat.listing_image}</p>
                <p className="font-bold text-gray-900 dark:text-white mb-1">
                  {selectedChat.listing_title}
                </p>
                <p className="text-sm text-gray-500">Start a conversation</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-2xl ${
                      msg.sender_id === currentUserId
                        ? "bg-wa-teal text-white rounded-br-none"
                        : "bg-gray-100 dark:bg-[#202c33] text-gray-900 dark:text-white rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Composer */}
          <div className="border-t border-gray-100 dark:border-[#2a3942] p-3 bg-white dark:bg-[#111b21]">
            <div className="flex items-end gap-2">
              <button className="text-xl p-2 hover:bg-gray-100 dark:hover:bg-[#202c33] rounded-full">
                📎
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-[#202c33] text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-wa-teal text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="text-wa-teal font-bold p-2 hover:bg-gray-100 dark:hover:bg-[#202c33] rounded-full disabled:opacity-50"
              >
                📤
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-gray-100 dark:divide-[#2a3942] overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-gray-500 text-lg font-medium">No chats yet</p>
              <p className="text-gray-400 text-sm">Find an item and start chatting with sellers</p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className="w-full p-4 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors text-left active:bg-gray-100 dark:active:bg-[#1a252c]"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar & Unread Badge */}
                  <div className="relative flex-shrink-0">
                    <div className="text-3xl">{chat.other_user_avatar}</div>
                    {chat.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {chat.unread_count}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {chat.other_user_name}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {chat.last_message_time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 truncate">
                      {chat.listing_image} {chat.listing_title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {chat.last_message}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </main>
  );
}
