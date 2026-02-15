"use client";

import React from "react";
import { Users, Clock, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SquadDeal, getProgress } from "@/lib/nexus/squad-core";
import { cn } from "@/lib/utils";

interface SquadCardProps {
    deal: SquadDeal;
}

export function SquadCard({ deal }: SquadCardProps) {
    const progress = getProgress(deal);
    const isFull = deal.currentMembers.length >= deal.requiredMembers;

    return (
        <div className="w-full bg-nexus-dark/50 neo-glass border border-white/10 rounded-3xl overflow-hidden shadow-xl mb-6 relative group">
            {/* Header Image */}
            <div className="relative h-40 w-full">
                <Image
                    src={deal.imageUrl}
                    alt={deal.brandName}
                    fill
                    className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-nexus-dark to-transparent" />

                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 border border-white/10">
                    <Users className="w-3 h-3 text-nexus-action" />
                    {deal.currentMembers.length}/{deal.requiredMembers} Joined
                </div>

                <div className="absolute top-4 right-4 bg-nexus-alert/90 px-3 py-1 rounded-full text-xs font-black text-white shadow-lg animate-pulse">
                    -{Math.round((1 - deal.squadPrice / deal.originalPrice) * 100)}%
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="text-xl font-black text-white font-[ClashDisplay]">{deal.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{deal.description}</p>

                {/* Progress Bar */}
                <div className="mt-5">
                    <div className="flex justify-between text-xs font-medium mb-2">
                        <span className="text-gray-300">Unlock Progress</span>
                        <span className={cn("text-nexus-action", isFull && "text-nexus-neon")}>
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                                isFull ? "bg-nexus-action" : "bg-nexus-primary"
                            )}
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>
                </div>

                {/* Avatar Stack & Price */}
                <div className="mt-5 flex items-center justify-between">
                    <div className="flex -space-x-3">
                        {deal.currentMembers.map((member, i) => (
                            <div key={member.id} className="w-8 h-8 rounded-full border-2 border-nexus-dark bg-gray-600 flex items-center justify-center text-[10px] text-white font-bold relative z-10">
                                {member.name[0]}
                            </div>
                        ))}
                        {Array.from({ length: deal.requiredMembers - deal.currentMembers.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-8 h-8 rounded-full border-2 border-nexus-dark bg-white/5 border-dashed border-gray-600 flex items-center justify-center text-[10px] text-gray-500 relative z-0">
                                ?
                            </div>
                        ))}
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-gray-500 line-through">₦{deal.originalPrice}</div>
                        <div className="text-lg font-black text-white">₦{deal.squadPrice}</div>
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    className={cn(
                        "w-full mt-4 h-12 rounded-xl text-base font-bold shadow-lg",
                        isFull
                            ? "bg-nexus-action hover:bg-emerald-400 text-white"
                            : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                    )}
                >
                    {isFull ? "Unlocked! Claim Now" : "Invite Friends (+2)"}
                    {!isFull && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
            </div>
        </div>
    );
}
