"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ChatThread {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  listing_title: string | null;
  last_message: string | null;
  last_message_at: string | null;
  other_user_name?: string;
}

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

function ChatsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ==== Load user + existing chats ====
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      let userId: string | null = null;

      // Path A: Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userId = session.user.id;
      }

      // Path B: Admin JWT from localStorage
      if (!userId) {
        const { getAdminUser } = await import("@/lib/admin-auth");
        const adminUser = getAdminUser();
        if (adminUser?.is_admin) {
          userId = adminUser.id;
        }
      }

      if (!userId) {
        router.push("/login");
        return;
      }
      setCurrentUserId(userId);

      // Fetch all chats where user is buyer or seller
      const { data: userChats, error } = await supabase
        .from("chats")
        .select("*")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (!error && userChats) {
        // Resolve other user names
        const enriched = await Promise.all(
          userChats.map(async (chat: ChatThread) => {
            const otherId = chat.buyer_id === userId ? chat.seller_id : chat.buyer_id;
            const { data: profile } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", otherId)
              .single();
            return {
              ...chat,
              other_user_name: profile?.full_name || "Unknown User",
            };
          })
        );
        setChats(enriched);
      }

      // If URL has params, auto-create/find chat
      const listingId = searchParams.get("listing_id");
      const sellerId = searchParams.get("seller_id");
      const listingTitle = searchParams.get("listing_title");

      if (sellerId && sellerId !== userId) {
        // Check if chat already exists for this listing+buyer+seller
        let existingChat = null;
        if (listingId) {
          const { data } = await supabase
            .from("chats")
            .select("*")
            .eq("listing_id", listingId)
            .eq("buyer_id", userId)
            .eq("seller_id", sellerId)
            .single();
          existingChat = data;
        }

        if (existingChat) {
          // Resolve name
          const { data: profile } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", sellerId)
            .single();
          const enrichedChat = {
            ...existingChat,
            other_user_name: profile?.full_name || "Unknown User",
          };
          setSelectedChat(enrichedChat);
          loadMessages(existingChat.id);
        } else {
          // Create new chat
          const { data: newChat, error: createError } = await supabase
            .from("chats")
            .insert({
              listing_id: listingId || null,
              buyer_id: userId,
              seller_id: sellerId,
              listing_title: listingTitle ? decodeURIComponent(listingTitle) : null,
            })
            .select()
            .single();

          if (!createError && newChat) {
            const { data: profile } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", sellerId)
              .single();
            const enrichedChat = {
              ...newChat,
              other_user_name: profile?.full_name || "Unknown User",
            };
            setSelectedChat(enrichedChat);
            setChats((prev) => [enrichedChat, ...prev]);

            // Send auto greeting
            const greeting = listingTitle
              ? `Hi! I'm interested in "${decodeURIComponent(listingTitle)}". Is it still available?`
              : "Hi! I'd like to know more about your listing.";

            await supabase.from("messages").insert({
              chat_id: newChat.id,
              sender_id: userId,
              content: greeting,
              message_type: "text",
            });

            await supabase
              .from("chats")
              .update({ last_message: greeting, last_message_at: new Date().toISOString() })
              .eq("id", newChat.id);

            loadMessages(newChat.id);
          }
        }
      }

      setIsLoading(false);
    };

    init();
  }, [supabase, router, searchParams]);

  // ==== Load messages for a chat ====
  const loadMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (!error && data) setMessages(data);
  };

  // ==== Realtime subscription ====
  useEffect(() => {
    if (!selectedChat) return;

    const channel = supabase
      .channel(`chat-${selectedChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, supabase]);

  // ==== Send message ====
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUserId || isSending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      await supabase.from("messages").insert({
        chat_id: selectedChat.id,
        sender_id: currentUserId,
        content,
        message_type: "text",
      });

      await supabase
        .from("chats")
        .update({ last_message: content, last_message_at: new Date().toISOString() })
        .eq("id", selectedChat.id);

      // Update local chat list
      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChat.id
            ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setIsSending(false);
    }
  };

  // ==== Select a chat ====
  const selectChat = (chat: ChatThread) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  // Time formatting
  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#111b21] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="h-screen bg-white dark:bg-[#111b21] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-wa-teal text-white px-4 py-3 flex items-center justify-between">
        {selectedChat ? (
          <>
            <button onClick={() => setSelectedChat(null)} className="font-bold text-lg mr-3">
              ←
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base truncate">{selectedChat.other_user_name}</h2>
              {selectedChat.listing_title && (
                <p className="text-xs text-white/70 truncate">Re: {selectedChat.listing_title}</p>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-black">💬 Messages</h1>
            <button
              onClick={() => router.push("/market")}
              className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full hover:bg-white/30"
            >
              ← Market
            </button>
          </>
        )}
      </div>

      {!selectedChat ? (
        /* ==== Chat List ==== */
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="text-center py-20 px-4">
              <p className="text-5xl mb-4">💬</p>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">No conversations yet</h2>
              <p className="text-gray-500 text-sm mb-6">
                Find something you like on the market and click &quot;Message to Buy&quot;
              </p>
              <button
                onClick={() => router.push("/market")}
                className="px-6 py-3 bg-wa-teal text-white font-bold rounded-xl hover:bg-[#006d59] transition-colors"
              >
                Browse Market
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-wa-teal rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {chat.other_user_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                        {chat.other_user_name}
                      </h3>
                      {chat.last_message_at && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatTime(chat.last_message_at)}
                        </span>
                      )}
                    </div>
                    {chat.listing_title && (
                      <p className="text-xs text-wa-teal font-semibold truncate">📦 {chat.listing_title}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate">{chat.last_message || "No messages yet"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ==== Message View ==== */
        <>
          {/* Listing Context Banner */}
          {selectedChat.listing_title && selectedChat.listing_id && (
            <button
              onClick={() => router.push(`/product/${selectedChat.listing_id}`)}
              className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 px-4 py-2.5 flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <span>📦</span>
              <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold truncate">
                {selectedChat.listing_title}
              </span>
              <span className="text-blue-400 text-xs ml-auto flex-shrink-0">View →</span>
            </button>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {messages.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                Start your conversation! 💬
              </div>
            )}
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${isMine
                      ? "bg-[#005c4b] text-white rounded-br-md"
                      : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-bl-md border border-gray-100 dark:border-gray-700"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-gray-400"} text-right`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Composer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-[#1a252c] border-t border-gray-200 dark:border-gray-800 px-3 py-3">
            <div className="flex gap-2 items-end max-w-3xl mx-auto">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-white dark:bg-[#202c33] rounded-full text-sm outline-none focus:ring-2 focus:ring-wa-teal border border-gray-200 dark:border-gray-700"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="w-11 h-11 bg-wa-teal text-white rounded-full flex items-center justify-center hover:bg-[#006d59] transition-colors disabled:opacity-50 active:scale-95 flex-shrink-0"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-lg">➤</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default function ChatsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white dark:bg-[#111b21] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
        </main>
      }
    >
      <ChatsPageInner />
    </Suspense>
  );
}
