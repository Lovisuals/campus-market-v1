'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// --- CONFIGURATION ---
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

// --- UTILITIES (Ported from Sentinel) ---
const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lat2) return 0;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const compressImage = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxWidth = 800; // Resize to 800px width
                const scale = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
            };
        };
    });
};

export default function Marketplace() {
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCampus, setActiveCampus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  
  // Form State
  const [form, setForm] = useState({ title: '', price: '', whatsapp: '', campus: 'UNILAG', type: 'Physical' });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Stealth Trigger Refs
  const logoRef = useRef(null);
  const holdTimer = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    fetchProducts();
    checkTheme();
    
    // Geo-Location for Algorithm
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    }

    // Check Sovereign Session
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsAdmin(true);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const checkTheme = () => {
      const isDark = localStorage.getItem('sentinel_theme') === 'dark';
      setDarkMode(isDark);
      if (isDark) document.body.classList.add('dark-mode');
  };

  const toggleTheme = () => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      document.body.classList.toggle('dark-mode', newMode);
      localStorage.setItem('sentinel_theme', newMode ? 'dark' : 'light');
  };

  // --- STEALTH LOGIC ---
  const handleLogoTouchStart = () => {
      holdTimer.current = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(200);
          setShowLogin(true);
      }, 3000); // 3 seconds hold
  };
  const handleLogoTouchEnd = () => clearTimeout(holdTimer.current);

  const handleAdminLogin = async (e) => {
      e.preventDefault();
      const email = e.target.email.value;
      const password = e.target.password.value;
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
          alert("Access Denied: " + error.message);
      } else {
          setIsAdmin(true);
          setShowLogin(false);
          alert("Sovereign Access Granted");
      }
  };

  // --- POSTING LOGIC (With Compression & Quota) ---
  const handlePost = async (e) => {
    e.preventDefault();
    
    // 1. Quota Check (Sentinel Feature)
    const today = new Date().toLocaleDateString();
    const quota = JSON.parse(localStorage.getItem('quota') || '{}');
    if (!isAdmin && quota.date === today && quota.count >= 3) {
        alert("Daily Quota Reached (3 Posts). Wait until tomorrow or go PRO.");
        return;
    }

    setSubmitting(true);
    
    try {
        let finalImageUrl = "https://placehold.co/600x600/008069/white?text=No+Photo";
        
        // 2. Image Compression & Upload
        if (imageFile) {
            const compressedBlob = await compressImage(imageFile);
            const filename = `sovereign_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            
            const { error: uploadError } = await supabase.storage
                .from('item-images')
                .upload(filename, compressedBlob);
            
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('item-images')
                .getPublicUrl(filename);
            finalImageUrl = publicUrl;
        }

        // 3. Database Insert
        const { error } = await supabase.from('products').insert([{
            title: form.title,
            price: form.price,
            whatsapp_number: form.whatsapp.replace(/\D/g, ''),
            campus: form.campus,
            item_type: form.type,
            images: [finalImageUrl],
            is_admin_post: isAdmin
        }]);

        if (error) throw error;

        // 4. Update Quota
        localStorage.setItem('quota', JSON.stringify({ date: today, count: (quota.count || 0) + 1 }));

        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setShowModal(false);
        setForm({ title: '', price: '', whatsapp: '', campus: 'UNILAG', type: 'Physical' });
        setImageFile(null);
        setPreviewUrl(null);
        fetchProducts();

    } catch (err) {
        alert("Sentinel Error: " + err.message);
    } finally {
        setSubmitting(false);
    }
  };

  // --- RENDERING ---
  // Sort Logic: If user location exists, sort by distance. If not, date.
  let displayProducts = products.filter(p => activeCampus === 'All' || p.campus === activeCampus);
  
  if (userLoc && activeCampus === 'All') {
      displayProducts.sort((a, b) => {
          const cA = CAMPUSES.find(c => c.id === a.campus) || {};
          const cB = CAMPUSES.find(c => c.id === b.campus) || {};
          const distA = getDistance(userLoc.lat, userLoc.lng, cA.lat, cA.lng);
          const distB = getDistance(userLoc.lat, userLoc.lng, cB.lat, cB.lng);
          return distA - distB;
      });
  }

  return (
    <div className="min-h-screen pb-24 transition-colors duration-300">
        
        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-[var(--card-bg)] shadow-sm border-b border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center transition-colors">
            <div 
                ref={logoRef}
                onMouseDown={handleLogoTouchStart}
                onMouseUp={handleLogoTouchEnd}
                onTouchStart={handleLogoTouchStart}
                onTouchEnd={handleLogoTouchEnd}
                className="select-none cursor-pointer"
            >
                <h1 className="font-extrabold text-[var(--wa-teal)] text-lg tracking-tighter">
                    CAMPUS <span className="opacity-40">MARKET</span>
                </h1>
                {isAdmin && <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest">Sovereign Access</span>}
            </div>
            
            <div className="flex gap-3">
                <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg tap">
                    {darkMode ? '☀️' : '🌙'}
                </button>
                <button onClick={() => setShowModal(true)} className="bg-[var(--wa-teal)] text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg tap">
                    SELL +
                </button>
            </div>
        </header>

        {/* CAMPUS TABS */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide bg-[var(--surface)]">
            {CAMPUSES.map(c => (
                <button 
                    key={c.id} 
                    onClick={() => setActiveCampus(c.id)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold border transition ${activeCampus === c.id ? 'bg-[var(--wa-teal)] text-white border-transparent' : 'border-gray-300 dark:border-gray-700 text-gray-500'}`}
                >
                    {c.name}
                </button>
            ))}
        </div>

        {/* FEED */}
        <main className="p-4 grid grid-cols-2 gap-4">
            {loading ? <p className="col-span-2 text-center opacity-50 py-10">Syncing...</p> : displayProducts.map(p => {
                const isSold = (p.click_count || 0) >= 5;
                const campData = CAMPUSES.find(c => c.id === p.campus);
                const dist = userLoc && campData ? getDistance(userLoc.lat, userLoc.lng, campData.lat, campData.lng).toFixed(1) + 'km' : p.campus;

                return (
                    <div key={p.id} className={`bg-[var(--card-bg)] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col ${p.is_admin_post ? 'border-2 border-yellow-500' : ''}`}>
                        <div className="h-36 bg-gray-200 relative">
                            <img src={p.images?.[0]} className="w-full h-full object-cover" />
                            {p.item_type === 'Digital' && <span className="absolute top-2 right-2 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded">DIGITAL</span>}
                            {isSold && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-black border-2 px-2 -rotate-12">SOLD OUT</span></div>}
                        </div>
                        <div className="p-3">
                            <h3 className="text-[11px] font-bold uppercase truncate opacity-80">{p.title}</h3>
                            <p className="font-black text-sm text-[var(--wa-teal)] mt-1">₦{Number(p.price).toLocaleString()}</p>
                            <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">{dist}</p>
                            
                            <a href={`https://wa.me/${p.whatsapp_number}`} target="_blank" className="mt-3 block w-full bg-[var(--wa-teal)]/10 text-[var(--wa-teal)] hover:bg-[var(--wa-teal)] hover:text-white text-center py-2 rounded-lg text-[9px] font-black uppercase transition">
                                Chat Buy
                            </a>
                            
                            {isAdmin && (
                                <button onClick={async () => {
                                    if(confirm('Expunge listing?')) {
                                        await supabase.from('products').delete().eq('id', p.id);
                                        fetchProducts();
                                    }
                                }} className="w-full mt-2 text-red-500 text-[9px] font-bold uppercase">Expunge</button>
                            )}
                        </div>
                    </div>
                );
            })}
        </main>

        {/* SELL MODAL */}
        {showModal && (
            <div className="fixed inset-0 bg-black/80 z-[100] flex items-end backdrop-blur-sm">
                <div className="bg-[var(--card-bg)] w-full p-6 rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-black text-lg uppercase opacity-80">New Listing</h2>
                        <button onClick={() => setShowModal(false)} className="text-2xl opacity-50">×</button>
                    </div>
                    
                    <form onSubmit={handlePost} className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                             <select className="wa-input" value={form.campus} onChange={e => setForm({...form, campus: e.target.value})}>
                                {CAMPUSES.filter(c => c.id !== 'All').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select className="wa-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                <option value="Physical">📦 Physical</option>
                                <option value="Digital">⚡ Digital</option>
                            </select>
                        </div>

                        <input className="wa-input" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                        <input className="wa-input" type="number" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />

                        {/* Image Picker */}
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 text-center relative">
                            <input type="file" accept="image/*" onChange={(e) => {
                                if(e.target.files[0]) {
                                    setImageFile(e.target.files[0]);
                                    setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                                }
                            }} className="absolute inset-0 opacity-0 w-full h-full" />
                            {previewUrl ? <img src={previewUrl} className="h-24 mx-auto rounded-lg" /> : <p className="text-xs font-bold text-gray-400">TAP TO ADD PHOTO</p>}
                        </div>

                        <input className="wa-input" type="tel" placeholder="WhatsApp" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} required />
                        
                        <button disabled={submitting} className="w-full bg-[var(--wa-teal)] text-white py-4 rounded-xl font-black shadow-lg">
                            {submitting ? "PROCESSING..." : "LAUNCH AD 🚀"}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* STEALTH ADMIN LOGIN */}
        {showLogin && (
            <div className="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-6">
                <div className="w-full max-w-sm bg-white dark:bg-gray-900 p-8 rounded-2xl border-t-4 border-[var(--wa-teal)]">
                    <h2 className="text-xl font-black uppercase text-center mb-6 text-[var(--wa-teal)]">Sovereign Entry</h2>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <input name="email" className="wa-input" placeholder="Admin Email" />
                        <input name="password" type="password" className="wa-input" placeholder="Passkey" />
                        <button className="w-full bg-[var(--wa-teal)] text-white py-3 rounded-xl font-black">AUTHENTICATE</button>
                        <button type="button" onClick={() => setShowLogin(false)} className="w-full text-xs font-bold text-gray-500 py-2">CANCEL</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}
