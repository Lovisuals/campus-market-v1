"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
// @ts-ignore
import confetti from 'canvas-confetti';
import ProductCard from './ProductCard';
import StoriesRail from './StoriesRail'; // 🟢 NEW: IMPORT THE ENGINE

// ============================================================================
// 🛠️ ZONE 1: THE OVERRIDE COCKPIT (Configuration)
// ============================================================================

const CAMPUSES = [
  { id: 'All', name: 'All Campuses', lat: 0, lng: 0 },
  { id: 'UNILAG', name: 'UNILAG', lat: 6.5157, lng: 3.3899 },
  { id: 'LASU', name: 'LASU', lat: 6.4698, lng: 3.1977 },
  { id: 'YABATECH', name: 'YABATECH', lat: 6.5188, lng: 3.3725 },
  { id: 'TASUED', name: 'TASUED', lat: 6.7967, lng: 3.9275 },
  { id: 'OOU', name: 'OOU (Ago-Iwoye)', lat: 6.9427, lng: 3.9175 },
  { id: 'UNIPORT', name: 'UNIPORT', lat: 4.9069, lng: 6.9170 },
  { id: 'UNIDEL', name: 'UNIDEL', lat: 6.2536, lng: 6.1978 },
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

const CONFIG = {
    DEFAULT_TICKER: "CAMPUS MARKETPLACE • BUY & SELL SAFELY", 
    MAX_IMAGES: 3,                 
    DAILY_POST_LIMIT: 3,           
    COMPRESSION_QUALITY: 0.8,      
    HOLD_TO_LOGIN_MS: 2000,        
    ANIMATION_SPEED: 150,          
    PHONE_PREFIX: '234'            
};

const ADMIN_CONTACT = "https://wa.me/2347068516779?text=I%20need%20a%20Pro%20Access%20Code";

// 🌟 GREEN STAR SVG (Reusable Component for Modal)
const VerifiedBadge = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="inline-block ml-2 mb-1">
      <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="#25D366" stroke="#ffffff" strokeWidth="1.5"/>
    </svg>
);

// ============================================================================
// ⚠️ ZONE 2: THE LOGIC CORE
// ============================================================================

// --- UTILITY FUNCTIONS ---
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lat2) return 0;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const maxWidth = 800; 
                const scale = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => { if(blob) resolve(blob) }, 'image/jpeg', CONFIG.COMPRESSION_QUALITY);
            };
        };
    });
};

