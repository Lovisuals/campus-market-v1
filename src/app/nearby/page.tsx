"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";

export default function NearbyPage() {
    const Map = useMemo(() => dynamic(
        () => import('@/components/nexus/map/campus-map'),
        {
            loading: () => (
                <div className="w-full h-[60vh] rounded-3xl bg-white/5 animate-pulse flex items-center justify-center border border-white/10">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 text-nexus-primary animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Loading Campus Map...</p>
                    </div>
                </div>
            ),
            ssr: false
        }
    ), []);

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24">
            <header className="mb-6 mt-4">
                <h1 className="text-3xl font-black tracking-tight mb-2">Nearby</h1>
                <p className="text-gray-400 text-sm">Find markets and students around your campus.</p>
            </header>

            <section>
                <Map />
            </section>

            <div className="mt-8 grid grid-cols-2 gap-4 opacity-50 pointer-events-none grayscale">
                {/* Placeholder for 'Near Me' listings */}
                <div className="h-40 bg-white/5 rounded-2xl border border-white/10"></div>
                <div className="h-40 bg-white/5 rounded-2xl border border-white/10"></div>
            </div>
            <p className="text-center text-xs text-gray-600 mt-4">Location services coming in v1.1</p>
        </div>
    );
}
