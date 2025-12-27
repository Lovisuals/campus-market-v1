"use client"; // <--- This is the safety switch

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // Using the Client connection (Safer)
import MarketGrid from '@/components/MarketGrid';
import CategoryBar from '@/components/CategoryBar';
import SellButton from '@/components/SellButton';
import MarketHeader from '@/components/MarketHeader';

export default function MarketPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) setItems(data);
      } catch (err) {
        console.error("Market Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchItems();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 pb-32 min-h-screen bg-gray-50">
      <MarketHeader />
      <CategoryBar />
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wa-teal"></div>
          <p className="text-xs font-bold mt-4">Loading Market...</p>
        </div>
      ) : (
        <MarketGrid items={items} />
      )}

      <SellButton />
    </main>
  );
}