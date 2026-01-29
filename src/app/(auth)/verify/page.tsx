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
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Verify OTP</h1>
          <p className="text-gray-500">
            Enter the OTP sent to <strong>{phoneNumber}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OTP Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 text-2xl tracking-widest text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-wa-teal focus:border-transparent font-mono"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full py-3 bg-wa-teal text-white font-bold rounded-lg hover:bg-wa-dark-teal disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Didn't receive the code?{" "}
          <button className="text-wa-teal font-semibold hover:underline">
            Resend OTP
          </button>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}
