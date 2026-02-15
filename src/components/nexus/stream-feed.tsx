"use client";

import React from "react";
import { StreamCard } from "./stream-card";

// Mock Data for Phase 1
const mockStreamItems = [
    {
        id: 1,
        brandName: "Spotify",
        offerText: "3 Months Free Premium",
        description: "Unlock ad-free music, offline listening, and more. Exclusive for verified students. Limited time offer for finals week.",
        imageUrl: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=1000",
        vouchCount: 842,
        timeLeft: "4h left",
        dominantColor: "from-nexus-action"
    },
    {
        id: 2,
        brandName: "Nike",
        offerText: "40% OFF Air Max",
        description: "The flash drop you've been waiting for. Valid on all Air Max models. In-store and online.",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000",
        vouchCount: 1205,
        timeLeft: "20m left",
        dominantColor: "from-nexus-alert"
    },
    {
        id: 3,
        brandName: "Adobe",
        offerText: "Creative Cloud 60% OFF",
        description: "Design your future. Get the entire suite of creative apps including Photoshop and Illustrator.",
        imageUrl: "https://images.unsplash.com/photo-1626785774573-4b7993143d2d?q=80&w=1000",
        vouchCount: 560,
        dominantColor: "from-nexus-primary"
    }
];

export function StreamFeed() {
    return (
        <div className="w-full h-screen snap-y snap-mandatory overflow-y-scroll scrollbar-hide pb-24 pt-4">
            {mockStreamItems.map((item) => (
                <div key={item.id} className="w-full h-[90vh] snap-center flex items-center justify-center p-2">
                    <StreamCard
                        brandName={item.brandName}
                        offerText={item.offerText}
                        description={item.description}
                        imageUrl={item.imageUrl}
                        vouchCount={item.vouchCount}
                        timeLeft={item.timeLeft}
                        dominantColor={item.dominantColor}
                    />
                </div>
            ))}

            {/* Footer Spacer */}
            <div className="h-24 w-full snap-end" />
        </div>
    );
}
