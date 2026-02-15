"use client";

import React from "react";
import { Heart, Share2, Sparkles, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StreamCardProps {
    brandName: string;
    offerText: string;
    description: string;
    imageUrl: string;
    logoUrl?: string; // Optional brand logo
    vouchCount: number;
    timeLeft?: string; // e.g., "2h left"
    dominantColor?: string; // Dynamic background support
}

export function StreamCard({
    brandName,
    offerText,
    description,
    imageUrl,
    vouchCount,
    timeLeft,
    dominantColor = "from-nexus-primary",
}: StreamCardProps) {
    return (
        <div className="relative w-full h-[85vh] snap-center shrink-0 rounded-3xl overflow-hidden mx-auto max-w-md my-4 shadow-2xl border border-white/5 bg-gray-900 group">

            {/* Background Image / Placeholder */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={imageUrl}
                    alt={brandName}
                    fill
                    className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
            </div>

            {/* Top Bar: Brand & Timer */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2 neo-glass px-3 py-1.5 rounded-full">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center font-bold text-black text-xs">
                        {brandName[0]}
                    </div>
                    <span className="font-bold text-white text-sm tracking-wide">{brandName}</span>
                    <CheckCircle2 className="w-3 h-3 text-nexus-action" />
                </div>
                {timeLeft && (
                    <div className="bg-nexus-alert text-white text-xs font-black px-3 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                        ⏳ {timeLeft}
                    </div>
                )}
            </div>

            {/* Right Sidebar: Social Actions */}
            <div className="absolute right-4 bottom-32 z-20 flex flex-col gap-6 items-center">
                <div className="flex flex-col items-center gap-1">
                    <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-nexus-alert/20 hover:text-nexus-alert transition-all active:scale-90">
                        <Heart className="w-7 h-7" />
                    </button>
                    <span className="text-xs font-medium text-white shadow-black drop-shadow-md">2.4k</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-nexus-primary/20 hover:text-nexus-primary transition-all active:scale-90">
                        <Share2 className="w-7 h-7" />
                    </button>
                    <span className="text-xs font-medium text-white shadow-black drop-shadow-md">Share</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:text-yellow-400 transition-all active:scale-90">
                        <Sparkles className="w-7 h-7" />
                    </button>
                    <span className="text-xs font-medium text-white shadow-black drop-shadow-md">Vouch</span>
                </div>
            </div>

            {/* Bottom Content: Offer & CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col gap-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
                <h2 className="text-4xl font-black text-white leading-tight font-[ClashDisplay] drop-shadow-lg">
                    {offerText}
                </h2>
                <p className="text-gray-200 text-sm line-clamp-2 leading-relaxed opacity-90">
                    {description}
                </p>

                <div className="mt-2 flex items-center justify-between gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border border-black bg-gray-500" />
                        ))}
                        <div className="pl-3 text-xs text-gray-300 flex items-center">
                            + {vouchCount} verified students
                        </div>
                    </div>
                </div>

                <Button
                    className={cn(
                        "w-full h-14 rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-95 bg-gradient-to-r hover:brightness-110",
                        dominantColor === "from-nexus-primary" ? "from-nexus-primary to-purple-600" : "from-nexus-action to-green-600"
                    )}
                >
                    Claim Offer
                </Button>
            </div>
        </div>
    );
}
