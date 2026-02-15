"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkIsAdmin } from "@/lib/admin";
import AlertManager from "@/components/admin/alert-manager";

interface AdminListing {
  id: string;
  title: string;
  seller_id: string;
  campus: string;
  price: number;
  is_verified: boolean;
  created_at: string;
  status: string;
}

interface VerificationRequest {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  campus: string | null;
  phone_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    verifiedListings: 0,
    pendingVerifications: 0,
  });
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "verifications" | "users" | "alerts">("posts");

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      setIsLoading(true);
      try {
        // Check if user is admin
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          router.push("/login");
          return;
        }

        // Fetch user role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("is_admin, email, phone")
          .eq("id", session.user.id)
          .single();

        const hardcodedAdmin = checkIsAdmin(userData?.email, userData?.phone, userData?.is_admin);

        if (userError || !hardcodedAdmin) {
          router.push("/market");
          return;
        }

        setIsAdmin(true);

        // Fetch all listings
        const { data: allListings, error: listingsError } = await supabase
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });

        if (listingsError) throw listingsError;
        setListings(allListings || []);

        // Fetch verification requests
        const { data: verReqs, error: verError } = await supabase
          .from("verification_requests")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (!verError) {
          setVerificationRequests(verReqs || []);
        }

        // Fetch user count
        const { data: allUsers, count: userCount, error: countError } = await supabase
          .from("users")
          .select("id, email, phone, full_name, campus, phone_verified, is_admin, created_at", { count: "exact" })
          .order("created_at", { ascending: false });

        if (!countError && allUsers) {
          setUsers(allUsers);
        }

        // Calculate stats
        const verified = (allListings || []).filter((l) => l.is_verified).length;
        const pending = (verReqs || []).filter((v) => v.status === "pending").length;

        setStats({
          totalUsers: userCount || 0,
          totalListings: allListings?.length || 0,
          verifiedListings: verified,
          pendingVerifications: pending,
        });
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndFetch();
  }, [router, supabase]);

  const handleApproveVerification = async (requestId: string, sellerId: string) => {
    try {
      // Update verification request
      const { error: updateError } = await supabase
        .from("verification_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Verify all listings for this seller
      const { error: verifyError } = await supabase
        .from("listings")
        .update({ is_verified: true })
        .eq("seller_id", sellerId);

      if (verifyError) throw verifyError;

      setVerificationRequests((prev) => prev.filter((v) => v.id !== requestId));
      setStats((prev) => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications - 1,
        verifiedListings: prev.verifiedListings + 1,
      }));
      showToast('Verification approved successfully', 'success');
    } catch (error) {
      console.error("Error approving verification:", error);
      showToast('Failed to approve verification', 'error');
    }
  };

  const handleRejectVerification = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("verification_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      setVerificationRequests((prev) => prev.filter((v) => v.id !== requestId));
      setStats((prev) => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications - 1,
      }));
      showToast('Verification rejected', 'success');
    } catch (error) {
      console.error("Error rejecting verification:", error);
      showToast('Failed to reject verification', 'error');
    }
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 10 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Seeding failed');

      showToast(`✓ Seeded ${data.data.length} new listings!`, 'success');
      // Refresh listings
      const { data: newItems } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });
      setListings(newItems || []);
    } catch (error: any) {
      showToast(`✕ ${error.message}`, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/admin/sync-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync');
      }

      showToast(`✓ Successfully synced ${data.count} users to Google Sheets`, 'success');
    } catch (error: any) {
      console.error('Error syncing to sheets:', error);
      showToast(`✕ ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;

      setListings((prev) => prev.filter((l) => l.id !== id));
      setStats((prev) => ({ ...prev, totalListings: prev.totalListings - 1 }));
      setDeleteConfirm(null);
      showToast('Post deleted successfully', 'success');
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast('Failed to delete post', 'error');
    }
  };

  const handleVerifyPost = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_verified: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_verified: !currentStatus } : l))
      );

      if (!currentStatus) {
        setStats((prev) => ({ ...prev, verifiedListings: prev.verifiedListings + 1 }));
        showToast('Post verified successfully', 'success');
      } else {
        setStats((prev) => ({ ...prev, verifiedListings: prev.verifiedListings - 1 }));
        showToast('Post unverified successfully', 'success');
      }
    } catch (error) {
      console.error("Error verifying post:", error);
      showToast('Failed to verify post', 'error');
    }
  };

  // Don't render anything until auth check is complete
  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111b21] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            👑 Admin Control Panel
          </h1>
          <button
            onClick={() => router.push("/market")}
            className="px-4 py-2 bg-wa-teal text-white rounded-lg hover:bg-[#006d59] transition-colors"
          >
            Back to Market
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-3xl font-black text-blue-600">{stats.totalListings}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
          </div>
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-3xl font-black text-green-600">✅ {stats.verifiedListings}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
          </div>
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-3xl font-black text-yellow-600">
              {stats.totalListings - stats.verifiedListings}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Unverified</p>
          </div>
          <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-3xl font-black text-purple-600">{stats.totalUsers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === "posts"
              ? "bg-wa-teal text-white"
              : "bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
          >
            📋 Posts
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === "users"
              ? "bg-wa-teal text-white"
              : "bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === "alerts"
              ? "bg-wa-teal text-white"
              : "bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
          >
            📢 Site Alerts
          </button>
        </div>

        {/* Posts Management Table */}
        {activeTab === "posts" && (
          <div className="bg-white dark:bg-[#202c33] rounded-lg border border-gray-200 dark:border-[#2a3942] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-[#2a3942] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  📋 Post Management
                </h2>
                <p className="text-sm text-gray-500 mt-1">Delete or verify posts. Manage the marketplace.</p>
              </div>
              <button
                onClick={handleSeedData}
                disabled={isSeeding}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${isSeeding
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                  }`}
              >
                {isSeeding ? '🌱 Seeding...' : '✨ Seed Real-time Data'}
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading posts...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No posts to manage</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#111b21] border-b border-gray-200 dark:border-[#2a3942]">
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Campus
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Seller 📱
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <tr
                        key={listing.id}
                        className="border-b border-gray-200 dark:border-[#2a3942] hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {listing.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {listing.campus}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                          ₦{listing.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            {listing.is_verified ? (
                              <>
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-green-600 dark:text-green-400 font-semibold">
                                  Verified ✅
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                                <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                                  Unverified
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {users.find(u => u.id === listing.seller_id)?.phone ? (
                            <a
                              href={`https://wa.me/${users.find(u => u.id === listing.seller_id)?.phone?.replace(/\+/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-wa-teal font-bold hover:underline"
                            >
                              WhatsApp Nudge
                            </a>
                          ) : (
                            <span className="text-gray-400">No Phone</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm">
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            <button
                              onClick={() =>
                                handleVerifyPost(listing.id, listing.is_verified)
                              }
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold transition-colors min-w-[60px] sm:min-w-auto ${listing.is_verified
                                ? "bg-gray-200 dark:bg-[#3a4a52] text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                                : "bg-green-200 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-300"
                                }`}
                            >
                              {listing.is_verified ? "Unverify" : "Verify"}
                            </button>

                            {deleteConfirm === listing.id ? (
                              <>
                                <button
                                  onClick={() => handleDeletePost(listing.id)}
                                  className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1 rounded-full text-xs font-bold bg-gray-300 dark:bg-[#3a4a52] text-gray-700 dark:text-gray-300 hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(listing.id)}
                                className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Management Table */}
        {activeTab === "users" && (
          <div className="bg-white dark:bg-[#202c33] rounded-lg border border-gray-200 dark:border-[#2a3942] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-[#2a3942] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  👥 User Management
                </h2>
                <p className="text-sm text-gray-500 mt-1">View all registered users with email and phone details.</p>
              </div>
              <button
                onClick={handleSyncToSheets}
                disabled={isSyncing}
                className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${isSyncing
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
              >
                {isSyncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    📊 Sync to Google Sheets
                  </>
                )}
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#111b21] border-b border-gray-200 dark:border-[#2a3942]">
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Full Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Campus
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-200 dark:border-[#2a3942] hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {user.full_name || "—"}
                          {user.is_admin && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-bold">
                              ADMIN
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {user.phone || (
                            <span className="text-gray-400 dark:text-gray-600 italic">Not set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {user.campus || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.phone_verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-bold">
                              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Site Alerts Management */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#202c33] p-6 rounded-lg border border-gray-200 dark:border-[#2a3942]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">📢 Live Site Alerts</h2>
              <p className="text-sm text-gray-500 mb-6">Broadcast real-time scrolling messages to all active users on the platform.</p>
              <AlertManager />
            </div>
          </div>
        )}
      </div>

      {/* Scrolling Ticker Alert */}
      {toast && (
        <div className="fixed top-0 left-0 right-0 z-50 overflow-hidden">
          <div
            className={`py-3 ${toast.type === 'success'
              ? 'bg-green-600 dark:bg-green-700'
              : 'bg-red-600 dark:bg-red-700'
              }`}
          >
            <div className="animate-ticker whitespace-nowrap">
              <span className="inline-block px-8 text-white font-bold text-sm">
                {toast.type === 'success' ? '✓' : '✕'} {toast.message}
              </span>
              <span className="inline-block px-8 text-white font-bold text-sm">
                {toast.type === 'success' ? '✓' : '✕'} {toast.message}
              </span>
              <span className="inline-block px-8 text-white font-bold text-sm">
                {toast.type === 'success' ? '✓' : '✕'} {toast.message}
              </span>
              <span className="inline-block px-8 text-white font-bold text-sm">
                {toast.type === 'success' ? '✓' : '✕'} {toast.message}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
