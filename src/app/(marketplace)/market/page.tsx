"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useListings } from "@/lib/hooks/useListings";
import ProductCard from "@/app/market/ProductCard";
import StoriesRail from "@/app/market/StoriesRail";
import { Listing } from "@/lib/types";

export default function MarketPage() {
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

  const handleBuyClick = (item: Listing) => {
    // TODO: Implement chat/contact flow
    console.log("Buy clicked:", item);
  };

  const handleExpungeProduct = (id: string) => {
    // TODO: Implement admin delete
    console.log("Delete clicked:", id);
  };

  const handleVerifyProduct = (id: string, current: boolean) => {
    // TODO: Implement admin verify
    console.log("Verify clicked:", id, current);
  };

  const handleFulfillRequest = (item: Listing) => {
    // TODO: Implement fulfill request flow
    console.log("Fulfill clicked:", item);
  };

  const handleOpenGallery = (images: string[], index: number) => {
    // TODO: Implement gallery modal
    console.log("Gallery opened:", index);
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
      <StoriesRail activeCampus={activeCampus} setActiveCampus={setActiveCampus} />

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
              <ProductCard
                key={listing.id}
                item={listing}
                viewMode={viewMode}
                isAdmin={false}
                handlers={handlers}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
