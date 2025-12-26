"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SellButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"sell" | "buy">("sell");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const campuses = ["UNILAG", "LASU", "YABATECH", "OOU", "UI", "UNIBEN", "FUTA", "UNILORIN", "ABU Zaria"];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // 1. Image Logic (Only for Sell)
    let publicUrl = null;
    const file = formData.get("image") as File;
    if (activeTab === "sell" && file && file.size > 0) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { error } = await supabase.storage.from("products").upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from("products").getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }
    }

    // 2. Insert Logic
    await supabase.from("products").insert({
      title: formData.get("title"),
      price: Number(formData.get("price")),
      category: formData.get("category") || "General",
      campus: formData.get("campus"),
      seller_phone: formData.get("phone"),
      image_url: publicUrl,
      listing_type: activeTab, // Stores "sell" or "buy"
    });

    setLoading(false);
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-3xl font-light hover:scale-110 transition-all z-40 text-white ${activeTab === 'sell' ? 'bg-wa-teal' : 'bg-purple-600'}`}
      >
        +
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#111b21] w-full max-w-md rounded-3xl p-5 shadow-2xl border border-gray-800 animate-in slide-in-from-bottom-10">
            
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setActiveTab("sell")} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "sell" ? "bg-wa-teal text-white" : "bg-gray-800 text-gray-500"}`}>I Want To Sell</button>
              <button onClick={() => setActiveTab("buy")} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "buy" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-500"}`}>I Want To Buy</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <select name="campus" className="bg-gray-800 text-white text-sm rounded-xl p-3 outline-none border border-gray-700" required>
                  {campuses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="category" className="bg-gray-800 text-white text-sm rounded-xl p-3 outline-none border border-gray-700">
                   <option value="General">Category</option><option value="Books">Books</option><option value="Gadgets">Gadgets</option>
                </select>
              </div>

              <input name="title" placeholder={activeTab === 'sell' ? "What are you selling?" : "What do you need?"} className="bg-gray-800 text-white p-4 rounded-xl outline-none border border-gray-700 placeholder-gray-500" required />
              <input name="price" type="number" placeholder={activeTab === 'sell' ? "Price (₦)" : "Budget (₦)"} className="bg-gray-800 text-white p-4 rounded-xl outline-none border border-gray-700 placeholder-gray-500" required />

              {activeTab === 'sell' && (
                <div className="relative h-20 bg-gray-800/50 border border-dashed border-gray-700 rounded-xl flex items-center justify-center">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Tap to Snap (Max 3)</span>
                  <input type="file" name="image" className="absolute inset-0 opacity-0 w-full h-full" />
                </div>
              )}

              <input name="phone" type="tel" placeholder="WhatsApp (234...)" className="bg-gray-800 text-white p-4 rounded-xl outline-none border border-gray-700 placeholder-gray-500" required />

              <button disabled={loading} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-white shadow-lg mt-2 ${activeTab === 'sell' ? 'bg-wa-teal' : 'bg-purple-600'}`}>
                {loading ? "Processing..." : (activeTab === 'sell' ? "LAUNCH AD" : "POST REQUEST")}
              </button>
              
              <button type="button" onClick={() => setIsOpen(false)} className="text-gray-500 text-xs font-bold uppercase tracking-widest py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}