export default function Marketplace() {
  const supabase = createClient();
  
  // --- STATE MANAGEMENT ---
  const [products, setProducts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]); 
  const [viewMode, setViewMode] = useState('market'); // 'market' or 'requests'
  
  // GALLERY STATE
  const [galleryState, setGalleryState] = useState<{images: string[], index: number} | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeCampus, setActiveCampus] = useState('All');
  
  // MODAL VISIBILITY STATES
  const [showModal, setShowModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showKYCForm, setShowKYCForm] = useState(false);
  
  // AUTH & SYSTEM STATES
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [tickerMsg, setTickerMsg] = useState('');
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<any[]>([]); 
  const [clientIp, setClientIp] = useState('0.0.0.0');
  const [systemReport, setSystemReport] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState('');

  // FORM STATES
  const [postType, setPostType] = useState('sell'); 
  const [form, setForm] = useState({ title: '', price: '', whatsapp: '', campus: 'UNILAG', type: 'Physical' });
  const [kycForm, setKycForm] = useState({ fullName: '', school: '', dept: '', level: '', address: '', gName: '', gPhone: '', phone: '' });
  const [accessCode, setAccessCode] = useState('');
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const logoRef = useRef(null);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    fetchProducts();
    fetchRequests();
    fetchBroadcasts();

    const savedTheme = localStorage.getItem('sentinel_theme');
    if (savedTheme === 'dark') { setDarkMode(true); document.body.classList.add('dark-mode'); }

    fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => setClientIp(data.ip)).catch(() => {});
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); });
    }

    checkAdminSession();
    const storedPro = localStorage.getItem('campus_pro_user');
    if(storedPro) setIsProUser(true);

    // REALTIME SUBSCRIPTIONS
    const channel = supabase.channel('realtime_feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload: any) => {
        if(payload.eventType === 'INSERT') setProducts(prev => [payload.new, ...prev]);
        else if (payload.eventType === 'DELETE') setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        else if (payload.eventType === 'UPDATE') setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload: any) => {
        if(payload.eventType === 'INSERT') setRequests(prev => [payload.new, ...prev]);
        else if (payload.eventType === 'DELETE') setRequests(prev => prev.filter(r => r.id !== payload.old.id));
        else if (payload.eventType === 'UPDATE') setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
    })
    .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, []);

  // --- DATA FETCHING ---
  const checkAdminSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
          setIsAdmin(true);
          fetchVerifiedUsers(); 
      }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };
  const fetchRequests = async () => {
    const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
    if (data) setRequests(data);
  };
  const fetchBroadcasts = async () => {
      const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
      if(data) {
          setBroadcasts(data);
          const activeMsgs = data.filter((b: any) => b.is_active).map((b: any) => b.message).join(' • ');
          setTickerMsg(activeMsgs || CONFIG.DEFAULT_TICKER);
      }
  }
  const fetchVerifiedUsers = async () => {
      const { data } = await supabase.from('verified_sellers').select('*').order('created_at', { ascending: false });
      if(data) setVerifiedUsers(data);
  }

  const toggleTheme = () => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      if(newMode) { document.body.classList.add('dark-mode'); localStorage.setItem('sentinel_theme', 'dark'); } 
      else { document.body.classList.remove('dark-mode'); localStorage.setItem('sentinel_theme', 'light'); }
  };

  // --- GALLERY LOGIC ---
  const openGallery = (images: string[], index: number) => {
      setGalleryState({ images, index });
      // Wait for render, then scroll to item
      setTimeout(() => {
          const el = document.getElementById(`gallery-item-${index}`);
          if(el) el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
      }, 50);
  };

  // --- ADMIN PANEL FUNCTIONS ---
  const handleAddBroadcast = async (e: any) => {
      e.preventDefault();
      const msg = e.target.message.value;
      if(!msg) return;
      await supabase.from('broadcasts').insert([{ message: msg, is_active: true }]);
      fetchBroadcasts();
      e.target.reset();
  };
  const toggleBroadcast = async (id: any, currentStatus: boolean) => {
      await supabase.from('broadcasts').update({ is_active: !currentStatus }).eq('id', id);
      fetchBroadcasts();
  };
  const deleteBroadcast = async (id: any) => {
      if(!confirm("Delete?")) return;
      await supabase.from('broadcasts').delete().eq('id', id);
      fetchBroadcasts();
  };

  // --- PRO SYSTEM LOGIC ---
  const handleGenerateCode = async () => {
      const code = 'PRO-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const { error } = await supabase.from('access_codes').insert([{ code, created_by: 'admin' }]);
      if(!error) setGeneratedCode(code);
      else alert("Gen Failed");
  };

  const handleVerifyCode = async (e: any) => {
      e.preventDefault();
      const { data, error } = await supabase.from('access_codes').select('*').eq('code', accessCode).eq('is_used', false).maybeSingle();
      if (data) {
          setShowCodeInput(false);
          setShowKYCForm(true); 
      } else {
          alert("Invalid or Used Code");
      }
  };

  const handleKYCSubmit = async (e: any) => {
      e.preventDefault();
      setSubmitting(true);
      const sanitizePhone = (input: string) => {
        let clean = input.replace(/\D/g, ''); 
        if (clean.startsWith('2340')) clean = CONFIG.PHONE_PREFIX + clean.substring(4);
        if (clean.length === 11 && clean.startsWith('0')) clean = CONFIG.PHONE_PREFIX + clean.substring(1);
        if (clean.length === 10 && (clean.startsWith('8') || clean.startsWith('7') || clean.startsWith('9'))) clean = CONFIG.PHONE_PREFIX + clean;
        return clean;
      };
      const finalKycPhone = sanitizePhone(kycForm.phone);
      await supabase.from('access_codes').update({ is_used: true, used_by_phone: finalKycPhone }).eq('code', accessCode);
      const { error } = await supabase.from('verified_sellers').insert([{
          user_phone: finalKycPhone,
          full_name: kycForm.fullName,
          school: kycForm.school,
          department: kycForm.dept,
          level: kycForm.level,
          address: kycForm.address,
          guarantor_name: kycForm.gName,
          guarantor_phone: kycForm.gPhone,
          is_active: true
      }]);
      setSubmitting(false);
      if (!error) {
          alert("Verification Successful! You are now Pro.");
          localStorage.setItem('campus_pro_user', 'true');
          setIsProUser(true);
          setShowKYCForm(false);
      } else {
          alert("Verification Error: " + error.message);
      }
  };
  
  const toggleUserStatus = async (id: any, currentStatus: boolean) => {
      await supabase.from('verified_sellers').update({ is_active: !currentStatus }).eq('id', id);
      fetchVerifiedUsers();
  };

  // ⚡ SELL FAST GATEKEEPER
  const handleSellFastClick = (e?: any) => {
      if(e) e.preventDefault(); 
      if (isAdmin || isProUser) { 
          setPostType('sell'); 
          setShowModal(true); 
      } else { 
          // If not Pro, Force Code Input
          setShowCodeInput(true); 
      }
  };

  // --- POSTING LOGIC ---
  const handlePost = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);

    const sanitizePhone = (input: string) => {
        let clean = input.replace(/\D/g, ''); 
        if (clean.startsWith('2340')) clean = CONFIG.PHONE_PREFIX + clean.substring(4);
        if (clean.length === 11 && clean.startsWith('0')) clean = CONFIG.PHONE_PREFIX + clean.substring(1);
        if (clean.length === 10 && (clean.startsWith('8') || clean.startsWith('7') || clean.startsWith('9'))) clean = CONFIG.PHONE_PREFIX + clean;
        return clean;
    };
    
    try {
        const finalPhone = sanitizePhone(form.whatsapp);
        const { data: banned } = await supabase.from('blacklist').select('ip_address').eq('ip_address', clientIp).maybeSingle();
        if(banned) { alert("Connection Refused."); setSubmitting(false); return; }
        
        let verifiedStatus = false;
        
        // AUTO-VERIFY FOR PROS/ADMINS
        if (isAdmin || isProUser) {
            verifiedStatus = true;
        } else {
            const { data: proData } = await supabase.from('verified_sellers').select('*').eq('user_phone', finalPhone).eq('is_active', true).maybeSingle();
            if (proData) verifiedStatus = true;
        }
        
        // Daily Limit Check
        if (!verifiedStatus) {
            const today = new Date().toLocaleDateString();
            const quota = JSON.parse(localStorage.getItem('post_quota') || '{}');
            if (quota.date === today && quota.count >= CONFIG.DAILY_POST_LIMIT) {
                alert(`Daily Limit Reached! Use "Sell Fast" or verify this number.`); 
                setSubmitting(false); return;
            }
        }

        const finalImageUrls = [];
        if (imageFiles.length > 0) {
            setUploadStatus('Uploading...');
            for (let i = 0; i < imageFiles.length; i++) {
                try {
                    const compressedBlob = await compressImage(imageFiles[i]);
                    const filename = `${postType}_${Date.now()}_${i}.jpg`; 
                    const { data, error: uploadError } = await supabase.storage.from('ITEM-IMAGES').upload(filename, compressedBlob, { cacheControl: '3600', upsert: true });
                    if (uploadError) { console.error('Upload Error:', uploadError); continue; }
                    const { data: { publicUrl } } = supabase.storage.from('ITEM-IMAGES').getPublicUrl(filename);
                    finalImageUrls.push(publicUrl);
                } catch (innerErr: any) { console.error(innerErr); }
            }
        }

        setUploadStatus('Publishing...');
        const payload = {
            title: form.title,
            price: form.price,
            whatsapp_number: finalPhone, 
            campus: form.campus,
            item_type: form.type,
            images: finalImageUrls.length > 0 ? finalImageUrls : ["https://placehold.co/600x600/008069/white?text=No+Photo"],
            is_verified: verifiedStatus, 
            is_pro_post: verifiedStatus  
        };

        if (postType === 'sell') {
            const { error } = await supabase.from('products').insert([payload]);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('requests').insert([{ ...payload, budget: form.price, image_url: finalImageUrls[0] }]);
            if (error) throw error;
        }

        const today = new Date().toLocaleDateString();
        const currentQuota = JSON.parse(localStorage.getItem('post_quota') || '{}');
        const newCount = (currentQuota.date === today ? currentQuota.count : 0) + 1;
        localStorage.setItem('post_quota', JSON.stringify({ date: today, count: newCount }));

        confetti({ particleCount: CONFIG.ANIMATION_SPEED, spread: 70, origin: { y: 0.6 } });
        setShowModal(false);
        setForm({ title: '', price: '', whatsapp: '', campus: 'UNILAG', type: 'Physical' });
        setImageFiles([]);
        setPreviewUrls([]);
        fetchProducts();
        fetchRequests();

    } catch (err: any) {
        alert("Error: " + err.message);
    } finally {
        setSubmitting(false);
        setUploadStatus('');
    }
  };

  // --- ACTIONS & HANDLERS ---
  const handleLogoTouchStart = () => { holdTimer.current = setTimeout(() => { setShowLogin(true); }, CONFIG.HOLD_TO_LOGIN_MS); };
  const handleLogoTouchEnd = () => { if(holdTimer.current) clearTimeout(holdTimer.current); };
  const handleAdminLogin = async (e: any) => {
      e.preventDefault();
      const { error } = await supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value });
      if (!error) { setIsAdmin(true); setShowLogin(false); setShowAdminPanel(true); fetchVerifiedUsers(); fetchBroadcasts(); } 
      else { alert("Access Denied"); }
  };
  const handleLogout = async () => { await supabase.auth.signOut(); setIsAdmin(false); setShowAdminPanel(false); window.location.reload(); };
  const runSystemCleanup = async () => {
      const { data, error } = await supabase.rpc('run_quant_cleanup');
      if(error) { alert("Cleanup Failed: " + error.message); } 
      else { setSystemReport(data); fetchProducts(); fetchRequests(); }
  }

  // --- ITEM ACTION HANDLERS ---
  const handleBuyClick = async (product: any) => {
      window.open(`https://wa.me/${product.whatsapp_number}`, '_blank');
      if(!isAdmin) await supabase.rpc('increment_clicks', { row_id: product.id });
  };
  const handleFulfillRequest = (req: any) => {
      const text = `Hi, I saw your request on CampusMarket for "${req.title}". I have it available.`;
      window.open(`https://wa.me/${req.whatsapp_number}?text=${encodeURIComponent(text)}`, '_blank');
  };
  const handleExpungeProduct = async (id: any) => {
      if(!confirm("DELETE ITEM?")) return;
      await supabase.from('products').delete().eq('id', id);
  };
  
  // ⚡ UPDATED: ADMIN VERIFY TOGGLE
  const handleVerifyProduct = async (id: any, currentStatus: boolean) => { 
      const { error } = await supabase.from('products').update({ is_verified: !currentStatus }).eq('id', id); 
      if(error) alert(error.message);
      else fetchProducts(); 
  };
  
  const handleExpungeRequest = async (id: any) => {
      if(!confirm("DELETE REQUEST?")) return;
      await supabase.from('requests').delete().eq('id', id);
  };
  const handleVerifyRequest = async (id: any, currentStatus: boolean) => {
      const { error } = await supabase.from('requests').update({ is_verified: !currentStatus }).eq('id', id);
      if(error) alert(error.message);
  };
  
  const handleImageSelect = (e: any) => {
      const newFiles = Array.from(e.target.files) as File[];
      const combinedFiles = [...imageFiles, ...newFiles];
      if (combinedFiles.length > CONFIG.MAX_IMAGES) {
          alert(`Max ${CONFIG.MAX_IMAGES} images allowed! First ${CONFIG.MAX_IMAGES} selected.`);
      }
      const finalFiles = combinedFiles.slice(0, CONFIG.MAX_IMAGES);
      setImageFiles(finalFiles);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls(finalFiles.map(file => URL.createObjectURL(file)));
  };

  const removeImage = (index: number) => {
      const updatedFiles = imageFiles.filter((_, i) => i !== index);
      setImageFiles(updatedFiles);
      const updatedPreviews = previewUrls.filter((_, i) => i !== index);
      setPreviewUrls(updatedPreviews);
  };
  
  const itemHandlers = { handleBuyClick, handleFulfillRequest, handleExpungeProduct, handleVerifyProduct, handleExpungeRequest, handleVerifyRequest, openGallery };
  
  const [searchTerm, setSearchTerm] = useState('');
  const filterList = (list: any[]) => {
      return list.filter(item => {
          if (activeCampus !== 'All' && item.campus !== activeCampus) return false;
          const term = searchTerm.toLowerCase();
          if (term && !item.title.toLowerCase().includes(term) && !item.campus.toLowerCase().includes(term)) return false;
          return true;
      });
  };
  const displayItems = viewMode === 'market' ? filterList(products) : filterList(requests);
  if (userLoc && activeCampus === 'All') {
      displayItems.sort((a, b) => {
          const cA = CAMPUSES.find(c => c.id === a.campus) || { lat: 0, lng: 0 };
          const cB = CAMPUSES.find(c => c.id === b.campus) || { lat: 0, lng: 0 };
          return getDistance(userLoc.lat, userLoc.lng, cA.lat, cA.lng) - getDistance(userLoc.lat, userLoc.lng, cB.lat, cB.lng);
      });
  }

  // ============================================================================
  // 🎨 ZONE 3: THE VISUAL LAYER (JSX)
  // ============================================================================
  return (
    <div className="min-h-screen pb-32 transition-colors duration-300">
        
        {/* TICKER */}
        <div className="ticker-container"><div className="ticker-content"><span className="text-[var(--wa-neon)] font-black text-[10px] uppercase tracking-widest">{tickerMsg}</span></div></div>
        
        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-[var(--wa-chat-bg)] border-b border-[var(--border)] pt-safe noselect shadow-sm backdrop-blur-md">
            <div className="px-5 py-4 flex justify-between items-center">
                <div ref={logoRef} onMouseDown={handleLogoTouchStart} onMouseUp={handleLogoTouchEnd} onTouchStart={handleLogoTouchStart} onTouchEnd={handleLogoTouchEnd} className="cursor-pointer">
                    <h1 className="text-[17px] font-extrabold tracking-tighter text-[var(--wa-teal)]">CAMPUS <span className="opacity-30">MARKETPLACE</span></h1>
                    {isAdmin && <span className="text-[8px] text-yellow-500 font-black uppercase bg-yellow-100 px-1 rounded ml-1">Sovereign Active</span>}
                </div>
                <div className="flex gap-3">
                    <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--surface)] shadow-sm tap">{darkMode ? '☀️' : '🌙'}</button>
                    {isAdmin && <button onClick={() => setShowAdminPanel(true)} className="bg-black text-white px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-lg tap">COMMAND</button>}
                    {!isAdmin && <button type="button" onClick={handleSellFastClick} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-lg tap ${isProUser ? 'bg-yellow-500 text-black' : 'bg-[var(--wa-teal)] text-white'}`}>{isProUser ? '⚡ SELL FAST' : '💎 GO PRO'}</button>}
                </div>
            </div>
             <div className="px-5 pb-2 flex gap-2">
                <button onClick={() => setViewMode('market')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition tap ${viewMode === 'market' ? 'bg-[var(--wa-teal)] text-white shadow-lg' : 'bg-[var(--surface)] text-gray-400'}`}>Market</button>
                <button onClick={() => setViewMode('requests')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition tap ${viewMode === 'requests' ? 'bg-[#8E44AD] text-white shadow-lg' : 'bg-[var(--surface)] text-gray-400'}`}>Requests</button>
            </div>
            
            {/* 🔍 SEARCH BAR (Moved Up) */}
            <div className="px-5 pb-3"><div className="search-container"><span className="opacity-20 text-sm mr-3">🔍</span><input className="flex-1 bg-transparent py-3 text-[13px] font-semibold outline-none wa-input" placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
        </header>

        {/* 🟢 NEW: STORIES RAIL INJECTED HERE (Replaces Old Campus Buttons) */}
        <StoriesRail activeCampus={activeCampus} setActiveCampus={setActiveCampus} />

        {/* MAIN FEED */}
        <main className="grid grid-cols-2 gap-3 px-4 pb-20 mt-4">
            {loading ? <p className="col-span-2 text-center py-10 opacity-40">Loading...</p> : 
             displayItems.map(item => <ProductCard key={item.id} item={item} viewMode={viewMode} isAdmin={isAdmin} userLoc={userLoc} campuses={CAMPUSES} handlers={itemHandlers} />)}
        </main>
        
        {/* FAB */}
        <button onClick={() => setShowModal(true)} className="fixed bottom-8 right-6 fab z-50 tap">+</button>

        {/* --- MAIN MODAL (SELL/REQUEST) --- */}
        {showModal && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-end backdrop-blur-sm">
                <div className="glass-3d w-full p-6 rounded-t-[32px] animate-slide-up max-h-[85vh] overflow-y-auto no-bounce">
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-2xl">
                        <button onClick={() => setPostType('sell')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition ${postType === 'sell' ? 'bg-white text-[var(--wa-teal)] shadow-sm' : 'text-gray-400'}`}>I want to Sell</button>
                        <button onClick={() => setPostType('request')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition ${postType === 'request' ? 'bg-white text-[#8E44AD] shadow-sm' : 'text-gray-400'}`}>I want to Buy</button>
                    </div>
                    {(isProUser || isAdmin) && postType === 'sell' && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-xl mb-4 flex items-center gap-2">
                             <VerifiedBadge />
                             <p className="text-[10px] font-bold text-green-700">Verified Mode Active</p>
                        </div>
                    )}
                    <form onSubmit={handlePost} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                             <select className="wa-input" value={form.campus} onChange={e => setForm({...form, campus: e.target.value})}>{CAMPUSES.filter(c => c.id !== 'All').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                             {postType === 'sell' && <select className="wa-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="Physical">📦 Physical</option><option value="Digital">⚡ Digital</option></select>}
                        </div>
                        <input className="wa-input" placeholder={postType === 'sell' ? "Title" : "What do you need?"} value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                        <input className="wa-input" type="number" placeholder={postType === 'sell' ? "Price" : "Budget"} value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center relative">
                            {imageFiles.length < CONFIG.MAX_IMAGES && (
                                <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="absolute inset-0 opacity-0 w-full h-full z-20 cursor-pointer" />
                            )}
                            {previewUrls.length > 0 ? (
                                <div className="flex gap-2 justify-center relative z-10">
                                    {previewUrls.map((url, i) => (
                                        <div key={i} className="relative group">
                                            <img src={url} className="h-16 w-16 rounded-lg object-cover shadow-sm border border-gray-200" />
                                            <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md z-30">✕</button>
                                        </div>
                                    ))}
                                    {imageFiles.length < CONFIG.MAX_IMAGES && <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl font-black">+</div>}
                                </div>
                            ) : (
                                <div className="pointer-events-none">
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Tap to Snap (Max 3)</p>
                                </div>
                            )}
                        </div>

                        <input className="wa-input" type="tel" placeholder="WhatsApp (234...)" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} required />
                        <button disabled={submitting} className={`w-full text-white py-4 rounded-2xl font-black shadow-xl text-lg uppercase tracking-widest tap btn-active ${postType === 'sell' ? 'bg-[var(--wa-teal)]' : 'bg-[#8E44AD]'}`}>{uploadStatus || (postType === 'sell' ? "POST" : "REQUEST")}</button>
                        <button type="button" onClick={() => setShowModal(false)} className="w-full py-3 text-xs font-bold text-gray-400">CANCEL</button>
                    </form>
                </div>
            </div>
        )}

        {/* --- PRO CODE INPUT MODAL --- */}
        {showCodeInput && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
                <div className="glass-3d w-full max-w-sm p-8 text-center relative">
                    <button onClick={() => setShowCodeInput(false)} className="absolute top-4 right-4 text-2xl opacity-50 tap">×</button>
                    <div className="text-5xl mb-4">🔐</div>
                    <h2 className="text-xl font-black uppercase text-[var(--wa-teal)] mb-2">Pro Access</h2>
                    <p className="text-xs font-bold text-gray-400 mb-6">Enter the code from Admin to unlock Fast Selling</p>
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                        <input className="wa-input text-center tracking-widest font-mono text-xl" placeholder="PRO-XXXXXX" value={accessCode} onChange={e => setAccessCode(e.target.value)} required />
                        <button className="w-full bg-[var(--wa-teal)] text-white py-3 rounded-xl font-black uppercase tap btn-active">Unlock</button>
                    </form>
                    <a href={ADMIN_CONTACT} target="_blank" className="block mt-4 text-[10px] font-bold text-blue-500">Get Code from Admin</a>
                </div>
            </div>
        )}

        {/* --- KYC MODAL --- */}
        {showKYCForm && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-end backdrop-blur-sm">
                <div className="glass-3d w-full p-6 rounded-t-[32px] animate-slide-up max-h-[90vh] overflow-y-auto no-bounce">
                    <h2 className="text-xl font-black uppercase text-center mb-1 text-[var(--wa-teal)]">Identity Verification</h2>
                    <p className="text-xs text-center text-gray-400 mb-6 font-bold">This data acts as insurance. Integrity is mandatory.</p>
                    <form onSubmit={handleKYCSubmit} className="space-y-3">
                        <input className="wa-input" placeholder="Full Name" value={kycForm.fullName} onChange={e => setKycForm({...kycForm, fullName: e.target.value})} required />
                        <div className="grid grid-cols-2 gap-2">
                             <input className="wa-input" placeholder="School" value={kycForm.school} onChange={e => setKycForm({...kycForm, school: e.target.value})} required />
                             <input className="wa-input" placeholder="Level" value={kycForm.level} onChange={e => setKycForm({...kycForm, level: e.target.value})} required />
                        </div>
                        <input className="wa-input" placeholder="Department" value={kycForm.dept} onChange={e => setKycForm({...kycForm, dept: e.target.value})} required />
                        <input className="wa-input" placeholder="Home Address (Lagos)" value={kycForm.address} onChange={e => setKycForm({...kycForm, address: e.target.value})} required />
                        <input className="wa-input" placeholder="Your WhatsApp" value={kycForm.phone} onChange={e => setKycForm({...kycForm, phone: e.target.value})} required />
                        <div className="bg-gray-100 p-3 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Guarantor Info</p>
                            <input className="wa-input mb-2" placeholder="Guarantor Name" value={kycForm.gName} onChange={e => setKycForm({...kycForm, gName: e.target.value})} required />
                            <input className="wa-input" placeholder="Guarantor Phone" value={kycForm.gPhone} onChange={e => setKycForm({...kycForm, gPhone: e.target.value})} required />
                        </div>
                        <button disabled={submitting} className="w-full bg-black text-white py-4 rounded-2xl font-black shadow-xl uppercase tap btn-active">
                             {submitting ? 'Verifying...' : 'Submit & Activate Pro'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* --- ADMIN PANEL MODAL --- */}
        {showAdminPanel && (
            <div className="fixed inset-0 z-[200] bg-white dark:bg-black overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black uppercase text-[var(--wa-teal)]">Sovereign Admin</h2><button onClick={() => setShowAdminPanel(false)} className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-lg">CLOSE</button></div>
                    <div className="space-y-6">
                         {/* CODE GENERATOR */}
                         <div className="bg-yellow-50 p-5 rounded-3xl border border-yellow-200">
                             <h3 className="text-xs font-black uppercase text-yellow-600 mb-2">Code Generator</h3>
                             <div className="flex gap-2">
                                 <div className="flex-1 bg-white p-3 rounded-xl font-mono text-center font-bold text-xl tracking-widest select-all">{generatedCode || '----'}</div>
                                 <button onClick={handleGenerateCode} className="bg-black text-white px-4 rounded-xl font-black text-xs">GENERATE</button>
                             </div>
                         </div>
                         
                         {/* VERIFIED USERS LIST */}
                         <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                             <h3 className="text-xs font-black uppercase text-gray-500 mb-4">💎 Verified Users ({verifiedUsers.length})</h3>
                             <div className="space-y-2 max-h-60 overflow-y-auto">
                                 {verifiedUsers.map(user => (
                                     <div key={user.id} className="bg-white p-3 rounded-xl shadow-sm flex justify-between items-center">
                                         <div>
                                             <p className="text-[12px] font-black">{user.full_name}</p>
                                             {/* ⚡ UPDATED: Large Readable Phone Number */}
                                             <p className="text-[14px] font-mono font-bold text-blue-600 select-all">{user.user_phone}</p>
                                         </div>
                                         <button onClick={() => toggleUserStatus(user.id, user.is_active)} className={`text-[8px] font-black px-2 py-1 rounded ${user.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                             {user.is_active ? 'ACTIVE' : 'REVOKED'}
                                         </button>
                                     </div>
                                 ))}
                             </div>
                         </div>
                         
                         {/* BROADCASTS */}
                         <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
                             <h3 className="text-xs font-black uppercase text-blue-500 mb-4">📢 Broadcasts</h3>
                             <div className="space-y-3 mb-4">
                                {broadcasts.map(b => (
                                    <div key={b.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                                        <span className={`text-xs font-bold ${!b.is_active && 'opacity-30 line-through'}`}>{b.message}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleBroadcast(b.id, b.is_active)} className="text-xl tap">{b.is_active ? '👁️' : '🚫'}</button>
                                            <button onClick={() => deleteBroadcast(b.id)} className="text-xl opacity-30 hover:opacity-100 tap">🗑️</button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                             <form onSubmit={handleAddBroadcast} className="flex gap-2">
                                <input name="message" className="wa-input" placeholder="New Alert..." required />
                                <button className="bg-black text-white px-4 rounded-xl font-bold text-xs">ADD</button>
                             </form>
                         </div>
                         
                         <button onClick={runSystemCleanup} className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black uppercase text-xs">RUN SYSTEM CLEANUP</button>
                         <button onClick={handleLogout} className="w-full bg-red-600 text-white py-3 rounded-2xl font-black uppercase text-xs">LOGOUT</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* --- ADMIN LOGIN MODAL --- */}
        {showLogin && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                 <div className="glass-3d w-full max-w-sm p-8 border-t-4 border-[var(--wa-teal)]">
                    <h2 className="text-xl font-black uppercase text-center mb-6">Sovereign Entry</h2>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <input name="email" className="wa-input" placeholder="ID" />
                        <input name="password" type="password" className="wa-input" placeholder="Key" />
                        <button className="w-full bg-[var(--wa-teal)] text-white py-3 rounded-xl font-black uppercase tap btn-active">Authenticate</button>
                        <button type="button" onClick={() => setShowLogin(false)} className="w-full text-[10px] font-bold text-gray-500 py-2 uppercase tap">Abort</button>
                    </form>
                </div>
            </div>
        )}

        {/* --- FULLSCREEN GALLERY (SWIPEABLE SNAP SCROLL) --- */}
        {galleryState && (
            <div className="fixed inset-0 z-[300] bg-black flex flex-col justify-center animate-fade-in touch-none">
                <button onClick={() => setGalleryState(null)} className="absolute top-5 right-5 text-white text-3xl font-bold bg-white/10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md z-50 tap">×</button>
                
                {/* Horizontal Snap Scroll Container */}
                <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory items-center scrollbar-hide">
                    {galleryState.images.map((img, i) => (
                        <div key={i} id={`gallery-item-${i}`} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center relative">
                            <img src={img} className="max-w-full max-h-screen object-contain" />
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-xs font-bold bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                                {i + 1} / {galleryState.images.length}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
}