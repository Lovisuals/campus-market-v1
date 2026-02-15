"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

function ProfilePageContent() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('id');

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSold: 0,
    totalBought: 0,
    responseTime: "< 5 mins",
    completionRate: 100,
  });

  const [listings, setListings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'selling' | 'about'>('selling');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      const supabase = createClient();

      const userIdToFetch = targetUserId || authUser?.id;
      if (!userIdToFetch) {
        setIsLoading(false);
        return;
      }

      // 1. Fetch User Data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", userIdToFetch)
        .single();

      setUser(userData);

      // 2. Fetch User Listings
      const { data: listingData } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", userIdToFetch)
        .in("visibility", ['public', 'profile_only'])
        .order("created_at", { ascending: false });

      setListings(listingData || []);
      setIsLoading(false);
    };

    if (!authLoading) {
      fetchProfileData();
    }
  }, [authUser, authLoading, targetUserId]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111b21]">
        <div className="w-8 h-8 border-4 border-nexus-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Profile not found</p>
      </main>
    );
  }

  const isOwnProfile = authUser?.id === user.id;

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21] pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="px-4 py-12 text-center bg-gradient-to-b from-gray-50 to-white dark:from-[#202c33] dark:to-[#111b21] border-b border-gray-100 dark:border-white/5">
          <div className="w-24 h-24 rounded-full bg-nexus-primary mx-auto mb-4 flex items-center justify-center text-4xl shadow-xl ring-4 ring-white dark:ring-[#111b21]">
            👤
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.full_name}</h1>
          <p className="text-nexus-primary font-bold text-sm mb-1">{user.campus}</p>
          {isOwnProfile && (
            <p className="text-gray-400 text-[10px] mt-1 italic">{user.phone || 'No Phone'} • {user.email}</p>
          )}

          <div className="mt-6 flex justify-center gap-8">
            <div className="text-center">
              <p className="font-black text-xl text-gray-900 dark:text-white">{listings.length}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Postings</p>
            </div>
            <div className="text-center border-l border-gray-200 dark:border-white/10 pl-8">
              <p className="font-black text-xl text-gray-900 dark:text-white">{user.vouch_count || 0}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Vouches</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white dark:bg-[#111b21] sticky top-16 z-30">
          <button
            onClick={() => setActiveTab('selling')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'selling' ? 'text-nexus-primary border-b-2 border-nexus-primary' : 'text-gray-400'}`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'about' ? 'text-nexus-primary border-b-2 border-nexus-primary' : 'text-gray-400'}`}
          >
            About
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          {activeTab === 'selling' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {listings.map(item => (
                <div key={item.id} className="aspect-[3/4] bg-gray-100 dark:bg-[#202c33] rounded-xl overflow-hidden relative group cursor-pointer border border-gray-100 dark:border-white/5">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] font-bold line-clamp-1">{item.title}</p>
                    <p className="text-white font-black text-xs">₦{item.price?.toLocaleString()}</p>
                  </div>

                  {item.visibility === 'profile_only' && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-400 text-black text-[8px] font-black rounded-full">HIDDEN</div>
                  )}
                </div>
              ))}
              {listings.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-20 font-medium">No items listed yet.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats & Actions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-gray-50 dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-white/5 text-center">
                  <p className="text-xl font-black text-nexus-primary">{stats.responseTime}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Response</p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-white/5 text-center">
                  <p className="text-xl font-black text-nexus-primary">{stats.completionRate}%</p>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Success</p>
                </div>
              </div>

              {isOwnProfile ? (
                <button className="w-full py-4 bg-nexus-primary text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  EDIT PROFILE
                </button>
              ) : (
                <button className="w-full py-4 bg-nexus-primary text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  VOUCH FOR SELLER
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111b21]">
        <div className="w-8 h-8 border-4 border-nexus-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
