"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { normalizePhoneNumber } from "@/lib/phone-validator";

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getIPHash(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    const { ip } = await response.json();
    return await hashString(ip);
  } catch {
    return await hashString('unknown');
  }
}

export default function LoginPage() {
  const supabase = createClient();
  const [identifier, setIdentifier] = useState(""); // Email or Phone
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isRecognized, setIsRecognized] = useState(false);
  const [displayEmail, setDisplayEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setIsLoading(true);
    setError(null);
    setIsRecognized(false);

    try {
      let emailToUse = identifier;
      const isActuallyEmail = identifier.includes("@");

      if (!isActuallyEmail) {
        // Assume it's a phone number
        const phoneValidation = normalizePhoneNumber(identifier, 'NG');
        if (!phoneValidation.valid) {
          throw new Error("Please enter a valid email or Nigerian phone number.");
        }

        // Find user by phone number
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email")
          .eq("phone", phoneValidation.normalized)
          .single();

        if (userError || !userData) {
          throw new Error("Account not found with this phone number. Please register first.");
        }

        emailToUse = userData.email;
        setDisplayEmail(userData.email);

        // Check for device recognition
        const deviceHash = await hashString(navigator.userAgent);
        const ipHash = await getIPHash();

        const { data: deviceData, error: deviceError } = await supabase
          .from("user_devices")
          .select("id")
          .eq("user_id", userData.id)
          .eq("device_hash", deviceHash)
          .eq("ip_hash", ipHash)
          .single();

        if (deviceData && !deviceError) {
          setIsRecognized(true);
        }
      } else {
        setDisplayEmail(identifier);
      }

      // Use Supabase's built-in email OTP
      const { error } = await supabase.auth.signInWithOtp({
        email: emailToUse,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        }
      });

      setOtpSent(true);
      setCooldown(60); // 1 minute cooldown
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests")) {
        setError("Slow down! You've requested too many codes. Please check your email inbox first or wait 60 seconds.");
        setCooldown(60);
      } else {
        setError(msg);
      }
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
            <span className="text-4xl">🛍️</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Campus Market</h1>
          <p className="text-white/80 text-sm">Your campus shopping assistant</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 sm:space-y-6">
          {otpSent ? (
            /* OTP Sent Success */
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <span className="text-3xl">{isRecognized ? "🤝" : "✅"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                {isRecognized ? "Device Recognized!" : "Check your email!"}
              </h2>
              <p className="text-gray-600 text-sm">
                We&apos;ve sent a magic link to <strong>{displayEmail}</strong>
              </p>
              <p className="text-gray-500 text-xs italic">
                {isRecognized
                  ? "Since we know this device, you're almost in. Just click the link in your email."
                  : "Click the link in your email to sign in. The link will expire in 1 hour."}
              </p>
              <button
                onClick={() => {
                  setOtpSent(false);
                  setIdentifier("");
                  setIsRecognized(false);
                }}
                className="text-wa-teal font-bold text-sm hover:underline"
              >
                Use different account
              </button>
            </div>
          ) : (
            <>
              {/* Title */}
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Welcome back</h2>
                <p className="text-gray-600 text-sm">Sign in with phone or email</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    📱 Phone or 📧 Email
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="080123... or you@campus.edu"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all text-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Enter your number for the fastest experience</p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                    <p className="text-red-700 text-sm font-semibold">❌ {error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || cooldown > 0}
                  className="w-full py-3 bg-gradient-to-r from-wa-teal to-[#006d59] text-white font-black rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : cooldown > 0 ? (
                    `Wait ${cooldown}s`
                  ) : (
                    "Send Magic Link"
                  )}
                </button>
              </form>
            </>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500 font-semibold">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-3">
              Don&apos;t have an account?
            </p>
            <Link
              href="/register"
              className="inline-block w-full py-3 bg-gray-100 hover:bg-gray-200 text-wa-teal font-black rounded-2xl transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              🔒 Your phone number is secure and encrypted
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-8">
          <p className="text-white/70 text-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </main>
  );
}
