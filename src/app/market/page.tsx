"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';  // NEW: Import Link
import { usePathname } from 'next/navigation';  // NEW: For active tab highlighting
// @ts-ignore
import confetti from 'canvas-confetti';
import ProductCard from './ProductCard';
import StoriesRail from './StoriesRail';

export default function MarketPage() {
  const [campuses, setCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [products, setProducts] = useState([]);
  const [stories, setStories] = useState([]);
  const [user, setUser] = useState(null);
  const [supabaseClient] = useState(() => createClient());
  const pathname = usePathname();

  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const [campusData, productData, storyData, { data: userData }] = await Promise.all([
        supabaseClient.from('campuses').select('*').order('id', { ascending: true }),
        supabaseClient.from('products').select('*').order('id', { ascending: true }),
        supabaseClient.from('stories').select('*').order('id', { ascending: true }),
        supabaseClient.auth.getUser(),
      ]);

      if (isMounted.current) {
        setCampuses(campusData.data);
        setProducts(productData.data);
        setStories(storyData.data);
        setUser(userData);
      }
    };

    fetchData();

    const { subscription } = supabaseClient
      .from('campuses')
      .on('INSERT', (payload) => {
        if (isMounted.current) {
          setCampuses((prev) => [...prev, payload.new]);
        }
      })
      .on('UPDATE', (payload) => {
        if (isMounted.current) {
          setCampuses((prev) =>
            prev.map((campus) => (campus.id === payload.new.id ? payload.new : campus))
          );
        }
      })
      .on('DELETE', (payload) => {
        if (isMounted.current) {
          setCampuses((prev) => prev.filter((campus) => campus.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeSubscription(subscription);
    };
  }, [supabaseClient]);

  const handleCampusSelect = (campus) => {
    setSelectedCampus(campus);
    // Optionally, you can also fetch products and stories for the selected campus here
  };

  const handleConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handlers = {
    openGallery: (images, index) => console.log('Open gallery', images, index),
    handleExpungeProduct: (id) => console.log('Expunge product', id),
    handleVerifyProduct: (id, current) => console.log('Verify product', id, current),
    handleFulfillRequest: (item) => console.log('Fulfill request', item),
    handleBuyClick: (item) => console.log('Buy click', item),
  };

  return (
    <div>
      <h1>Marketplace</h1>
      <div>
        {campuses.map((campus) => (
          <div key={campus.id} onClick={() => handleCampusSelect(campus)}>
            {campus.name}
          </div>
        ))}
      </div>
      <div>
        {selectedCampus && (
          <div>
            <h2>Products at {selectedCampus.name}</h2>
            <div>
              {products
                .filter((product) => product.campus_id === selectedCampus.id)
                .map((filteredProduct) => (
                  <ProductCard
                    key={filteredProduct.id}
                    item={filteredProduct}
                    handlers={handlers}
                  />
                ))}
            </div>
            <h2>Stories at {selectedCampus.name}</h2>
            <StoriesRail 
              activeCampus={selectedCampus.name} 
              setActiveCampus={(campus) => setSelectedCampus({ ...selectedCampus, name: campus })} 
            />
          </div>
        )}
      </div>
      <div>
        <Link href="/create-campus">Create Campus</Link>
        <Link href="/create-product">Create Product</Link>
        <Link href="/create-story">Create Story</Link>
      </div>
      <div>
        <button onClick={handleConfetti}>Celebrate!</button>
      </div>
    </div>
  );
}

