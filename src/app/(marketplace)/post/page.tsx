"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function PostListingPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    campus: "",
    condition: "like-new",
    isRequest: false,
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationReason, setVerificationReason] = useState("");

  const categories = ["Books", "Electronics", "Clothing", "Furniture", "Services", "Other"];
  const campuses = ["UNILAG", "LASU", "YABATECH", "TASUED", "OOU", "UI", "OAU", "UNN"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const MAX_IMAGES = 3;
    const validFiles: File[] = [];

    // Prevent exceeding the maximum allowed images
    if (images.length + newFiles.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed per listing`);
      return;
    }

    for (const file of newFiles) {
      if (file.size > maxSize) {
        setError(`${file.name} is too large (max 5MB)`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setImages((prev) => [...prev, ...validFiles]);

      // Create previews
      const newPreviews = await Promise.all(
        validFiles.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate images count before proceeding
      if (images.length === 0) {
        throw new Error("At least 1 image is required");
      }
      if (images.length > 3) {
        throw new Error("Maximum 3 images allowed");
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user?.id) {
        throw new Error("Not authenticated");
      }

      // Check if current user is admin to auto-verify
      const { data: userRow } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", sessionData.session.user.id)
        .single();
      const isAdminUser = !!userRow?.is_admin;

      let imageUrls: string[] = [];
      let imagePaths: string[] = [];

      // Upload images to Supabase Storage
      if (images.length > 0) {
        setIsUploading(true);
        const bucket = "listing-images";
        const userId = sessionData.session.user.id;
        const timestamp = Date.now();
        
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const filename = `${userId}/${timestamp}-${i}-${file.name}`;

          const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filename, file, { cacheControl: "3600", upsert: false });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
          imageUrls.push(urlData.publicUrl);
          imagePaths.push(data.path);
        }
        setIsUploading(false);
      }

      // Send data to server API which will validate and insert the listing
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.isRequest ? null : parseFloat(formData.price),
        campus: formData.campus,
        condition: formData.condition,
        isRequest: formData.isRequest,
        images: imagePaths,
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to create listing");
      }

      setShowVerificationForm(true); // Show verification form after listing creation
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
      setIsUploading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationRequest = async () => {
    try {
      if (!verificationReason.trim()) {
        setError("Please explain why you should be verified");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const { data: userData } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", sessionData.session?.user?.id)
        .single();

      const { error: verifyError } = await supabase
        .from("verification_requests")
        .insert([
          {
            seller_id: sessionData.session?.user?.id,
            seller_name: userData?.full_name || "Unknown",
            seller_email: userData?.email || "",
            reason: verificationReason,
            status: "pending",
          },
        ]);

      if (verifyError) throw verifyError;

      router.push("/market");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request verification");
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#111b21] pb-20">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-4 sm:mb-6">
          {formData.isRequest ? "📥 What are you looking for?" : "📤 What are you selling?"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isRequest"
                checked={formData.isRequest}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                This is a buy request
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., iPhone 13 Pro Max 256GB"
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              required
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📸 Images (up to 5MB each)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-3 border-2 border-dashed border-wa-teal rounded-lg hover:bg-blue-50 dark:hover:bg-[#202c33] text-wa-teal font-semibold transition-colors disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Click to upload or drag & drop"}
            </button>

            {/* Image Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">{previews.length} image(s) selected</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the item in detail..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                title="Select item category"
                className="w-full px-3 sm:px-4 py-3 sm:py-3.5 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal text-base"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {formData.isRequest ? "Budget" : "Price"}
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="₦0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campus
              </label>
              <select
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                title="Select your campus"
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
                required
              >
                <option value="">Select campus</option>
                {campuses.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                title="Select item condition"
                className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a3942] rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-wa-teal text-white font-bold rounded-lg hover:bg-wa-dark-teal disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Publishing..." : "Publish Listing"}
          </button>
        </form>
      </div>

      {/* Verification Request Modal */}
      {showVerificationForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202c33] rounded-2xl p-8 max-w-md w-full space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                ✅ Request Verification
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your listing is published! Would you like to request a seller verification badge?
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Why should you be verified?
              </label>
              <textarea
                value={verificationReason}
                onChange={(e) => setVerificationReason(e.target.value)}
                placeholder="Tell us about your credibility, experience, or why you should be verified..."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-[#2a3942] rounded-lg dark:bg-[#111b21] text-gray-900 dark:text-white focus:ring-2 focus:ring-wa-teal"
                rows={4}
                title="Enter reason for verification request"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/market")}
                className="flex-1 py-3 bg-gray-200 dark:bg-[#3a4a52] text-gray-900 dark:text-white font-bold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Skip For Now
              </button>
              <button
                onClick={handleVerificationRequest}
                disabled={isLoading}
                className="flex-1 py-3 bg-wa-teal text-white font-bold rounded-lg hover:bg-[#075e54] disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Sending..." : "Request Verification"}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              🔍 Admins review all verification requests within 24 hours
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
