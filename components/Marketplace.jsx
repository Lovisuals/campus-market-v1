'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// Connect to Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CAMPUSES = [
  { id: 'All', name: 'All Campuses' },
  { id: 'UNILAG', name: 'UNILAG' },
  { id: 'LASU', name: 'LASU' },
  { id: 'YABATECH', name: 'YABATECH' }
];

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', price: '', whatsapp: '', campus: 'UNILAG' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('products').insert([{
        title: form.title,
        price: form.price,
        whatsapp_number: form.whatsapp,
        campus: form.campus,
        // Placeholder image for now to prevent errors
        images: ["https://placehold.co/600x600/008069/white?text=New+Item"]
    }]);

    if (!error) {
        confetti();
        setShowModal(false);
        fetchProducts();
        setForm({ title: '', price: '', whatsapp: '', campus: 'UNILAG' });
    } else {
        alert("Error: " + error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen pb-20">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[var(--surface)] border-b p-4 flex justify-between items-center shadow-sm">
            <h1 className="font-bold text-[var(--wa-teal)]">CAMPUS MARKET</h1>
            <button onClick={() => setShowModal(true)} className="bg-[var(--wa-teal)] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">SELL +</button>
        </header>

        {/* Feed */}
        <main className="p-4 grid grid-cols-2 gap-4">
            {loading ? <p>Loading...</p> : products.map(p => (
                <div key={p.id} className="bg-white rounded-xl overflow-hidden shadow-sm border">
                    <div className="h-32 bg-gray-200">
                        <img src={p.images?.[0]} className="w-full h-full object-cover"/>
                    </div>
                    <div className="p-3">
                        <h3 className="text-xs font-bold truncate">{p.title}</h3>
                        <p className="text-[var(--wa-teal)] font-bold text-sm">₦{p.price}</p>
                        <a href={`https://wa.me/${p.whatsapp_number}`} className="block mt-2 bg-gray-100 text-center py-2 rounded text-[10px] font-bold">CHAT</a>
                    </div>
                </div>
            ))}
        </main>

        {/* Sell Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                <div className="bg-white w-full p-6 rounded-t-3xl animate-slide-up">
                    <h2 className="font-bold text-lg mb-4">Sell Item</h2>
                    <form onSubmit={handlePost} className="space-y-4">
                        <input className="wa-input" placeholder="Title" onChange={e => setForm({...form, title: e.target.value})} />
                        <input className="wa-input" type="number" placeholder="Price" onChange={e => setForm({...form, price: e.target.value})} />
                        <input className="wa-input" placeholder="WhatsApp (234...)" onChange={e => setForm({...form, whatsapp: e.target.value})} />
                        <button disabled={submitting} className="w-full bg-[var(--wa-teal)] text-white py-4 rounded-xl font-bold">
                            {submitting ? "POSTING..." : "POST AD"}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="w-full text-gray-400 text-sm">CANCEL</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}
