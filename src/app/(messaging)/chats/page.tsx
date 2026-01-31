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
  is_platform_owner?: boolean;
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
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
        // Mock chat data for demo
        setChats([
          {
            id: "chat-owner",
            other_user_id: "platform-owner",
            other_user_name: "Campus Market Support",
            other_user_avatar: "🎓",
            last_message: "Hi! Need help? We're here to assist.",
            last_message_time: "Now",
            unread_count: 0,
            listing_title: "Platform Support",
            listing_image: "⭐",
            is_platform_owner: true,
          },
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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-[#111b21]">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-wa-teal border-t-transparent rounded-full"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-[#111b21]">
        <div className="flex flex-col h-screen">
          {/* Header - Premium */}
          {selectedChat ? (
            <div className="sticky top-0 z-40 bg-white dark:bg-[#111b21] border-b border-gray-200 dark:border-gray-800 shadow-sm px-4 py-3.5 flex items-center gap-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="text-wa-teal font-bold text-xl hover:bg-gray-100 dark:hover:bg-[#202c33] p-2 rounded-lg transition-colors"
              >
                ←
              </button>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                  {selectedChat.other_user_avatar} {selectedChat.other_user_name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedChat.listing_title}</p>
              </div>
              {selectedChat.is_platform_owner && (
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                  Official
                </div>
              )}
            </div>
          ) : (
            <div className="sticky top-0 z-40 bg-white dark:bg-[#111b21] border-b border-gray-200 dark:border-gray-800 shadow-sm px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💬 Messages</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Connect with buyers & sellers</p>
                </div>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-wa-teal text-white px-4 py-2 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-wa-teal/30 transition-all active:scale-95"
                >
                  + New
                </button>
              </div>
            </div>
          )}

          {selectedChat ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages Area - Premium with better spacing */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center">
                    <p className="text-5xl mb-4">{selectedChat.listing_image}</p>
                    <p className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                      {selectedChat.listing_title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChat.is_platform_owner ? "Message us anytime" : "Start your conversation"}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm transition-all ${
                          msg.sender_id === currentUserId
                            ? "bg-gradient-to-r from-wa-teal to-wa-dark text-white rounded-br-sm"
                            : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1.5">
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

              {/* Message Composer - Premium */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-[#111b21]">
                <div className="flex items-end gap-2.5">
                  <button className="text-2xl p-2.5 hover:bg-gray-100 dark:hover:bg-[#202c33] rounded-xl transition-colors">
                    📎
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#202c33] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-wa-teal/50 focus:ring-offset-1 dark:focus:ring-offset-0 text-sm font-medium placeholder:text-gray-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="text-white bg-wa-teal px-4 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-wa-teal/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-5xl mb-4">💬</p>
                  <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">No messages yet</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Browse items and start chatting with sellers</p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="bg-wa-teal text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-wa-teal/30 transition-all active:scale-95"
                  >
                    Message Platform Owner
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`w-full p-4 hover:bg-gray-50 dark:hover:bg-[#1a252c] transition-colors active:bg-gray-100 dark:active:bg-[#0f1419] text-left ${
                        chat.is_platform_owner ? "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Avatar & Badge */}
                        <div className="relative flex-shrink-0">
                          <div className={`text-3xl p-2 rounded-full ${
                            chat.is_platform_owner ? "bg-blue-100 dark:bg-blue-900/30" : ""
                          }`}>
                            {chat.other_user_avatar}
                          </div>
                          {chat.unread_count > 0 && (
                            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                              {chat.unread_count}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                              {chat.other_user_name}
                              {chat.is_platform_owner && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                                  Official
                                </span>
                              )}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0 ml-2 font-medium">
                              {chat.last_message_time}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5 truncate">
                            {chat.listing_image} {chat.listing_title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate font-medium">
                            {chat.last_message}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* New Chat Modal - Premium */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-wa-teal to-wa-dark px-6 py-6">
              <h2 className="text-white font-bold text-xl">✉️ Start a Message</h2>
              <p className="text-white/80 text-sm mt-1">Quick reply to platform support</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Message Preview */}
              <div className="bg-gray-50 dark:bg-[#202c33] rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Preview</p>
                <div className="max-w-xs px-4 py-3 bg-gradient-to-r from-wa-teal to-wa-dark text-white rounded-2xl rounded-br-sm">
                  <p className="text-sm">{modalMessage || "Your message here..."}</p>
                </div>
              </div>

              {/* Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2.5">
                  Your Message
                </label>
                <textarea
                  value={modalMessage}
                  onChange={(e) => setModalMessage(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#202c33] border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-wa-teal focus:ring-2 focus:ring-wa-teal/20 text-sm font-medium placeholder:text-gray-500 resize-none"
                  rows={4}
                />
              </div>

              {/* Info */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 Message support directly for help with listings, payments, or account issues.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-[#202c33] px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setModalMessage("");
                }}
                className="flex-1 px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (modalMessage.trim()) {
                    // Start chat with platform owner
                    const ownerChat = chats.find(c => c.is_platform_owner);
                    if (ownerChat) {
                      setSelectedChat(ownerChat);
                      setMessages([
                        {
                          id: `msg-${Date.now()}`,
                          chat_id: ownerChat.id,
                          sender_id: currentUserId || "",
                          content: modalMessage,
                          created_at: new Date().toISOString(),
                        },
                      ]);
                    }
                    setShowNewChatModal(false);
                    setModalMessage("");
                  }
                }}
                disabled={!modalMessage.trim()}
                className="flex-1 px-4 py-2.5 text-white bg-gradient-to-r from-wa-teal to-wa-dark rounded-xl font-semibold hover:shadow-lg hover:shadow-wa-teal/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
