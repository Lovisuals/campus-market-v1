import { createClient } from '@/lib/supabase/server';
import MarketGrid from '@/components/MarketGrid'; 
// REMOVE the { } brackets here if you used "export default" in hero.tsx
import Hero from "@/components/hero"; 

export default async function Index() {
  const supabase = await createClient();
  const { data: items } = await supabase.from('products').select('*').limit(8);

  return (
    <>
      <Hero />
      <main className="flex-1 flex flex-col gap-12 max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold">Featured on Campus</h2>
        <MarketGrid items={items || []} />
      </main>
    </>
  );
}