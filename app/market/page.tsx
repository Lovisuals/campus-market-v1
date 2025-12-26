import { createClient } from '@/lib/supabase/server';
import MarketGrid from '@/components/MarketGrid';
import CategoryBar from '@/components/CategoryBar';
import SellButton from '@/components/SellButton';
import MarketHeader from '@/components/MarketHeader'; // The new component

export default async function MarketPage() {
  const supabase = await createClient();
  
  // Server-Side Data Fetching (Faster & SEO Friendly)
  const { data: items } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 pb-32 min-h-screen bg-gray-50">
      
      {/* The Header with the Hidden Admin Button */}
      <MarketHeader />

      {/* The Filters */}
      <CategoryBar />

      {/* The Grid */}
      <MarketGrid items={items || []} />

      {/* The Dual-Mode Sell/Buy Modal */}
      <SellButton />
    </main>
  );
}