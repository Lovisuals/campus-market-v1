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
  { id: 'TASUED', name: 'TASUED', lat: 6.7967, lng: 3.9275 },
  { id: 'OOU', name: 'OOU (Ago-Iwoye)', lat: 6.9427, lng: 3.9175 },
  { id: 'UNIPORT', name: 'UNIPORT', lat: 4.9069, lng: 6.9170 },
  { id: 'UNIDEL', name: 'UNIDEL (Agbor)', lat: 6.2536, lng: 6.1978 },
  { id: 'UNIBEN', name: 'UNIBEN', lat: 6.3350, lng: 5.6037 },
  { id: 'UI', name: 'UI (Ibadan)', lat: 7.4443, lng: 3.9008 },
  { id: 'OAU', name: 'OAU (Ife)', lat: 7.5180, lng: 4.5276 },
  { id: 'UNILORIN', name: 'UNILORIN', lat: 8.4799, lng: 4.6763 },
  { id: 'FUTA', name: 'FUTA', lat: 7.3048, lng: 5.1384 },
  { id: 'LASPOTECH', name: 'LASUSTECH', lat: 6.6436, lng: 3.5132 },
  { id: 'MAPOLY', name: 'MAPOLY', lat: 7.1352, lng: 3.3595 },
  { id: 'UNN', name: 'UNN', lat: 6.8643, lng: 7.4082 },
  { id: 'ABU', name: 'ABU Zaria', lat: 11.1517, lng: 7.6492 }
];

