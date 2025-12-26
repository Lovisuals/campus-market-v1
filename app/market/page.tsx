import { createClient } from '@/lib/supabase/server';
import MarketGrid from '@/components/MarketGrid'; // This is the IMPORT

export default async function MarketPage() { // This is the unique FUNCTION name
  const supabase = await createClient();
  const { data: items } = await supabase.from('products').select('*');

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black mb-8">Campus Marketplace</h1>
      {/* This calls the imported component */}
      <MarketGrid items={items || []} />
    </main>
  );
}