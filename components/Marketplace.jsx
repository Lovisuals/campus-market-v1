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
  { id: 'UNILAG', name: 'UNILAG', lat: 6.5157, lng: 3.3899 },
  { id: 'LASU', name: 'LASU', lat: 6.4698, lng: 3.1977 },
  { id: 'YABATECH', name: 'YABATECH', lat: 6.5188, lng: 3.3725 },
  { id: 'UNIBEN', name: 'UNIBEN', lat: 6.3350, lng: 5.6037 }
];

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCampus, setActiveCampus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  
  // Advanced State
  const [userLocation, setUserLocation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [form, setForm] = useState({ title: '', price: '', whatsapp: '', campus: 'UNILAG' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    // OPTIONAL: Ask for user location for "Algorithmic Sorting"
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    }
  }, []);

  // THE ALGORITHM: Sort by "Freshness" first, then (if location exists) by Distance
  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  // IMAGE UPLOAD LOGIC
  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file) => {
    const filename = `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { data, error } = await supabase.storage
        .from('item-images')
        .upload(filename, file);
        
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filename);
        
    return publicUrl;
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
        let finalImageUrl = "https://placehold.co/600x600/008069/white?text=No+Photo";
        
        // 1. Upload Image if exists
        if (imageFile) {
            setUploading(true);
            finalImageUrl = await uploadImage(imageFile);
            setUploading(false);
        }

        // 2. Post to API (The "Black Box")
        // We use the direct client here for simplicity in V1, 
        // but normally we'd use /api/products for extra security.
        const { error } = await supabase.from('products').insert([{
            title: form.title,
            price: form.price,
            whatsapp_number: form.whatsapp.replace(/\D/g, ''),
            campus: form.campus,
            images: [finalImageUrl],
            item_type: 'Physical'
        }]);

        if (error) throw error;

        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setShowModal(false);
        fetchProducts();
        setForm({ title: '', price: '', whatsapp: '', campus: 'UNILAG' });
        setImageFile(null);
        setPreviewUrl(null);
        
    } catch (err) {
        alert("System Error: " + err.message);
    } finally {
        setSubmitting(false);
    }
  };

  // Helper: Sort products by distance if user has location
  let displayProducts = products.filter(p => activeCampus === 'All' || p.campus === activeCampus);
  
  // Add "Sold Out" Logic (Algorithm)
  // If click_count >= 5, moves to bottom or dims
  
  return (
    <div className="min-h-screen pb-20 bg-[var(--surface)]">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[var(--surface)]/95 backdrop-blur-md border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
            <div>
                <h1 className="font-extrabold text-[var(--wa-teal)] text-lg tracking-tight">CAMPUS MARKET</h1>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Secure • Fast • Local</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-[var(--wa-teal)] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-105 transition">SELL ITEM</button>
        </header>

        {/* Campus Filter */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {CAMPUSES.map(c => (
                <button 
                    key={c.id} 
                    onClick={() => setActiveCampus(c.id)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold border transition ${activeCampus === c.id ? 'bg-[var(--wa-teal)] text-white border-transparent' : 'border-gray-300 text-gray-500 bg-white'}`}
                >
                    {c.name}
                </button>
            ))}
        </div>

        {/* Feed */}
        <main className="p-4 grid grid-cols-2 gap-4">
            {loading ? <p className="col-span-2 text-center text-gray-400 py-10">Syncing Market Data...</p> : displayProducts.map(p => {
                const isSold = (p.click_count || 0) >= 5;
                return (
                    <div key={p.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col ${isSold ? 'opacity-60 grayscale' : ''}`}>
                        <div className="h-36 bg-gray-100 relative">
                            <img src={p.images?.[0]} className="w-full h-full object-cover" loading="lazy" />
                            {isSold && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 -rotate-12 border-2 border-white">SOLD OUT</span>
                                </div>
                            )}
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-[11px] font-bold uppercase truncate text-gray-700">{p.title}</h3>
                                <p className="font-black text-sm text-[var(--wa-teal)] mt-1">₦{Number(p.price).toLocaleString()}</p>
                            </div>
                            <a 
                                href={isSold ? '#' : `https://wa.me/${p.whatsapp_number}`}
                                onClick={() => {
                                    if(!isSold) {
                                        // Update click count (Simple Algo)
                                        supabase.from('products').update({ click_count: (p.click_count||0)+1 }).eq('id', p.id).then(()=>{});
                                    }
                                }}
                                target="_blank"
                                className={`mt-3 block w-full text-center py-2 rounded-lg text-[9px] font-black uppercase transition ${isSold ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[var(--wa-teal)]/10 text-[var(--wa-teal)] hover:bg-[var(--wa-teal)] hover:text-white'}`}
                            >
                                {isSold ? 'Sold' : 'Chat Buy'}
                            </a>
                        </div>
                    </div>
                );
            })}
            
            {displayProducts.length === 0 && !loading && (
                <div className="col-span-2 text-center py-20 opacity-50">
                    <div className="text-4xl mb-2">📦</div>
                    <p className="text-xs font-bold">No items found here yet.</p>
                </div>
            )}
        </main>

        {/* Sell Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-end backdrop-blur-sm">
                <div className="bg-white w-full p-6 rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-black text-lg text-gray-800">New Listing</h2>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl font-light hover:text-red-500">×</button>
                    </div>
                    
                    <form onSubmit={handlePost} className="space-y-5">
                        <select 
                            className="wa-input bg-gray-50"
                            value={form.campus}
                            onChange={e => setForm({...form, campus: e.target.value})}
                        >
                            {CAMPUSES.filter(c => c.id !== 'All').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        
                        <input className="wa-input bg-gray-50" placeholder="What are you selling?" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                        
                        <input className="wa-input bg-gray-50" type="number" placeholder="Price (₦)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                        
                        {/* Image Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center relative bg-gray-50">
                            <input type="file" accept="image/*" onChange={handleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                            {previewUrl ? (
                                <img src={previewUrl} className="mx-auto h-32 rounded-lg object-contain" />
                            ) : (
                                <div className="text-gray-400">
                                    <span className="text-2xl block mb-1">📷</span>
                                    <span className="text-[10px] font-bold uppercase">Tap to add photo</span>
                                </div>
                            )}
                        </div>

                        <input className="wa-input bg-gray-50" type="tel" placeholder="WhatsApp Number (e.g. 23480...)" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} required />
                        
                        <button disabled={submitting || uploading} className="w-full bg-[var(--wa-teal)] text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition">
                            {uploading ? "UPLOADING PHOTO..." : submitting ? "PUBLISHING..." : "LAUNCH AD 🚀"}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}