// --- UTILITIES ---
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
                const maxWidth = 800; 
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCampus, setActiveCampus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showProModal, setShowProModal] = useState(false); // NEW: Pro Modal State
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [tickerMsg, setTickerMsg] = useState('');
  const [clientIp, setClientIp] = useState('0.0.0.0');
  
  // Form State
  const [form, setForm] = useState({ title: '', price: '', whatsapp: '', campus: 'UNILAG', type: 'Physical' });
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const logoRef = useRef(null);
  const holdTimer = useRef(null);

  useEffect(() => {
    fetchProducts();
    checkTheme();
    fetchForensics();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    }
    checkAdminSession();
    fetchTicker();
  }, []);

  const fetchForensics = async () => {
      try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          setClientIp(data.ip);
      } catch (e) { console.log('Forensics failed'); }
  };

  const checkAdminSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsAdmin(true);
  };

  const fetchTicker = async () => {
      const { data } = await supabase.from('admin_settings').select('value').eq('key', 'global_alert').maybeSingle();
      if(data) setTickerMsg(data.value);
  }

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

  // --- ACTIONS ---
  const handleLogoTouchStart = () => {
      holdTimer.current = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(200);
          setShowLogin(true);
      }, 2000); // Reduced to 2s for better feel
  };
  const handleLogoTouchEnd = () => clearTimeout(holdTimer.current);

  const handleAdminLogin = async (e) => {
      e.preventDefault();
      const { error } = await supabase.auth.signInWithPassword({ 
          email: e.target.email.value, 
          password: e.target.password.value 
      });
      if (!error) {
          setIsAdmin(true);
          setShowLogin(false);
      } else {
          alert("Access Denied");
      }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
        if (!isAdmin) {
            const cleanPhone = form.whatsapp.replace(/\D/g, '');
            const { data: proData } = await supabase.from('verified_sellers').select('limit_per_day').eq('phone', cleanPhone).maybeSingle();
            const dailyLimit = proData ? proData.limit_per_day : 3;
            
            const today = new Date().toLocaleDateString();
            const quota = JSON.parse(localStorage.getItem('post_quota') || '{}');
            
            if (quota.date === today && quota.count >= dailyLimit) {
                alert(`Daily Limit Reached! You have used ${quota.count}/${dailyLimit} posts today.`);
                setSubmitting(false);
                return;
            }
        }

        let finalImageUrls = [];
        if (imageFiles.length > 0) {
            setUploadStatus('Uploading images...');
            for (let i = 0; i < imageFiles.length; i++) {
                const compressedBlob = await compressImage(imageFiles[i]);
                const filename = `item_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`;
                const { error: uploadError } = await supabase.storage.from('item-images').upload(filename, compressedBlob);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(filename);
                finalImageUrls.push(publicUrl);
            }
        } else {
            finalImageUrls.push("https://placehold.co/600x600/008069/white?text=No+Photo");
        }

        setUploadStatus('Publishing...');
        const { error } = await supabase.from('products').insert([{
            title: form.title,
            price: form.price,
            whatsapp_number: form.whatsapp.replace(/\D/g, ''),
            campus: form.campus,
            item_type: form.type,
            images: finalImageUrls,
            is_admin_post: isAdmin,
            ip_address: clientIp,
            user_agent: navigator.userAgent
        }]);

        if (error) throw error;

        const today = new Date().toLocaleDateString();
        const currentQuota = JSON.parse(localStorage.getItem('post_quota') || '{}');
        const newCount = (currentQuota.date === today ? currentQuota.count : 0) + 1;
        localStorage.setItem('post_quota', JSON.stringify({ date: today, count: newCount }));

        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setShowModal(false);
        setForm({ title: '', price: '', whatsapp: '', campus: 'UNILAG', type: 'Physical' });
        setImageFiles([]);
        setPreviewUrls([]);
        fetchProducts();

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        setSubmitting(false);
        setUploadStatus('');
    }
  };

  const handleImageSelect = (e) => {
      const files = Array.from(e.target.files).slice(0, 3);
      if (files.length > 0) {
          setImageFiles(files);
          const urls = files.map(file => URL.createObjectURL(file));
          setPreviewUrls(urls);
      }
  };

  const handleBuyClick = async (product) => {
      window.open(`https://wa.me/${product.whatsapp_number}`, '_blank');
      if(!isAdmin) {
         await supabase.rpc('increment_clicks', { row_id: product.id });
      }
  };

  // --- RENDER ---
  const [searchTerm, setSearchTerm] = useState('');
  
  let displayProducts = products.filter(p => {
      if (activeCampus !== 'All' && p.campus !== activeCampus) return false;
      const term = searchTerm.toLowerCase();
      if (term && !p.title.toLowerCase().includes(term) && !p.campus.toLowerCase().includes(term)) return false;
      return true;
  });

  if (userLoc && activeCampus === 'All') {
      displayProducts.sort((a, b) => {
          const cA = CAMPUSES.find(c => c.id === a.campus) || {};
          const cB = CAMPUSES.find(c => c.id === b.campus) || {};
          return getDistance(userLoc.lat, userLoc.lng, cA.lat, cA.lng) - getDistance(userLoc.lat, userLoc.lng, cB.lat, cB.lng);
      });
  }

  return (
    <div className="min-h-screen pb-32">
        {/* TICKER */}
        <div className="ticker-container">
            <div className="ticker-content">
                <span id="adText" className="text-[var(--wa-neon)] font-black text-[10px] uppercase tracking-widest">{tickerMsg}</span>
            </div>
        </div>

        {/* HEADER - NOW UNSELECTABLE */}
        <header className="sticky top-0 z-50 bg-[var(--wa-chat-bg)] border-b border-[var(--border)] pt-safe noselect">
            <div className="px-5 py-4 flex justify-between items-center">
                <div 
                    ref={logoRef} 
                    onMouseDown={handleLogoTouchStart} 
                    onMouseUp={handleLogoTouchEnd} 
                    onTouchStart={handleLogoTouchStart} 
                    onTouchEnd={handleLogoTouchEnd} 
                    className="cursor-pointer"
                >
                    <h1 className="text-[17px] font-extrabold tracking-tighter text-[var(--wa-teal)]">CAMPUS <span className="opacity-30">MARKETPLACE</span></h1>
                    {isAdmin && <p className="text-[8px] text-yellow-500 font-black uppercase">Sovereign Mode</p>}
                </div>
                <div className="flex gap-3">
                    <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--surface)] shadow-sm tap">
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    {/* PRO BUTTON NOW WORKS */}
                    <button onClick={() => setShowProModal(true)} className="bg-[var(--wa-teal)] text-white px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-lg tap">PRO</button>
                </div>
            </div>
            <div className="px-5 pb-3 flex gap-3 overflow-x-auto scrollbar-hide">
                {CAMPUSES.map(c => (
                    <button key={c.id} onClick={() => setActiveCampus(c.id)} className={`flex-none px-5 py-2 rounded-full text-[10px] font-black border transition tap ${activeCampus === c.id ? 'bg-[var(--wa-teal)] text-white border-transparent' : 'border-gray-200 text-gray-400'}`}>
                        {c.name}
                    </button>
                ))}
            </div>
            <div className="px-5 py-3">
                <div className="search-container">
                    <span className="opacity-20 text-sm mr-3">🔍</span>
                    <input className="flex-1 bg-transparent py-3 text-[13px] font-semibold outline-none wa-input" placeholder="Search (e.g. iPhone)..." onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
        </header>

        {/* FEED */}
        <main id="feed">
            {loading ? <p className="col-span-2 text-center py-10 opacity-40">Loading Market...</p> : displayProducts.map(p => {
                const isSold = (p.click_count || 0) >= 5;
                const campData = CAMPUSES.find(c => c.id === p.campus);
                const dist = userLoc && campData ? getDistance(userLoc.lat, userLoc.lng, campData.lat, campData.lng).toFixed(1) + 'km' : p.campus;

                return (
                    <div key={p.id} className={`product-card ${p.is_admin_post ? 'border-2 border-yellow-500' : ''}`}>
                         <div className="h-40 bg-gray-200 relative">
                            <img src={p.images?.[0] || "https://placehold.co/600x600/008069/white?text=No+Photo"} className="w-full h-full object-cover" />
                            {p.images?.length > 1 && <div className="absolute top-2 right-2 bg-black/50 text-white text-[8px] font-bold px-2 py-1 rounded-full">+{p.images.length-1}</div>}
                            {isSold && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white font-black border-2 px-2 py-1 -rotate-12">SOLD OUT</span></div>}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-[11px] font-extrabold uppercase truncate opacity-70">{p.title}</h3>
                                <p className="font-black text-sm text-[var(--wa-teal)] mt-1">₦{Number(p.price).toLocaleString()}</p>
                                <p className="text-[8px] font-bold text-gray-300 mt-1 uppercase">{dist}</p>
                            </div>
                            <button onClick={() => handleBuyClick(p)} disabled={isSold} className={`mt-3 block w-full text-center py-2.5 rounded-xl text-[10px] font-black uppercase transition tap ${isSold ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[var(--wa-teal)]/10 text-[var(--wa-teal)] hover:bg-[var(--wa-teal)] hover:text-white'}`}>
                                {isSold ? 'Sold Out' : 'Chat Buy'}
                            </button>
                            {isAdmin && <button onClick={async()=>{ if(confirm('Delete?')) { await supabase.from('products').delete().eq('id', p.id); fetchProducts(); } }} className="text-red-500 text-[8px] mt-2 font-black uppercase">Expunge</button>}
                        </div>
                    </div>
                );
            })}
        </main>

        <button onClick={() => setShowModal(true)} className="fixed bottom-8 right-6 fab z-50 tap">+</button>

        {/* SELL MODAL */}
        {showModal && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-end backdrop-blur-sm">
                <div className="glass-3d w-full p-6 rounded-t-[32px] animate-slide-up max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => setShowModal(false)} className="text-2xl opacity-60 tap px-2">← <span className="text-sm font-bold align-middle ml-1">Back</span></button>
                        <h2 className="font-black text-lg uppercase opacity-80">New Listing</h2>
                        <div className="w-8"></div>
                    </div>
                    <form onSubmit={handlePost} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                             <select className="wa-input" value={form.campus} onChange={e => setForm({...form, campus: e.target.value})}>
                                {CAMPUSES.filter(c => c.id !== 'All').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select className="wa-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                <option value="Physical">📦 Physical</option>
                                <option value="Digital">⚡ Digital</option>
                            </select>
                        </div>
                        <input className="wa-input" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                        <input className="wa-input" type="number" placeholder="Price (₦)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center relative tap">
                            <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="absolute inset-0 opacity-0 w-full h-full" />
                            {previewUrls.length > 0 ? (
                                <div className="flex gap-2 justify-center overflow-x-auto">
                                    {previewUrls.map((url, i) => <img key={i} src={url} className="h-16 w-16 rounded-lg object-cover shadow-sm" />)}
                                </div>
                            ) : (
                                <p className="text-[9px] font-black text-gray-400 uppercase">Tap to Snap (Max 3)</p>
                            )}
                        </div>

                        <input className="wa-input" type="tel" placeholder="WhatsApp (234...)" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} required />
                        <button disabled={submitting} className="w-full bg-[var(--wa-teal)] text-white py-4 rounded-2xl font-black shadow-xl text-lg uppercase tracking-widest tap">
                            {uploadStatus || "Launch Ad"}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* NEW: PRO MODAL */}
        {showProModal && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
                <div className="glass-3d w-full max-w-sm p-8 text-center relative">
                    <button onClick={() => setShowProModal(false)} className="absolute top-4 right-4 text-2xl opacity-50 tap">×</button>
                    <div className="text-5xl mb-4">💎</div>
                    <h2 className="text-2xl font-black uppercase text-[var(--wa-teal)] mb-2">Campus Pro</h2>
                    <p className="text-xs font-bold text-gray-400 mb-6">Upgrade your selling power</p>
                    
                    <div className="space-y-4 text-left mb-8">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <span className="text-xl">🚀</span>
                            <div>
                                <div className="font-bold text-sm">15 Posts Daily</div>
                                <div className="text-[10px] opacity-60">Standard limit is 3</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <span className="text-xl">✅</span>
                            <div>
                                <div className="font-bold text-sm">Verified Badge</div>
                                <div className="text-[10px] opacity-60">Build instant trust</div>
                            </div>
                        </div>
                    </div>

                    <a href="https://wa.me/2347068516779?text=I%20want%20to%20upgrade%20to%20Campus%20PRO" target="_blank" className="block w-full bg-[var(--wa-teal)] text-white py-4 rounded-2xl font-black shadow-xl uppercase tap">
                        Message Admin to Join
                    </a>
                </div>
            </div>
        )}

        {/* LOGIN OVERLAY */}
        {showLogin && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                 <div className="glass-3d w-full max-w-sm p-8 border-t-4 border-[var(--wa-teal)]">
                    <h2 className="text-xl font-black uppercase text-center mb-6">Sovereign Entry</h2>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <input name="email" className="wa-input" placeholder="ID" />
                        <input name="password" type="password" className="wa-input" placeholder="Key" />
                        <button className="w-full bg-[var(--wa-teal)] text-white py-3 rounded-xl font-black uppercase tap">Authenticate</button>
                        <button type="button" onClick={() => setShowLogin(false)} className="w-full text-[10px] font-bold text-gray-500 py-2 uppercase tap">Abort</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}
