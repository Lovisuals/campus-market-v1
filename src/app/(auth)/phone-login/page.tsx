"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateAndNormalizePhone } from "@/lib/phone-validator";

export default function PhoneLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
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

      // Find user by phone number
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email")
        .eq("phone", phoneValidation.normalized)
        .single();

      if (userError || !userData) {
        setError("Phone number not found. Please register first.");
        setIsLoading(false);
        return;
      }

      setUserId(userData.id);

      // Generate OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in database
      const { error: otpError } = await supabase
        .from("otp_sessions")
        .insert({
          user_id: userData.id,
          code: otpCode,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          attempts: 0,
          device_hash: await hashString(navigator.userAgent),
          ip_hash: await getIPHash(),
          used: false,
        });

      if (otpError) throw otpError;

      // Send OTP via email (fallback since we don't have SMS)
      await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email, otp: otpCode, phone: phoneValidation.normalized }),
      });

      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!userId) throw new Error("Session expired");

      // Verify OTP
      const { data: otpData, error: otpError } = await supabase
        .from("otp_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("code", otp)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (otpError || !otpData) {
        setError("Invalid or expired OTP");
        setIsLoading(false);
        return;
      }

      // Mark OTP as used
      await supabase
        .from("otp_sessions")
        .update({ used: true, verified_at: new Date().toISOString() })
        .eq("id", otpData.id);

      // Get user email for sign in
      const { data: userData } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (!userData) throw new Error("User not found");

      // Sign in user using email (since Supabase auth uses email)
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: userData.email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (signInError) throw signInError;

      // Redirect to market
      router.push("/market");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-wa-teal to-[#006d59] flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 bg-white rounded-full mb-3 sm:mb-4 shadow-lg">
            <span className="text-4xl">📱</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Phone Login</h1>
          <p className="text-white/80 text-sm">Quick access with your phone number</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 sm:space-y-6">
          {step === 'phone' ? (
            <>
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Enter Your Number</h2>
                <p className="text-gray-600 text-sm">We'll send you a verification code</p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
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
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Enter OTP</h2>
                <p className="text-gray-600 text-sm">Check your email for the code</p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    🔐 Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all text-lg text-center tracking-widest"
                    required
                  />
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
                  {isLoading ? "Verifying..." : "Verify & Login"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full text-wa-teal font-bold text-sm hover:underline"
                >
                  Use different number
                </button>
              </form>
            </>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500 font-semibold">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <Link
            href="/login"
            className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black rounded-2xl transition-colors text-center"
          >
            Login with Email
          </Link>

          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">
              Don't have an account?
            </p>
            <Link
              href="/register"
              className="text-wa-teal font-bold hover:underline"
            >
              Sign Up
            </Link>
          </div>
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

async function getIPHash(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip } = await response.json();
    return await hashString(ip);
  } catch {
    return await hashString('unknown');
  }
}
