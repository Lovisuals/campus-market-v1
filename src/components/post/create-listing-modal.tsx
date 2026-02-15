"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Camera, DollarSign, Tag, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { createListing } from "@/app/actions/listings";

interface CreateListingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function CreateListingModal({ isOpen, onClose }: CreateListingModalProps) {
    const { toast } = useToast();
    const [images, setImages] = useState<File[]>([]);
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [listingType, setListingType] = useState<'sell' | 'buy'>('sell');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            if (file.size > MAX_FILE_SIZE) {
                alert(`File ${file.name} is too large. Max 2MB.`);
                return false;
            }
            return true;
        });
        setImages(prev => [...prev, ...validFiles].slice(0, 3)); // Max 3 images
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission
        setIsSubmitting(true);

        if (!title || !price) {
            toast({ title: "Missing Fields", description: "Please fill in title and price.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        try {
            // 1. Create Listing via Server Action
            // TODO: Implement real image upload and pass URLs. For now passing empty.
            const result = await createListing({
                title,
                description,
                price,
                category: "General", // Default for now
                listingType,
                isAnonymous,
                images: [] // Placeholder
            });

            if (result.error || !result.listing) {
                throw new Error(result.error || "Failed to create listing");
            }

            // 2. Handle Payment for Anonymous Posts
            if (isAnonymous) {
                toast({ title: "Redirecting...", description: "Initiating Paystack Secure Payment..." });

                const payRes = await fetch('/api/payments/initialize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: "user@example.com", // Should be user's email
                        amount: 500, // ₦500
                        purpose: 'anonymous_post_fee',
                        listing_id: result.listing.id // Link Payment to Listing
                    })
                });

                const payData = await payRes.json();

                if (payData.authorization_url) {
                    window.location.href = payData.authorization_url;
                    return; // Stop execution, redirecting
                } else {
                    throw new Error("Payment init failed");
                }
            }

            // 3. Success (Standard Post)
            onClose();
            toast({
                title: "Posted Successfully!",
                description: "Your listing is now live.",
                className: "bg-green-600 text-white border-none"
            });

        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-nexus-dark border border-white/10 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-black text-white mb-1">Create Listing</h2>
                <p className="text-gray-400 text-sm mb-6">Reach thousands of students instantly.</p>

                {/* Type Toggle */}
                <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setListingType('sell')}
                        className={cn(
                            "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                            listingType === 'sell' ? "bg-nexus-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
                        )}
                    >
                        I want to SELL
                    </button>
                    <button
                        onClick={() => setListingType('buy')}
                        className={cn(
                            "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                            listingType === 'buy' ? "bg-pink-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                        )}
                    >
                        I want to BUY
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Image Upload (Only for Sell) */}
                    {listingType === 'sell' && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-nexus-primary transition-colors bg-white/5 gap-2"
                        >
                            <div className="w-12 h-12 rounded-full bg-nexus-primary/20 flex items-center justify-center">
                                <Camera className="w-6 h-6 text-nexus-primary" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-white">
                                    {images.length > 0 ? `${images.length} images selected` : "Tap to upload photos"}
                                </p>
                                <p className="text-xs text-gray-500">Max 2MB per file (Supabase Free Tier)</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                accept="image/png, image/jpeg, image/webp"
                            />
                        </div>
                    )}

                    {/* Fields */}
                    <div className="space-y-3">
                        <div className="relative">
                            <Type className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder={listingType === 'sell' ? "What are you selling?" : "What do you need?"}
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-nexus-primary outline-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input
                                    type="number"
                                    placeholder={listingType === 'sell' ? "Price" : "Budget"}
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-nexus-primary outline-none"
                                />
                            </div>
                            <div className="relative flex-1">
                                <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <select className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-nexus-primary outline-none appearance-none">
                                    <option>Tech</option>
                                    <option>Fashion</option>
                                    <option>Books</option>
                                    <option>Services</option>
                                </select>
                            </div>
                        </div>

                        <textarea
                            placeholder="Describe condition, details, or meetup preference..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-nexus-primary outline-none h-24 resize-none"
                        />

                        {/* Anonymity Toggle */}
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isAnonymous ? "bg-nexus-neon" : "bg-gray-700")}>
                                    <span className="text-base">🕵️</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Post Anonymously</p>
                                    <p className="text-[10px] text-gray-400">Hide your profile from other students (Paid Feature)</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAnonymous(!isAnonymous)}
                                className={cn("w-12 h-6 rounded-full transition-colors relative", isAnonymous ? "bg-nexus-neon" : "bg-gray-600")}
                            >
                                <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", isAnonymous ? "left-7" : "left-1")} />
                            </button>
                        </div>
                    </div>

                    <Button className={cn("w-full text-white font-bold h-12 rounded-xl", listingType === 'sell' ? "bg-nexus-primary hover:bg-indigo-500" : "bg-pink-600 hover:bg-pink-500")}>
                        {listingType === 'sell' ? "Post Listing" : "Post Request"}
                    </Button>

                </form>
            </div>
        </div>
    );
}
