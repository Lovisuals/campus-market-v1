"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizePhoneNumber } from "@/lib/phone-validator";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1); // 1: Info, 2: Campus
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    campus: "",
  });
  const [phoneFormatted, setPhoneFormatted] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle phone validation in real-time
    if (name === "phone") {
      if (!value.trim()) {
        // Phone is optional, clear errors if empty
        setPhoneError("");
        setPhoneFormatted("");
        setFormData((prev) => ({ ...prev, [name]: value }));
        return;
      }

      const validation = normalizePhoneNumber(value, 'NG');
      
      if (validation.valid) {
        setPhoneError("");
        setPhoneFormatted(validation.formatted);
        setFormData((prev) => ({ ...prev, [name]: validation.normalized }));
      } else {
        setPhoneError(validation.error || "Please enter a valid Nigerian phone number");
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1 && formData.email && formData.full_name) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate phone if provided
      if (formData.phone && phoneError) {
        throw new Error(phoneError);
      }

      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: crypto.randomUUID(), // Generate random password (user won't need it)
        options: {
          data: {
            full_name: formData.full_name,
            campus: formData.campus,
            phone: formData.phone, // Already normalized
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/complete-profile`,
        }
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error("Registration failed - no user created");
      }

      // User record is automatically created by database trigger
      // Just show success message
      router.push(`/login?registered=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
            <span className="text-4xl">🛍️</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Campus Market</h1>
          <p className="text-white/80 text-sm">Join your campus marketplace</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Progress Indicator */}
          <div className="flex gap-2 justify-center mb-6">
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? "bg-wa-teal" : "bg-gray-200"}`}></div>
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? "bg-wa-teal" : "bg-gray-200"}`}></div>
          </div>

          {/* Title */}
          <div className="text-center">
            {step === 1 ? (
              <>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Let's get started!</h2>
                <p className="text-gray-600 text-sm">Tell us about yourself</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Where do you study?</h2>
                <p className="text-gray-600 text-sm">Help us connect you with your campus</p>
              </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    👤 Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all text-lg"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    📧 Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@campus.edu"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all text-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">We'll send a confirmation link</p>
                </div>

                {/* Phone (Optional) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    📱 Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+234 801 234 5678"
                    className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all text-lg ${
                      phoneError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-xs text-red-600 mt-2 font-semibold">⚠️ {phoneError}</p>
                  )}
                  {phoneFormatted && !phoneError && (
                    <p className="text-xs text-green-600 mt-2 font-semibold">✓ {phoneFormatted}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: 08012345678, +2348012345678, +234 801 234 5678
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Campus Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    🏫 Select Your Campus
                  </label>
                  <select
                    name="campus"
                    value={formData.campus}
                    onChange={handleChange}
                    title="Select your campus"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all text-lg"
                    required
                  >
                    <option value="">Choose your campus...</option>
                    {campuses.map((campus) => (
                      <option key={campus} value={campus}>
                        {campus}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                  <p className="text-sm text-blue-700 font-semibold">💡 We use this to show you items from your campus</p>
                </div>
              </>
            )}

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <p className="text-red-700 text-sm font-semibold">❌ {error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || (formData.phone && !!phoneError)}
                className={`flex-1 py-3 bg-gradient-to-r from-wa-teal to-[#006d59] text-white font-black rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg ${
                  step === 1 ? "w-full" : ""
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  step === 1 ? "Next" : "Create Account"
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500 font-semibold">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-3">
              Already have an account?
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-3 bg-gray-100 hover:bg-gray-200 text-wa-teal font-black rounded-2xl transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              🔒 Your information is secure and private
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
