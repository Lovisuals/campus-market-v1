import { SquadCard } from "@/components/nexus/squad/squad-card";
import { MOCK_SQUADS } from "@/lib/nexus/squad-core";

export default function SquadPage() {
    return (
        <div className="min-h-screen bg-black text-white pb-24">
            <div className="max-w-md mx-auto p-4 pt-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight mb-2">Squad Buys 🚀</h1>
                    <p className="text-gray-400 text-sm">Team up to unlock massive discounts. Invite friends to drop the price.</p>
                </header>

                <section>
                    <h2 className="text-xs font-bold text-nexus-primary uppercase tracking-widest mb-4">Your Active Squads</h2>
                    {MOCK_SQUADS.map((deal) => (
                        <SquadCard key={deal.id} deal={deal} />
                    ))}
                </section>

                <section className="mt-8">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Trending Near Campus</h2>
                    <div className="p-6 rounded-2xl border border-dashed border-gray-700 text-center">
                        <span className="text-2xl mb-2 block">🔒</span>
                        <p className="text-gray-400 text-sm">More drops coming in <span className="text-white font-mono">02:14:59</span></p>
                    </div>
                </section>
            </div>
        </div>
    );
}
