"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizePhoneNumber, getOperator } from "@/lib/phone-validator";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1); // 1: Info, 2: Campus
  const [formData, setFormData] = useState({
    phone_number: "",
    full_name: "",
    email: "",
    campus: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneFormatted, setPhoneFormatted] = useState<string>("");
  const [phoneOperator, setPhoneOperator] = useState<string>("");

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
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate phone number in real-time
    if (name === "phone_number") {
      if (value.length > 5) {
        const validation = normalizePhoneNumber(value, "NG");
        if (validation.valid) {
          setPhoneError(null);
          setPhoneFormatted(validation.formatted);
          const operator = getOperator(value);
          if (operator) {
            setPhoneOperator(operator);
          }
        } else {
          setPhoneError(validation.error || "Invalid phone number");
          setPhoneFormatted("");
          setPhoneOperator("");
        }
      } else {
        setPhoneError(null);
        setPhoneFormatted("");
        setPhoneOperator("");
      }
    }
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before proceeding
    const phoneValidation = normalizePhoneNumber(formData.phone_number, "NG");
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || "Invalid phone number");
      return;
    }

    if (step === 1 && formData.phone_number && formData.full_name) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate phone number
      const phoneValidation = normalizePhoneNumber(formData.phone_number, "NG");
      if (!phoneValidation.valid) {
        setPhoneError(phoneValidation.error || "Invalid phone number");
        setIsLoading(false);
        return;
      }

      const normalizedPhone = phoneValidation.normalized;

      // Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      });

      if (otpError) throw otpError;

      // Store registration data in session with normalized phone
      sessionStorage.setItem("registrationData", JSON.stringify({
        ...formData,
        phone_number: normalizedPhone,
      }));

      // Redirect to verify page
      router.push(`/verify?phone=${encodeURIComponent(normalizedPhone)}&register=true`);
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

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    📱 Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="+234 801 234 5678"
                    className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all text-lg ${
                      phoneError
                        ? "border-red-500 focus:ring-red-500"
                        : formData.phone_number && !phoneError
                        ? "border-green-500 focus:ring-green-500"
                        : "border-gray-200 focus:ring-wa-teal"
                    }`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">We'll send you a verification code</p>
                  {phoneFormatted && !phoneError && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700">✓ {phoneFormatted}</p>
                      {phoneOperator && (
                        <p className="text-xs text-green-600 mt-1">Operator: {phoneOperator}</p>
                      )}
                    </div>
                  )}
                  {phoneError && (
                    <p className="text-xs text-red-600 mt-2">❌ {phoneError}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    📧 Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all text-lg"
                  />
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
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black rounded-2xl transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-3 bg-gradient-to-r from-wa-teal to-[#006d59] text-white font-black rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 text-lg ${
                  step === 1 ? "w-full" : ""
                }`}
              >
                {isLoading ? "Processing..." : step === 1 ? "Next" : "Create Account"}
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
