'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

// ==========================================
// 1. THE CRASH REPORTER (DEBUGGER)
// ==========================================
// This watches your app. If it crashes, it tells you WHY.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("🚨 CRITICAL SYSTEM FAILURE:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 min-h-screen font-mono">
          <h1 className="text-2xl font-black mb-4">⚠️ SYSTEM ALERT: RENDER FAILURE</h1>
          <div className="bg-white p-6 rounded-xl border border-red-200 shadow-lg overflow-auto">
            <p className="font-bold text-red-600 mb-2">{this.state.error && this.state.error.toString()}</p>
            <pre className="text-xs opacity-70 whitespace-pre-wrap">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white px-6 py-3 rounded-xl font-bold">REBOOT SYSTEM</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 2. CONFIGURATION & HELPERS
// ==========================================
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

// ==========================================
// 3. THE VISUAL COMPONENT (Internal)
// ==========================================
// We define this INSIDE the file to prevent import errors.
const ProductCard = ({ item, viewMode, isAdmin, userLoc, campuses, handlers }) => {
    const isSold = (item.click_count || 0) >= 5;
    const campData = campuses.find(c => c.id === item.campus);
    const dist = userLoc && campData ? getDistance(userLoc.lat, userLoc.lng, campData.lat, campData.lng).toFixed(1) + 'km' : item.campus;
    
    const scrollRef = useRef(null);
    
    useEffect(() => {
        if (!item.images || item.images.length <= 1) return;
        const interval = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    scrollRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
                }
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [item.images]);

    if (viewMode === 'market') {
        return (
            <div className={`relative bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300 ${item.is_admin_post ? 'ring-2 ring-yellow-400' : ''}`}>
                <div className="aspect-square bg-white dark:bg-gray-800 relative overflow-hidden group">
                    <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full">
                         {item.images && item.images.length > 0 ? item.images.map((img, idx) => (
                            <img key={idx} src={img} onClick={() => handlers.openLightbox(item, idx)} className="w-full h-full object-cover flex-shrink-0 snap-center cursor-pointer" alt={item.title} />
                        )) : <img src="https://placehold.co/400x400/008069/white?text=No+Photo" className="w-full h-full object-cover" alt="Placeholder" />}
                    </div>
                    {item.images?.length > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                            {item.images.map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-white/80 shadow-sm backdrop-blur-sm"></div>)}
                        </div>
                    )}
                    {isSold && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20"><span className="text-white font-black border-2 px-1 py-0.5 text-[8px] -rotate-12">SOLD</span></div>}
                    {item.is_verified && <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-20"><span>🛡️</span></div>}
                </div>
                <div className="p-2.5">
                    <div className="h-8 mb-1">
                        <h3 className="text-[10px] font-bold leading-tight line-clamp-2 text-gray-900 dark:text-gray-200">{item.title}</h3>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                         <p className="font-black text-xs text-[var(--wa-teal)]">₦{Number(item.price).toLocaleString()}</p>
                         <span className="text-[8px] font-bold text-gray-400">{dist}</span>
                    </div>
                    <button onClick={() => handlers.handleBuyClick(item)} disabled={isSold} className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-wide transition tap ${isSold ? 'bg-gray-100 text-gray-400' : 'bg-[var(--wa-teal)]/10 text-[var(--wa-teal)] hover:bg-[var(--wa-teal)] hover:text-white'}`}>
                        {isSold ? 'Sold' : 'Chat'}
                    </button>
                    {isAdmin && (
                        <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={() => handlers.handleExpungeProduct(item.id)} className="bg-red-50 text-red-500 py-1 rounded text-[8px] font-bold">DEL</button>
                            <button onClick={() => handlers.handleVerifyProduct(item.id, item.is_verified)} className={`py-1 rounded text-[8px] font-bold ${item.is_verified ? 'bg-gray-100' : 'bg-yellow-50 text-yellow-600'}`}>{item.is_verified ? 'UN-V' : 'VER'}</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return (
        <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-[#8E44AD] transition-colors duration-300">
            <div className="p-3 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="bg-[#8E44AD]/10 text-[#8E44AD] text-[7px] font-black px-1.5 py-0.5 rounded uppercase">WANTED</span>
                        <span className="text-[8px] font-bold text-gray-400">{dist}</span>
                    </div>
                    <h3 className="text-[10px] font-bold leading-tight mb-2 line-clamp-2 text-gray-900 dark:text-gray-200">{item.title}</h3>
                    {item.image_url && (
                        <img src={item.image_url} onClick={() => handlers.openLightbox(item, 0)} className="w-8 h-8 rounded-md object-cover mb-2 border border-gray-100 dark:border-gray-700 cursor-pointer" alt="Request" />
                    )}
                    <p className="font-black text-xs text-gray-700 dark:text-gray-300">₦{Number(item.budget).toLocaleString()}</p>
                    {item.is_verified && <div className="absolute top-1 right-1"><span className="text-sm">🛡️</span></div>}
                </div>
                <div className="mt-3">
                    <button onClick={() => handlers.handleFulfillRequest(item)} className="w-full bg-[#8E44AD] text-white py-2 rounded-lg text-[9px] font-black uppercase shadow-sm tap">I Have This</button>
                    {isAdmin && (
                        <div className="grid grid-cols-2 gap-1 mt-2">
                            <button onClick={() => handlers.handleExpungeRequest(item.id)} className="text-red-500 text-[8px] font-bold">DEL</button>
                            <button onClick={() => handlers.handleVerifyRequest(item.id, item.is_verified)} className="text-yellow-600 text-[8px] font-bold">VER</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. MAIN LOGIC (The Brain)
// ==========================================
function MarketplaceLogic() {
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]); 
  const [viewMode, setViewMode] = useState('market'); 
  const [lightboxData, setLightboxData] = useState(null); 
  
  const [loading, setLoading] = useState(true);
  const [activeCampus, setActiveCampus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [tickerMsg, setTickerMsg] = useState('');
  const [broadcasts, setBroadcasts] = useState([]);
  const [clientIp, setClientIp] = useState('0.0.0.0');
  const [systemReport, setSystemReport] = useState(null);

  const [postType, setPostType] = useState('sell'); 
  const [form, setForm] = useState({ title: '', price: '', whatsapp: '', campus: 'UNILAG', type: 'Physical' });
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const logoRef = useRef(null);
  const holdTimer = useRef(null);
  const galleryRef = useRef(null); 

  useEffect(() => {
    fetchProducts();
    fetchRequests();
    fetchBroadcasts();

    // STRICT DARK MODE CHECK
    const savedTheme = localStorage.getItem('sentinel_theme');
    if (savedTheme === 'dark') {
        setDarkMode(true);
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark'); 
    } else {
        setDarkMode(false);
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('sentinel_theme', 'light');
    }

    fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => setClientIp(data.ip)).catch(() => {});
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    }

    checkAdminSession();

    const channel = supabase.channel('realtime_feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if(payload.eventType === 'INSERT') setProducts(prev => [payload.new, ...prev]);
        else if (payload.eventType === 'DELETE') setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        else if (payload.eventType === 'UPDATE') setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
        if(payload.eventType === 'INSERT') setRequests(prev => [payload.new, ...prev]);
        else if (payload.eventType === 'DELETE') setRequests(prev => prev.filter(r => r.id !== payload.old.id));
        else if (payload.eventType === 'UPDATE') setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => {
        fetchBroadcasts();
    })
    .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, []);

  useEffect(() => {
      if (lightboxData && galleryRef.current && lightboxData.startIndex > 0) {
          galleryRef.current.scrollLeft = window.innerWidth * lightboxData.startIndex;
      }
  }, [lightboxData]);

  const checkAdminSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsAdmin(true);
  };

  const fetchBroadcasts = async () => {
      const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
      if(data) {
          setBroadcasts(data);
          const activeMsgs = data.filter(b => b.is_active).map(b => b.message).join(' • ');
          setTickerMsg(activeMsgs || "CAMPUS MARKETPLACE");
      }
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const fetchRequests = async () => {
    const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
    if (data) setRequests(data);
  };

  const toggleTheme = () => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      if(newMode) {
          document.body.classList.add('dark-mode');
          document.documentElement.classList.add('dark'); 
          localStorage.setItem('sentinel_theme', 'dark');
      } else {
          document.body.classList.remove('dark-mode');
          document.documentElement.classList.remove('dark'); 
          localStorage.setItem('sentinel_theme', 'light');
      }
  };

  const handleBuyClick = async (product) => {
      window.open(`https://wa.me/${product.whatsapp_number}`, '_blank');
      if(!isAdmin) await supabase.rpc('increment_clicks', { row_id: product.id });
  };
  const handleFulfillRequest = (req) => {
      const text = `Hi, I saw your request on CampusMarket for "${req.title}". I have it available.`;
      window.open(`https://wa.me/${req.whatsapp_number}?text=${encodeURIComponent(text)}`, '_blank');
  };
  const handleExpungeProduct = async (id) => {
      if(!confirm("DELETE ITEM?")) return;
      await supabase.from('products').delete().eq('id', id);
  };
  const handleVerifyProduct = async (id, currentStatus) => {
      const { error } = await supabase.from('products').update({ is_verified: !currentStatus }).eq('id', id);
      if(error) alert("Update Failed: " + error.message);
  };
  const handleExpungeRequest = async (id) => {
      if(!confirm("DELETE REQUEST?")) return;
      await supabase.from('requests').delete().eq('id', id);
  };
  const handleVerifyRequest = async (id, currentStatus) => {
      const { error } = await supabase.from('requests').update({ is_verified: !currentStatus }).eq('id', id);
      if(error) alert("Update Failed: " + error.message);
  }

  const openLightbox = (item, index) => {
      const imgs = item.images || (item.image_url ? [item.image_url] : []);
      if (imgs.length > 0) {
          setLightboxData({ images: imgs, startIndex: index });
      }
  };

  const handleLogoTouchStart = () => {
      holdTimer.current = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(200);
          setShowLogin(true);
      }, 2000);
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
          setShowAdminPanel(true);
      } else {
          alert("Access Denied");
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setShowAdminPanel(false);
      window.location.reload();
  };

  const runSystemCleanup = async () => {
      const { data, error } = await supabase.rpc('run_quant_cleanup');
      if(error) {
          alert("Cleanup Failed: " + error.message);
      } else {
          setSystemReport(data);
          fetchProducts();
          fetchRequests();
      }
  }

  const handleAddBroadcast = async (e) => {
      e.preventDefault();
      const msg = e.target.message.value;
      if(!msg) return;
      await supabase.from('broadcasts').insert([{ message: msg, is_active: true }]);
      e.target.reset();
  };
  const toggleBroadcast = async (id, currentStatus) => {
      await supabase.from('broadcasts').update({ is_active: !currentStatus }).eq('id', id);
  };
  const deleteBroadcast = async (id) => {
      if(!confirm("Delete?")) return;
      await supabase.from('broadcasts').delete().eq('id', id);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const sanitizePhone = (input) => {
        let clean = input.replace(/\D/g, ''); 
        if (clean.startsWith('2340')) clean = '234' + clean.substring(4);
        if (clean.length === 11 && clean.startsWith('0')) clean = '234' + clean.substring(1);
        if (clean.length === 10 && (clean.startsWith('8') || clean.startsWith('7') || clean.startsWith('9'))) clean = '234' + clean;
        if (clean.length !== 13 || !clean.startsWith('234')) throw new Error(`Invalid Phone Number. Use format: 08012345678`);
        return clean;
    };
    try {
        let finalPhone;
        try {
            finalPhone = sanitizePhone(form.whatsapp);
        } catch (phoneErr) {
            alert(phoneErr.message); 
            setSubmitting(false); 
            return; 
        }
        const { data: banned } = await supabase.from('blacklist').select('ip_address').eq('ip_address', clientIp).maybeSingle();
        if(banned) { alert("Connection Refused."); setSubmitting(false); return; }
        if (!isAdmin) {
            const { data: proData } = await supabase.from('verified_sellers').select('limit_per_day').eq('phone', finalPhone).maybeSingle();
            const dailyLimit = proData ? proData.limit_per_day : 3;
            const today = new Date().toLocaleDateString();
            const quota = JSON.parse(localStorage.getItem('post_quota') || '{}');
            if (quota.date === today && quota.count >= dailyLimit) {
                alert(`Daily Limit Reached!`); setSubmitting(false); return;
            }
        }
        let finalImageUrls = [];
        if (imageFiles.length > 0) {
            setUploadStatus('Uploading...');
            for (let i = 0; i < imageFiles.length; i++) {
                const compressedBlob = await compressImage(imageFiles[i]);
                const filename = `${postType}_${Date.now()}_${i}`;
                const { error: uploadError } = await supabase.storage.from('item-images').upload(filename, compressedBlob);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(filename);
                    finalImageUrls.push(publicUrl);
                }
            }
        }
        setUploadStatus('Publishing...');
        if (postType === 'sell') {
            const { error } = await supabase.from('products').insert([{
                title: form.title,
                price: form.price,
                whatsapp_number: finalPhone, 
                campus: form.campus,
                item_type: form.type,
                images: finalImageUrls.length > 0 ? finalImageUrls : ["https://placehold.co/600x600/008069/white?text=No+Photo"],
                is_admin_post: isAdmin,
                ip_address: clientIp,
                user_agent: navigator.userAgent,
                is_verified: false
            }]);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('requests').insert([{
                title: form.title,
                budget: form.price, 
                whatsapp_number: finalPhone, 
                campus: form.campus,
                image_url: finalImageUrls[0] || null, 
                ip_address: clientIp,
                is_verified: false
            }]);
            if (error) throw error;
        }
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
        fetchRequests();
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
          setPreviewUrls(files.map(file => URL.createObjectURL(file)));
      }
  };

  const itemHandlers = {
      handleBuyClick,
      handleFulfillRequest,
      handleExpungeProduct,
      handleVerifyProduct,
      handleExpungeRequest,
      handleVerifyRequest,
      openLightbox 
  };

  const filterList = (list) => {
      return list.filter(item => {
          if (activeCampus !== 'All' && item.campus !== activeCampus) return false;
          const term = searchTerm.toLowerCase();
          if (term && !item.title.toLowerCase().includes(term) && !item.campus.toLowerCase().includes(term)) return false;
          return true;
      });
  };

  let displayItems = viewMode === 'market' ? filterList(products) : filterList(requests);
  if (userLoc && activeCampus === 'All') {
      displayItems.sort((a, b) => {
          const cA = CAMPUSES.find(c => c.id === a.campus) || {};
          const cB = CAMPUSES.find(c => c.id === b.campus) || {};
          return getDistance(userLoc.lat, userLoc.lng, cA.lat, cA.lng) - getDistance(userLoc.lat, userLoc.lng, cB.lat, cB.lng);
      });
  }

  return (
    <div className="min-h-screen pb-32 transition-colors duration-300 dark:bg-black">
        <div className="ticker-container">
            <div className="ticker-content">
                <span id="adText" className="text-[var(--wa-neon)] font-black text-[10px] uppercase tracking-widest">{tickerMsg}</span>
            </div>
        </div>

        <header className="sticky top-0 z-50 bg-[var(--wa-chat-bg)] dark:bg-black/90 border-b border-[var(--border)] pt-safe noselect shadow-sm backdrop-blur-md">
            <div className="px-5 py-4 flex justify-between items-center">
                <div ref={logoRef} onMouseDown={handleLogoTouchStart} onMouseUp={handleLogoTouchEnd} onTouchStart={handleLogoTouchStart} onTouchEnd={handleLogoTouchEnd} className="cursor-pointer">
                    <h1 className="text-[17px] font-extrabold tracking-tighter text-[var(--wa-teal)]">CAMPUS <span className="opacity-30">MARKETPLACE</span></h1>
                    {isAdmin && <span className="text-[8px] text-yellow-500 font-black uppercase bg-yellow-100 px-1 rounded ml-1">Sovereign Active</span>}
                </div>
                <div className="flex gap-3">
                    <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--surface)] dark:bg-gray-800 shadow-sm tap">
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    {isAdmin ? (
                        <button onClick={() => setShowAdminPanel(true)} className="bg-black dark:bg-white dark:text-black text-white px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-lg tap">COMMAND</button>
                    ) : (
                        <button onClick={() => setShowProModal(true)} className="bg-[var(--wa-teal)] text-white px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-lg tap">PRO</button>
                    )}
                </div>
            </div>
            <div className="px-5 pb-2 flex gap-2">
                <button onClick={() => setViewMode('market')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition tap ${viewMode === 'market' ? 'bg-[var(--wa-teal)] text-white shadow-lg' : 'bg-[var(--surface)] dark:bg-gray-800 text-gray-400'}`}>Items For Sale</button>
                <button onClick={() => setViewMode('requests')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition tap ${viewMode === 'requests' ? 'bg-[#8E44AD] text-white shadow-lg' : 'bg-[var(--surface)] dark:bg-gray-800 text-gray-400'}`}>Request Board</button>
            </div>
             <div className="px-5 pb-3 flex gap-3 overflow-x-auto scrollbar-hide pt-2">
                {CAMPUSES.map(c => (
                    <button key={c.id} onClick={() => setActiveCampus(c.id)} className={`flex-none px-5 py-2 rounded-full text-[10px] font-black border transition tap ${activeCampus === c.id ? 'bg-[var(--wa-teal)] text-white border-transparent' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                        {c.name}
                    </button>
                ))}
            </div>
            <div className="px-5 py-3">
                <div className="search-container dark:bg-gray-800">
                    <span className="opacity-20 text-sm mr-3">🔍</span>
                    <input className="flex-1 bg-transparent py-3 text-[13px] font-semibold outline-none wa-input dark:text-white" placeholder={viewMode === 'market' ? "Search items..." : "Search requests..."} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
        </header>

        <main id="feed" className="grid grid-cols-2 gap-3 px-4 pb-20">
            {loading ? <p className="col-span-2 text-center py-10 opacity-40">Loading...</p> : 
             displayItems.length === 0 ? <p className="col-span-2 text-center py-10 opacity-40 text-sm font-bold">No items found here yet.</p> :
             displayItems.map(item => (
                 <ProductCard key={item.id} item={item} viewMode={viewMode} isAdmin={isAdmin} userLoc={userLoc} campuses={CAMPUSES} handlers={itemHandlers} />
            ))}
        </main>

        <button onClick={() => setShowModal(true)} className="fixed bottom-8 right-6 fab z-50 tap">+</button>

        {showModal && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-end backdrop-blur-sm">
                <div className="glass-3d w-full p-6 rounded-t-[32px] animate-slide-up max-h-[85vh] overflow-y-auto dark:bg-gray-900">
                    <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                        <button onClick={() => setPostType('sell')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition ${postType === 'sell' ? 'bg-white dark:bg-gray-700 text-[var(--wa-teal)] shadow-sm' : 'text-gray-400'}`}>I want to Sell</button>
                        <button onClick={() => setPostType('request')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition ${postType === 'request' ? 'bg-white dark:bg-gray-700 text-[#8E44AD] shadow-sm' : 'text-gray-400'}`}>I want to Buy</button>
                    </div>
                    <form onSubmit={handlePost} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                             <select className="wa-input dark:bg-gray-800 dark:text-white" value={form.campus} onChange={e => setForm({...form, campus: e.target.value})}>
                                {CAMPUSES.filter(c => c.id !== 'All').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {postType === 'sell' && (
                                <select className="wa-input dark:bg-gray-800 dark:text-white" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                    <option value="Physical">📦 Physical</option>
                                    <option value="Digital">⚡ Digital</option>
                                </select>
                            )}
                        </div>
                        <input className="wa-input dark:bg-gray-800 dark:text-white" placeholder={postType === 'sell' ? "What are you selling?" : "What do you need?"} value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                        <input className="wa-input dark:bg-gray-800 dark:text-white" type="number" placeholder={postType === 'sell' ? "Price (₦)" : "Your Budget (₦)"} value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center relative tap">
                            <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="absolute inset-0 opacity-0 w-full h-full" />
                            {previewUrls.length > 0 ? (
                                <div className="flex gap-2 justify-center overflow-x-auto">
                                    {previewUrls.map((url, i) => <img key={i} src={url} className="h-16 w-16 rounded-lg object-cover shadow-sm" />)}
                                </div>
                            ) : (
                                <p className="text-[9px] font-black text-gray-400 uppercase">{postType === 'sell' ? "Tap to Snap (Max 3)" : "Optional Reference Photo"}</p>
                            )}
                        </div>
                        <input className="wa-input dark:bg-gray-800 dark:text-white" type="tel" placeholder="WhatsApp (234...)" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} required />
                        <button disabled={submitting} className={`w-full text-white py-4 rounded-2xl font-black shadow-xl text-lg uppercase tracking-widest tap ${postType === 'sell' ? 'bg-[var(--wa-teal)]' : 'bg-[#8E44AD]'}`}>
                            {uploadStatus || (postType === 'sell' ? "Launch Ad" : "Post Request")}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="w-full py-3 text-xs font-bold text-gray-400">CANCEL</button>
                    </form>
                </div>
            </div>
        )}

        {showAdminPanel && (
            <div className="fixed inset-0 z-[200] bg-white dark:bg-black overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black uppercase text-[var(--wa-teal)]">Command Center</h2>
                        <button onClick={() => setShowAdminPanel(false)} className="text-xs font-bold opacity-50 bg-gray-100 px-3 py-1 rounded-lg">CLOSE</button>
                    </div>
                    <div className="space-y-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-900">
                             <h3 className="text-xs font-black uppercase text-blue-500 mb-2">SYSTEM QUANT STATUS</h3>
                             {systemReport ? (
                                 <div className="text-[10px] font-mono text-blue-800 dark:text-blue-300">
                                     <p>STATUS: {systemReport.status}</p>
                                     <p>PRODUCTS PURGED: {systemReport.products_purged}</p>
                                     <p>REQUESTS PURGED: {systemReport.requests_purged}</p>
                                 </div>
                             ) : (
                                 <button onClick={runSystemCleanup} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase w-full">RUN SYSTEM CLEANUP</button>
                             )}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-3xl">
                            <h3 className="text-xs font-black uppercase text-gray-400 mb-4">📢 Active Broadcasts</h3>
                            <div className="space-y-3 mb-4">
                                {broadcasts.map(b => (
                                    <div key={b.id} className="flex items-center justify-between bg-white dark:bg-black p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                                        <span className={`text-xs font-bold ${!b.is_active && 'opacity-30 line-through'}`}>{b.message}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleBroadcast(b.id, b.is_active)} className="text-xl tap dark:text-white">{b.is_active ? '👁️' : '🚫'}</button>
                                            <button onClick={() => deleteBroadcast(b.id)} className="text-xl opacity-30 hover:opacity-100 tap dark:text-white">🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleAddBroadcast} className="flex gap-2">
                                <input name="message" className="wa-input dark:bg-gray-800 dark:text-white" placeholder="New Alert..." required />
                                <button className="bg-black dark:bg-white dark:text-black text-white px-4 rounded-xl font-bold text-xs">ADD</button>
                            </form>
                        </div>
                        <button onClick={handleLogout} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase">End Sovereign Session</button>
                    </div>
                </div>
            </div>
        )}
        
        {showProModal && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
                <div className="glass-3d w-full max-w-sm p-8 text-center relative dark:bg-gray-900">
                    <button onClick={() => setShowProModal(false)} className="absolute top-4 right-4 text-2xl opacity-50 tap dark:text-white">×</button>
                    <div className="text-5xl mb-4">💎</div>
                    <h2 className="text-2xl font-black uppercase text-[var(--wa-teal)] mb-2">Campus Pro</h2>
                    <p className="text-xs font-bold text-gray-400 mb-6">Upgrade your selling power</p>
                    <a href="https://wa.me/2347068516779?text=I%20want%20to%20upgrade%20to%20Campus%20PRO" target="_blank" className="block w-full bg-[var(--wa-teal)] text-white py-4 rounded-2xl font-black shadow-xl uppercase tap">Message Admin to Join</a>
                </div>
            </div>
        )}

        {showLogin && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                 <div className="glass-3d w-full max-w-sm p-8 border-t-4 border-[var(--wa-teal)] dark:bg-gray-900">
                    <h2 className="text-xl font-black uppercase text-center mb-6 dark:text-white">Sovereign Entry</h2>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <input name="email" className="wa-input dark:bg-gray-800 dark:text-white" placeholder="ID" />
                        <input name="password" type="password" className="wa-input dark:bg-gray-800 dark:text-white" placeholder="Key" />
                        <button className="w-full bg-[var(--wa-teal)] text-white py-3 rounded-xl font-black uppercase tap">Authenticate</button>
                        <button type="button" onClick={() => setShowLogin(false)} className="w-full text-[10px] font-bold text-gray-500 py-2 uppercase tap">Abort</button>
                    </form>
                </div>
            </div>
        )}

        {lightboxData && (
            <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-fade-in">
                <button onClick={() => setLightboxData(null)} className="absolute top-5 right-5 text-white text-3xl font-bold bg-white/10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md z-50 tap shadow-lg">×</button>
                <div ref={galleryRef} className="flex overflow-x-auto snap-x snap-mandatory w-full h-full items-center scrollbar-hide">
                    {lightboxData.images.map((img, i) => (
                        <div key={i} className="w-screen h-screen flex-shrink-0 snap-center flex items-center justify-center p-1">
                            <img src={img} className="max-w-full max-h-full object-contain" alt="Gallery" />
                        </div>
                    ))}
                </div>
                {lightboxData.images.length > 1 && (
                    <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2">
                        {lightboxData.images.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i === lightboxData.startIndex ? 'bg-white' : 'bg-white/30'}`}></div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
  );
}

// WRAPPER TO CATCH ERRORS
export default function Marketplace() {
    return (
        <ErrorBoundary>
            <MarketplaceLogic />
        </ErrorBoundary>
    );
}
