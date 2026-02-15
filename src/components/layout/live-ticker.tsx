"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface SiteAlert {
    id: string;
    message: string;
    color_theme: "teal" | "red" | "gold" | "blue";
    link_url?: string;
}

export default function LiveTicker() {
    const [alert, setAlert] = useState<SiteAlert | null>(null);
    const supabase = createClient();

    useEffect(() => {
        // Initial fetch
        const fetchAlert = async () => {
            const { data, error } = await supabase
                .from("site_alerts")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (!error && data) {
                setAlert(data);
            }
        };

        fetchAlert();

        // Subscribe to changes
        const channel = supabase
            .channel("site_alerts_live")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "site_alerts" },
                (payload) => {
                    if (payload.eventType === "DELETE") {
                        setAlert(null);
                    } else {
                        const newAlert = payload.new as SiteAlert;
                        // Check if it's active
                        if ((payload.new as any).is_active) {
                            setAlert(newAlert);
                        } else {
                            setAlert(null);
                        }
                    }
                    // Re-fetch to be safe on complex changes
                    fetchAlert();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    if (!alert) return null;

    const bgColors = {
        teal: "bg-[#008069]",
        red: "bg-red-600",
        gold: "bg-amber-500",
        blue: "bg-blue-600",
    };

    const content = (
        <div className={`${bgColors[alert.color_theme]} py-2 px-4 text-white overflow-hidden whitespace-nowrap relative`}>
            <div className="flex animate-ticker items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="inline-block px-8 text-sm font-bold uppercase tracking-wider">
                        📢 {alert.message}
                    </span>
                ))}
            </div>
        </div>
    );

    if (alert.link_url) {
        return (
            <a href={alert.link_url} className="block hover:opacity-90 transition-opacity sticky top-0 z-[100] shadow-md">
                {content}
            </a>
        );
    }

    return <div className="sticky top-0 z-[100] shadow-md">{content}</div>;
}
