"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateAndNormalizePhone } from "@/lib/phone-validator";

export default function CompleteProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [campus, setCampus] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const campuses = [
    "UNILAG",
    "LASU",
    "YABATECH",
    "TASUED",
    "OOU",
    "UI",
    "OAU",
    "UNN",
    "ABU",
  ];

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user already has phone number
      const { data: userData } = await supabase
        .from("users")
        .select("phone, campus, full_name")
        .eq("id", user.id)
        .single();

      if (userData?.phone) {
        // Profile already complete, redirect to market
        router.push("/market");
        return;
      }

      // Pre-fill from metadata if available
      if (user.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }
      if (user.user_metadata?.campus) {
        setCampus(user.user_metadata.campus);
      }

      setCheckingProfile(false);
    };

    checkProfile();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate phone number
      const phoneValidation = validateAndNormalizePhone(phoneNumber, 'NG');
      if (!phoneValidation.valid) {
        setError(phoneValidation.error || 'Invalid phone number');
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get IP address for device tracking (Optional fallback)
      let userIp = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
        const { ip } = await ipResponse.json();
        userIp = ip;
      } catch (ipErr) {
        console.warn("IP tracking service unreachable, skipping IP log:", ipErr);
      }

      // Update user record with phone number
      const { error: updateError } = await supabase
        .from("users")
        .update({
          phone: phoneValidation.normalized,
          full_name: fullName,
          campus: campus,
          phone_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error("This phone number is already linked to another account.");
        }
        throw updateError;
      }

      // Store device hash (Non-blocking)
      try {
        const ipHash = await hashString(userIp);
        const deviceHash = await hashString(navigator.userAgent);

        await supabase.from("user_devices").insert({
          user_id: user.id,
          ip_hash: ipHash,
          phone: phoneValidation.normalized,
          device_hash: deviceHash,
          created_at: new Date().toISOString(),
        });
      } catch (deviceLogErr) {
        console.error("Failed to log device info:", deviceLogErr);
      }

      // Redirect to market
      router.push("/market");
    } catch (err: any) {
      console.error("Profile Update Failure:", err);
      setError(err.message || "Failed to update profile. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-wa-teal to-[#006d59] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-wa-teal to-[#006d59] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
            <span className="text-4xl">📱</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Complete Your Profile</h1>
          <p className="text-white/80 text-sm">We need your phone number to secure your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
            <p className="text-sm text-blue-700">
              <strong>🔐 Why phone number?</strong><br />
              Your phone number is used to verify your identity and secure your account.
              You'll use it to login next time.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                👤 Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all text-lg"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                📱 Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+234 801 234 5678"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all text-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Nigerian numbers only. You'll use this to login.
              </p>
            </div>

            {/* Campus */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                🏫 Campus
              </label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all text-lg"
                required
              >
                <option value="">Select your campus...</option>
                {campuses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <p className="text-red-700 text-sm font-semibold">❌ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-wa-teal to-[#006d59] text-white font-black rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 text-lg"
            >
              {isLoading ? "Saving..." : "Complete Profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
