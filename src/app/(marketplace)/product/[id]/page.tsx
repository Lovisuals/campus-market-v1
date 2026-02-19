"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface ListingDetail {
    id: string;
    seller_id: string;
    title: string;
    description: string;
    category: string;
    price: number | null;
    budget: number | null;
    campus: string;
    condition: string;
    images: string[];
    is_request: boolean;
    is_verified: boolean;
    status: string;
    views: number;
    created_at: string;
}

interface Seller {
    id: string;
    full_name: string | null;
    campus: string | null;
    rating: number;
    is_verified: boolean;
}

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createClient();
    const [listing, setListing] = useState<ListingDetail | null>(null);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const id = params.id as string;

                // Fetch listing
                const { data, error: listingError } = await supabase
                    .from("listings")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (listingError || !data) {
                    setError("Product not found");
                    return;
                }

                setListing(data);

                // Fetch seller info
                const { data: sellerData } = await supabase
                    .from("users")
                    .select("id, full_name, campus, rating, is_verified")
                    .eq("id", data.seller_id)
                    .single();

                if (sellerData) setSeller(sellerData);

                // Increment view count
                await supabase
                    .from("listings")
                    .update({ views: (data.views || 0) + 1 })
                    .eq("id", id);

            } catch {
                setError("Failed to load product");
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) fetchProduct();
    }, [params.id, supabase]);

    const handleMessageToBuy = () => {
        if (!listing) return;
        router.push(`/chats?listing_id=${listing.id}&seller_id=${listing.seller_id}&listing_title=${encodeURIComponent(listing.title)}`);
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-white dark:bg-[#111b21] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
            </main>
        );
    }

    if (error || !listing) {
        return (
            <main className="min-h-screen bg-white dark:bg-[#111b21] flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-5xl mb-4">📦</p>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Product Not Found</h2>
                    <p className="text-gray-500 mb-6">{error || "This listing may have been removed."}</p>
                    <button
                        onClick={() => router.push("/market")}
                        className="px-6 py-3 bg-wa-teal text-white font-bold rounded-xl hover:bg-[#006d59] transition-colors"
                    >
                        ← Back to Market
                    </button>
                </div>
            </main>
        );
    }

    const displayPrice = listing.is_request
        ? `Budget: ₦${(listing.budget || listing.price || 0).toLocaleString()}`
        : `₦${(listing.price || 0).toLocaleString()}`;

    const conditionLabel: Record<string, string> = {
        new: "🆕 Brand New",
        "like-new": "✨ Like New",
        good: "👍 Good",
        fair: "🔧 Fair",
    };

    // Build image URLs from storage paths
    const imageUrls = (listing.images || []).map((img: string) => {
        if (img.startsWith("http")) return img;
        const { data } = supabase.storage.from("listing-images").getPublicUrl(img);
        return data.publicUrl;
    });

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-[#111b21] pb-24">
            {/* Back Button */}
            <div className="sticky top-0 z-40 bg-white dark:bg-[#111b21] border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-wa-teal font-bold hover:underline"
                    >
                        ← Back
                    </button>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>👁 {listing.views || 0} views</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Image Gallery */}
                {imageUrls.length > 0 ? (
                    <div className="mb-6">
                        <div className="relative w-full h-72 sm:h-96 bg-gray-200 dark:bg-[#202c33] rounded-2xl overflow-hidden mb-3">
                            <Image
                                src={imageUrls[activeImage]}
                                alt={listing.title}
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                        {imageUrls.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {imageUrls.map((url: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === activeImage
                                                ? "border-wa-teal ring-2 ring-wa-teal/30"
                                                : "border-gray-200 dark:border-gray-700"
                                            }`}
                                    >
                                        <Image src={url} alt={`Image ${idx + 1}`} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-48 bg-gray-100 dark:bg-[#202c33] rounded-2xl flex items-center justify-center mb-6">
                        <span className="text-5xl">📦</span>
                    </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {listing.is_verified && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                            ✅ Verified
                        </span>
                    )}
                    {listing.is_request && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold">
                            📥 Buy Request
                        </span>
                    )}
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                        {listing.category}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-bold">
                        {listing.campus}
                    </span>
                </div>

                {/* Title & Price */}
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
                    {listing.title}
                </h1>
                <p className="text-3xl font-black text-wa-teal mb-4">{displayPrice}</p>

                {/* Condition */}
                <div className="flex items-center gap-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold">Condition:</span>
                    <span>{conditionLabel[listing.condition] || listing.condition}</span>
                </div>

                {/* Description */}
                <div className="bg-white dark:bg-[#202c33] rounded-2xl p-5 mb-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Description</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap leading-relaxed">
                        {listing.description}
                    </p>
                </div>

                {/* Seller Card */}
                {seller && (
                    <div className="bg-white dark:bg-[#202c33] rounded-2xl p-5 mb-6 border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Seller</h3>
                        <button
                            onClick={() => router.push(`/profile?id=${seller.id}`)}
                            className="flex items-center gap-3 w-full text-left hover:bg-gray-50 dark:hover:bg-[#2a3942] rounded-xl p-2 -m-2 transition-colors"
                        >
                            <div className="w-12 h-12 bg-wa-teal rounded-full flex items-center justify-center text-white text-lg font-bold">
                                {seller.full_name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {seller.full_name || "Unknown Seller"}
                                    {seller.is_verified && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">✅ Verified</span>}
                                </p>
                                <p className="text-xs text-gray-500">{seller.campus || "Campus unknown"}</p>
                            </div>
                            <span className="text-gray-400 text-lg">→</span>
                        </button>
                    </div>
                )}

                {/* Posted Date */}
                <p className="text-xs text-gray-400 mb-8 text-center">
                    Posted {new Date(listing.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
                </p>
            </div>

            {/* Fixed Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#111b21] border-t border-gray-200 dark:border-gray-800 px-4 py-4">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <button
                        onClick={() => router.push(`/profile?id=${listing.seller_id}`)}
                        className="px-6 py-3.5 bg-gray-100 dark:bg-[#202c33] text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-[#2a3942] transition-colors"
                    >
                        👤 Profile
                    </button>
                    <button
                        onClick={handleMessageToBuy}
                        className="flex-1 py-3.5 bg-gradient-to-r from-wa-teal to-[#006d59] text-white font-black rounded-2xl hover:shadow-lg hover:shadow-wa-teal/30 transition-all active:scale-[0.98] text-lg"
                    >
                        💬 Message to Buy
                    </button>
                </div>
            </div>
        </main>
    );
}
