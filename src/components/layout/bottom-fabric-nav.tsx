"use client";

import React, { useState } from "react";
import { Home, MapPin, Sparkles, Wallet, Users, Plus, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreateListingModal } from "@/components/post/create-listing-modal";
import { GuestGateModal } from "@/components/auth/guest-gate-modal";

const navItems = [
    { id: "stream", label: "For You", icon: Home, href: "/" },
    { id: "discovery", label: "Campus Map", icon: MapPin, href: "/nearby" },
    { id: "post", label: "Sell", icon: Plus, href: "#", isFab: true }, // Centered FAB
    { id: "messages", label: "Chat", icon: MessageCircle, href: "/chats" },
    { id: "group_buy", label: "Group Buy", icon: Users, href: "/squad" },
];

export function BottomFabricNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [showListingModal, setShowListingModal] = useState(false);
    const [showGuestGate, setShowGuestGate] = useState(false);
    const [gateFeature, setGateFeature] = useState("");

    const isGuest = true;

    // Intent Restoration
    React.useEffect(() => {
        const pending = sessionStorage.getItem('nexus_pending_intent');
        if (pending && !isGuest) {
            const data = JSON.parse(pending);
            // If it was recently saved (e.g. within 30 mins)
            if (Date.now() - data.timestamp < 30 * 60 * 1000) {
                if (data.feature === "Posting") setShowListingModal(true);
                // More features can be handled here
            }
            sessionStorage.removeItem('nexus_pending_intent');
        }
    }, [isGuest]);

    const handleProtectedAction = (feature: string, action: () => void) => {
        if (isGuest) {
            // Ghost State Recovery: Save intent before gating
            sessionStorage.setItem('nexus_pending_intent', JSON.stringify({
                feature,
                timestamp: Date.now()
            }));

            setGateFeature(feature);
            setShowGuestGate(true);
        } else {
            action();
        }
    };

    return (
        <>
            <div className="fixed bottom-6 left-4 right-4 z-50">
                <div className="neo-glass-heavy rounded-2xl p-2 flex items-center justify-between shadow-2xl backdrop-blur-xl bg-black/40 border border-white/10">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;

                        if (item.isFab) {
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleProtectedAction("Posting", () => setShowListingModal(true))}
                                    className="flex-1 flex flex-col items-center justify-center py-2"
                                >
                                    <div className="h-12 w-12 rounded-full bg-nexus-primary flex items-center justify-center shadow-lg transform transition-all active:scale-95 hover:scale-105">
                                        <Plus className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-[10px] font-medium mt-1 text-gray-400">Sell</span>
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={(e) => {
                                    if (item.id === "messages" || item.id === "squad") {
                                        e.preventDefault();
                                        handleProtectedAction(item.label, () => router.push(item.href));
                                    }
                                }} className="flex-1 flex flex-col items-center justify-center py-2"
                            >
                                <div
                                    className={cn(
                                        "p-2 rounded-xl transition-all duration-300",
                                        isActive
                                            ? "bg-white/10 text-nexus-primary"
                                            : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "w-6 h-6 transition-all",
                                            isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" : ""
                                        )}
                                    />
                                </div>
                                <span
                                    className={cn(
                                        "text-[10px] font-medium mt-1 transition-all",
                                        isActive ? "text-white opacity-100" : "opacity-0 h-0 overflow-hidden"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <CreateListingModal isOpen={showListingModal} onClose={() => setShowListingModal(false)} />
            <GuestGateModal isOpen={showGuestGate} onClose={() => setShowGuestGate(false)} featureName={gateFeature} />
        </>
    );
}
