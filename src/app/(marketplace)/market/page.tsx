"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Listing } from "@/lib/types";

export default function MarketPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeCampus, setActiveCampus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "requests">("all");
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    console.log("Gallery preview:", { imageCount: images.length, currentIndex: index });
    // Gallery modal functionality to be implemented with dialog component
  };

  const handlers = {
    openGallery: handleOpenGallery,
    handleExpungeProduct,
    handleVerifyProduct,
    handleFulfillRequest,
    handleBuyClick,
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#111b21] border-b border-gray-100 dark:border-[#2a3942]">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
            {viewMode === "all" ? "📦 For Sale" : "🙋 Buy Requests"}
          </h1>

          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-[#2a3942] rounded-full text-sm outline-none focus:ring-2 focus:ring-wa-teal"
            />
            <button className="p-2 bg-gray-100 dark:bg-[#2a3942] rounded-full text-gray-600">
              ⚙️
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
              All Listings
            </button>
            <button
              onClick={() => setViewMode("requests")}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                viewMode === "requests"
                  ? "bg-[#8E44AD] text-white"
                  : "bg-gray-100 dark:bg-[#2a3942] text-gray-700 dark:text-gray-300"
              }`}
            >
              Buy Requests
            </button>
          </div>
        </div>
      </div>

      {/* Stories Rail */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto snap-x-mandatory border-b border-gray-100 dark:border-[#2a3942]">
        <div className="flex gap-2 flex-shrink-0">⚡ Stories coming soon</div>
      </div>

      {/* Campus Pills */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto snap-x-mandatory">
        {campuses.map((campus) => (
          <button
            key={campus}
            onClick={() => setActiveCampus(campus)}
            className={`snap-center flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
              activeCampus === campus
                ? "bg-wa-teal text-white"
                : "bg-gray-100 dark:bg-[#2a3942] text-gray-700 dark:text-gray-300"
            }`}
          >
            {campus}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No listings found</p>
            <p className="text-gray-400 text-sm">Try a different search or campus</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-[#202c33] rounded-xl overflow-hidden border border-gray-100 dark:border-[#2a3942] hover:shadow-lg transition-shadow"
              >
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{listing.title}</h3>
                  <p className="text-2xl font-black text-wa-teal">
                    ₦{typeof listing.price === "number" ? listing.price.toLocaleString() : listing.price || "TBD"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBuyClick(listing)}
                      className="flex-1 py-2 bg-wa-teal text-white rounded-lg font-bold text-sm"
                    >
                      Contact
                    </button>
                    {viewMode === "requests" && (
                      <button
                        onClick={() => handleFulfillRequest(listing)}
                        className="flex-1 py-2 bg-[#8E44AD] text-white rounded-lg font-bold text-sm"
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
