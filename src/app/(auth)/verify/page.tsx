"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const phoneNumber = searchParams.get("phone") || "";
  const isRegister = searchParams.get("register") === "true";

  const supabase = createClient();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: "sms",
      });

      if (verifyError) throw verifyError;

      if (isRegister) {
        // Complete registration
        const registrationData = JSON.parse(
          sessionStorage.getItem("registrationData") || "{}"
        );

        const { error: insertError } = await supabase.from("users").insert([
          {
            id: data.user?.id,
            phone_number: phoneNumber,
            full_name: registrationData.full_name,
            email: registrationData.email,
            campus: registrationData.campus,
            is_verified: true,
            is_admin: false,
            rating: 5,
            total_reviews: 0,
            is_elite: false,
          },
        ]);

        if (insertError) throw insertError;
        sessionStorage.removeItem("registrationData");
      }

      // Redirect to marketplace
      router.push("/market");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-wa-teal to-[#006d59] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
            <span className="text-4xl">📱</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Verify OTP</h1>
          <p className="text-white/80 text-sm">Almost there!</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Instructions */}
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              We sent a 6-digit code to
            </p>
            <p className="text-gray-900 font-black text-lg mt-1">
              {phoneNumber}
            </p>
            <p className="text-gray-500 text-xs mt-3">
              Don't see it? Check your SMS or spam folder
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                🔐 Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                className="w-full px-6 py-4 text-3xl tracking-[0.5em] text-center border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all font-bold text-wa-teal"
                required
              />
              <p className="text-xs text-gray-500 mt-3 text-center">
                Enter the 6-digit code
              </p>
            </div>

              {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <p className="text-red-700 text-sm font-semibold">❌ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-wa-teal to-[#006d59] text-white font-black rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 text-lg"
            >
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>

          {/* Resend Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Didn't receive a code?{" "}
              <button className="text-wa-teal font-bold hover:underline">
                Resend OTP
              </button>
            </p>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              🔒 Your code expires in 10 minutes
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-8">
          <p className="text-white/70 text-xs">
            Campus Market Security • Your account is protected
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-wa-teal to-[#006d59] flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>}>
      <VerifyPageContent />
    </Suspense>
  );
}
