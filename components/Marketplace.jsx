'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

// Campuses Configuration
const CAMPUSES = [
  { id: 'All', name: 'All Campuses' },
  { id: 'UNILAG', name: 'UNILAG' },
  { id: 'LASU', name: 'LASU' },
  { id: 'YABATECH', name: 'YABATECH' }
];

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCampus, setActiveCampus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [form, setForm] = useState({ title: '', price: '', whatsapp: '', campus: 'UNILAG' });
  const [submitting, setSubmitting] = useState(false);

  // Initial Load
  useEffect(() => {
    loadProducts();
  }, []);

  // 1. Fetch from Server API
  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (e) {
      console.error("Failed to load", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit to Server API
  const handlePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Failed to post');

      // Success!
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setShowModal(false);
      setForm({ title: '', price: '', whatsapp: '', campus: 'UNILAG' });
      loadProducts(); // Refresh feed
      
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: Filter products
  const filteredProducts = products.filter(p => activeCampus === 'All' || p.campus === activeCampus);

  return (
    <div className="min-h-screen pb-20">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[var(--surface)] border-b p-4 flex justify-between items-center shadow-sm backdrop-blur-md bg-opacity-90">
            <h1 className="font-extrabold text-[var(--wa-teal)] tracking-tight">CAMPUS <span className="opacity-50 font-normal">MARKET</span></h1>
            <button onClick={() => setShowModal(true)} className="bg-[var(--wa-teal)] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition tap">SELL +</button>
        </header>

        {/* Campus Tabs */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide bg-[var(--surface)]">
            {CAMPUSES.map(c => (
                <button 
                    key={c.id} 
                    onClick={() => setActiveCampus(c.id)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold border transition ${activeCampus === c.id ? 'bg-[var(--wa-teal)] text-white border-transparent' : 'border-gray-200 text-gray-500'}`}
                >
                    {c.name}
                </button>
            ))}
        </div>

        {/* Feed */}
        <main className="p-4 grid grid-cols-2 gap-4">
            {loading ? <p className="col-span-2 text-center text-gray-400 py-10">Loading Market...</p> : filteredProducts.map(p => (
                 <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                    <div className="h-32 bg-gray-100 relative">
                        <img src={p.images?.[0]} className="w-full h-full object-cover" />
                        {/* Sold Out Badge (Logic) */}
                        {(p.click_count >= 5) && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white font-black -rotate-12 border-2 px-2 py-1">SOLD</span>
                            </div>
                        )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                            <h3 className="text-[11px] font-bold uppercase truncate text-gray-700">{p.title}</h3>
                            <p className="font-black text-xs text-[var(--wa-teal)] mt-1">₦{Number(p.price).toLocaleString()}</p>
                        </div>
                        <a 
                            href={`https://wa.me/${p.whatsapp_number}`} 
                            target="_blank"
                            className="mt-3 block w-full bg-[var(--wa-teal)]/10 text-[var(--wa-teal)] text-center py-2 rounded-lg text-[9px] font-black uppercase hover:bg-[var(--wa-teal)] hover:text-white transition"
                        >
                            Chat Buy
                        </a>
                    </div>
                 </div>
            ))}
            {filteredProducts.length === 0 && !loading && (
                <div className="col-span-2 text-center py-10 text-gray-400 text-xs">No items in {activeCampus} yet.</div>
            )}
        </main>

        {/* Sell Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-end backdrop-blur-sm">
                <div className="bg-white w-full p-6 rounded-t-3xl shadow-2xl animate-slide-up">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-black text-lg text-gray-800">New Listing</h2>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl font-light">×</button>
                    </div>
                    
                    <form onSubmit={handlePost} className="space-y-4">
                        <select 
                            className="wa-input"
                            value={form.campus}
                            onChange={e => setForm({...form, campus: e.target.value})}
                        >
                            {CAMPUSES.filter(c => c.id !== 'All').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        
                        <input className="wa-input" placeholder="What are you selling?" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                        
                        <input className="wa-input" type="number" placeholder="Price (₦)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                        
                        <input className="wa-input" type="tel" placeholder="WhatsApp (e.g. 23480...)" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} required />
                        
                        <button disabled={submitting} className="w-full bg-[var(--wa-teal)] text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition">
                            {submitting ? "PUBLISHING..." : "LAUNCH AD 🚀"}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}
