import { createClient } from '@/lib/supabase/server';
import MarketGrid from '@/components/MarketGrid';

export default async function MarketPage() {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error("Market Data Error:", error.message);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12 border-b border-gray-100 pb-8">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
          Campus Market P2P
        </h1>
        <p className="text-gray-500 text-lg mt-2">
          Your Hustle. Your Hub. Connect. Trade. Thrive.
        </p>
      </header>
      
      <MarketGrid items={items || []} />
    </main>
  );
}