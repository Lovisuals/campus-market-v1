"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PostListingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    campus: "",
    condition: "like-new",
    isRequest: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = ["Books", "Electronics", "Clothing", "Furniture", "Services", "Other"];
  const campuses = ["UNILAG", "LASU", "YABATECH", "TASUED", "OOU", "UI", "OAU", "UNN"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user?.id) {
        throw new Error("Not authenticated");
      }

      const { error: insertError } = await supabase.from("listings").insert([
        {
          seller_id: sessionData.session.user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: formData.isRequest ? null : parseFloat(formData.price),
          budget: formData.isRequest ? parseFloat(formData.price) : null,
          campus: formData.campus,
          condition: formData.condition,
          is_request: formData.isRequest,
          is_approved: false,
          is_verified: false,
          status: "active",
          views: 0,
          saved_count: 0,
          currency: "NGN",
          images: [],
        },
      ]);

      if (insertError) throw insertError;

      router.push("/market");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21] pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-6">
          {formData.isRequest ? "📥 What are you looking for?" : "📤 What are you selling?"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isRequest"
                checked={formData.isRequest}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                This is a buy request
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., iPhone 13 Pro Max 256GB"
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the item in detail..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {formData.isRequest ? "Budget" : "Price"}
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="₦0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campus
              </label>
              <select
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
                required
              >
                <option value="">Select campus</option>
                {campuses.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-wa-teal text-white font-bold rounded-lg hover:bg-wa-dark-teal disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Publishing..." : "Publish Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}
