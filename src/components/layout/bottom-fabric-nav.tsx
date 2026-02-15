"use client";

import React, { useState } from "react";
import { Home, MapPin, Sparkles, Wallet, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    { id: "stream", label: "For You", icon: Home, href: "/" },
    { id: "nearby", label: "Nearby", icon: MapPin, href: "/nearby" },
    { id: "concierge", label: "Concierge", icon: Sparkles, href: "/concierge", isFab: true },
    { id: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
    { id: "squad", label: "Squad", icon: Users, href: "/squad" },
];

export function BottomFabricNav() {
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState("stream");

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50">
            <div className="neo-glass-heavy rounded-2xl p-2 flex items-center justify-between shadow-2xl backdrop-blur-xl bg-black/40 border border-white/10">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    if (item.isFab) {
                        return (
                            <Link key={item.id} href={item.href} className="relative -top-6">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-nexus-primary to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-4 ring-black transform transition-all active:scale-95 hover:scale-105">
                                    <Sparkles className="w-7 h-7 text-white animate-pulse" />
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setActiveTab(item.id)}
                            className="flex-1 flex flex-col items-center justify-center py-2"
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
    );
}
