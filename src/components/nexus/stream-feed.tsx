import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StreamCard } from "./stream-card";

interface ListingItem {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string;
    campus: string;
    created_at: string;
    is_verified: boolean;
    seller: {
        full_name: string;
        vouch_count: number;
    };
}

export function StreamFeed() {
    const [items, setItems] = useState<ListingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchFeed = async () => {
            setIsLoading(true);

            // Temu-style Feed Algorithm: 
            // 1. Fetch active listings
            // 2. Order by freshness (recent first) but with a salt of randomness
            // Note: randomness in SQL: RANDOM() * log(EXTRACT(EPOCH FROM now() - created_at) + 1)
            // For now, we'll fetch verified/recent and shuffle in JS for maximum randomness

            const { data, error } = await supabase
                .from("listings")
                .select(`
                    id, 
                    title, 
                    description, 
                    price, 
                    image_url, 
                    campus, 
                    created_at, 
                    is_verified,
                    seller:users(full_name, vouch_count)
                `)
                .eq("status", "active")
                .order("created_at", { ascending: false })
                .limit(20);

            if (data) {
                // Shuffle logic for "Freshness + Variety"
                const shuffled = [...(data as any)].sort(() => Math.random() - 0.5);
                setItems(shuffled);
            }
            setIsLoading(false);
        };

        fetchFeed();
    }, [supabase]);

    if (isLoading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-black">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-nexus-primary/20 rounded-full border-4 border-nexus-primary/40 border-t-nexus-primary animate-spin" />
                    <p className="text-white/50 font-black tracking-widest text-xs uppercase">Curating your feed...</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-black px-8 text-center">
                <div className="space-y-4">
                    <span className="text-6xl">🏜️</span>
                    <h2 className="text-2xl font-black text-white">Feed is Empty</h2>
                    <p className="text-gray-400 text-sm">Be the first to post something on your campus!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen snap-y snap-mandatory overflow-y-scroll scrollbar-hide pb-24 pt-4">
            {items.map((item) => (
                <div key={item.id} className="w-full h-[85vh] snap-center flex items-center justify-center p-2 mb-4">
                    <StreamCard
                        brandName={item.seller?.full_name || "Nexus Seller"}
                        offerText={item.title}
                        description={item.description || `Fresh listing from ${item.campus}`}
                        imageUrl={item.image_url || "https://images.unsplash.com/photo-1580910051074-3eb0948865c5?q=80&w=1000"}
                        vouchCount={item.seller?.vouch_count || 0}
                        timeLeft={new Date(item.created_at).toLocaleDateString()}
                        dominantColor={item.is_verified ? "from-nexus-action" : "from-nexus-primary"}
                        price={item.price}
                    />
                </div>
            ))}

            {/* Footer Spacer */}
            <div className="h-32 w-full snap-end" />
        </div>
    );
}
