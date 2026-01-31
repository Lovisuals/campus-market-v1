"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Listing } from "@/lib/types";

interface Broadcast {
  id: string;
  message: string;
  created_at: string;
}

export default function MarketPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeCampus, setActiveCampus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "requests">("all");
  const [listings, setListings] = useState<Listing[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBroadcastIndex, setCurrentBroadcastIndex] = useState(0);

  const campuses = ["All", "UNILAG", "LASU", "YABATECH", "TASUED", "OOU", "UI", "OAU", "UNN"];

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("listings")
          .select("*")
          .eq("is_approved", true)
          .eq("status", "active");

        if (activeCampus !== "All") {
          query = query.eq("campus", activeCampus);
        }

        if (searchQuery) {
          query = query.ilike("title", `%${searchQuery}%`);
        }

        if (viewMode === "requests") {
          query = query.eq("is_request", true);
        } else {
          query = query.eq("is_request", false);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [activeCampus, searchQuery, viewMode, supabase]);

  // Mock broadcasts data (in production, fetch from Supabase)
  useEffect(() => {
    setBroadcasts([
      { id: "1", message: "🚀 New Year Sale! 30% off on all electronics", created_at: new Date().toISOString() },
      { id: "2", message: "📚 Textbooks section updated with fresh stock", created_at: new Date().toISOString() },
      { id: "3", message: "✅ Campus Market now has verified seller badges", created_at: new Date().toISOString() },
    ]);
  }, []);

  // Auto-rotate broadcasts
  useEffect(() => {
    if (broadcasts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBroadcastIndex((prev) => (prev + 1) % broadcasts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [broadcasts]);

  const handleBuyClick = async (item: Listing) => {
    try {
      router.push(`/chats?seller_id=${item.seller_id}`);
    } catch (error) {
      console.error("Error initiating contact:", error);
    }
  };

  const handleExpungeProduct = async (id: string) => {
    if (!confirm("Delete this listing permanently?")) return;
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  const handleVerifyProduct = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_verified: !current })
        .eq("id", id);
      if (error) throw error;
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, is_verified: !current } : l)));
    } catch (error) {
      console.error("Error verifying listing:", error);
    }
  };

  const handleFulfillRequest = async (item: Listing) => {
    try {
      router.push(`/chats?request_id=${item.id}`);
    } catch (error) {
      console.error("Error fulfilling request:", error);
    }
  };

  const handleOpenGallery = (images: string[], index: number) => {
    console.log("Gallery opened:", images[index]);
  };

  const goToAdminPanel = () => {
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21] pb-20">
      {/* Scrolling Broadcast Alert */}
      {broadcasts.length > 0 && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-wa-teal to-[#006d59] text-white">
          <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <span className="text-lg font-bold flex-shrink-0">📢</span>
              <div className="overflow-hidden">
                <div
                  className="transition-all duration-500 ease-in-out whitespace-nowrap"
                  key={currentBroadcastIndex}
                >
                  {broadcasts[currentBroadcastIndex]?.message}
                </div>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0 ml-4">
              {broadcasts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBroadcastIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentBroadcastIndex ? "bg-white w-6" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-16 z-40 bg-white dark:bg-[#111b21] border-b border-gray-100 dark:border-[#2a3942]">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              {viewMode === "all" ? "📦 For Sale" : "🙋 Buy Requests"}
            </h1>
            <button
              onClick={goToAdminPanel}
              className="text-lg hover:scale-110 transition-transform"
              title="Admin Panel"
            >
              👑
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mb-3 sm:mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, sellers..."
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 dark:bg-[#2a3942] rounded-full text-sm outline-none focus:ring-2 focus:ring-wa-teal"
            />
            <button className="p-2 sm:p-2.5 bg-gray-100 dark:bg-[#2a3942] rounded-full text-gray-600 hover:text-wa-teal transition-colors min-w-[40px]">
              🔍
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("all")}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                viewMode === "all"
                  ? "bg-wa-teal text-white"
                  : "bg-gray-100 dark:bg-[#2a3942] text-gray-700 dark:text-gray-300"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setViewMode("requests")}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                viewMode === "requests"
                  ? "bg-[#8E44AD] text-white"
                  : "bg-gray-100 dark:bg-[#2a3942] text-gray-700 dark:text-gray-300"
              }`}
            >
              Requests
            </button>
          </div>
        </div>
      </div>

      {/* Campus Pills */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto snap-x-mandatory bg-gray-50 dark:bg-[#0b141a]">
        {campuses.map((campus) => (
          <button
            key={campus}
            onClick={() => setActiveCampus(campus)}
            className={`snap-center flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
              activeCampus === campus
                ? "bg-wa-teal text-white shadow-md shadow-green-200 dark:shadow-none"
                : "bg-white dark:bg-[#202c33] text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-[#2a3942]"
            }`}
          >
            {campus}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        {isLoading ? (
          <div className="text-center py-10 sm:py-12">
            <p className="text-gray-500">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-10 sm:py-12">
            <p className="text-gray-500 text-base sm:text-lg">No listings found</p>
            <p className="text-gray-400 text-sm">Try a different search or campus</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className={`bg-white dark:bg-[#202c33] rounded-lg overflow-hidden border transition-all ${
                  listing.is_verified
                    ? "border-green-400 dark:border-green-500 shadow-lg shadow-green-200 dark:shadow-green-900"
                    : "border-gray-100 dark:border-[#2a3942]"
                } hover:shadow-md`}
              >
                <div className="p-4 space-y-3">
                  {/* Verification Badge */}
                  {listing.is_verified && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
                      <span className="text-sm font-bold text-green-700 dark:text-green-400">✅ Verified</span>
                    </div>
                  )}

                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{listing.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      {listing.category}
                    </span>
                    <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      {listing.campus}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-wa-teal">
                    {listing.is_request ? "Budget: " : ""}₦
                    {typeof listing.price === "number" ? listing.price.toLocaleString() : listing.price || "TBD"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBuyClick(listing)}
                      className="flex-1 py-2 bg-wa-teal text-white rounded-lg font-bold text-sm hover:bg-[#075e54] transition-colors"
                    >
                      Contact
                    </button>
                    {viewMode === "requests" && (
                      <button
                        onClick={() => handleFulfillRequest(listing)}
                        className="flex-1 py-2 bg-[#8E44AD] text-white rounded-lg font-bold text-sm hover:bg-[#7a3a96] transition-colors"
                      >
                        Fulfill
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
