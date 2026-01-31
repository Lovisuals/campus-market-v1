"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Listing } from "@/lib/types";

export default function SearchPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Listing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    campus: "",
    condition: "",
  });

  const campuses = ["UNILAG", "LASU", "YABATECH", "TASUED", "OOU", "UI", "OAU", "UNN"];
  const categories = ["Books", "Electronics", "Clothing", "Furniture", "Services", "Other"];
  const conditions = ["New", "Like New", "Good", "Fair"];

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      let query = supabase.from("listings").select("*").eq("is_approved", true);
      if (filters.category) query = query.eq("category", filters.category);
      if (filters.campus) query = query.eq("campus", filters.campus);
      if (filters.condition) query = query.eq("condition", filters.condition);
      if (filters.minPrice) query = query.gte("price", parseFloat(filters.minPrice));
      if (filters.maxPrice) query = query.lte("price", parseFloat(filters.maxPrice));
      if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);
      const { data, error } = await query;
      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21] pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Advanced Search</h1>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for items..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                title="Select category to filter"
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campus
              </label>
              <select
                name="campus"
                value={filters.campus}
                onChange={handleFilterChange}
                title="Select campus to filter"
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              >
                <option value="">All Campuses</option>
                {campuses.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Price
              </label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="₦0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Price
              </label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="₦999999"
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condition
              </label>
              <select
                name="condition"
                value={filters.condition}
                title="Select condition to filter"
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              >
                <option value="">All Conditions</option>
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-wa-teal text-white font-bold rounded-lg hover:bg-wa-dark-teal transition-colors"
          >
            🔍 Search
          </button>
        </form>
      </div>
    </main>
  );
}
