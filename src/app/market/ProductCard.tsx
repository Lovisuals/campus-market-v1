"use client";

import { useMemo } from 'react';

// --- THE FIX: Define the expected props ---
interface ProductCardProps {
  item: any;
  viewMode: string;
  isAdmin: boolean;
  userLoc: { lat: number; lng: number } | null;
  campuses: any[];
  handlers: any;
}

export default function ProductCard({ item, viewMode, isAdmin, userLoc, campuses, handlers }: ProductCardProps) {
  
  // 1. Image Parsing
  const images = useMemo(() => {
    if (Array.isArray(item.images)) return item.images;
    try {
      if (typeof item.images === 'string') return JSON.parse(item.images);
    } catch (e) { return [item.image_url || "https://placehold.co/600x600/008069/white?text=No+Image"]; }
    return [item.image_url || "https://placehold.co/600x600/008069/white?text=No+Image"];
  }, [item]);

  // 2. Distance Calculation
  const distance = useMemo(() => {
    if (!userLoc || !item.campus) return null;
    const campusData = campuses.find((c: any) => c.id === item.campus);
    if (!campusData) return null;
    
    const R = 6371; 
    const dLat = (campusData.lat - userLoc.lat) * Math.PI / 180;
    const dLon = (campusData.lng - userLoc.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(userLoc.lat * Math.PI/180) * Math.cos(campusData.lat * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;
    return dist < 1 ? "< 1km" : `~${Math.round(dist)}km`;
  }, [userLoc, item.campus, campuses]);

  const isRequest = viewMode === 'requests';

  return (
    <div className={`relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 animate-fade-in ${!item.is_verified && !isAdmin ? 'opacity-70' : ''}`}>
      
      {/* ADMIN OVERLAY CONTROLS */}
      {isAdmin && (
        <div className="absolute top-2 left-2 z-20 flex gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); handlers.handleExpungeProduct(item.id); }}
            className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-md active:scale-90 transition-transform"
          >
            DEL
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); isRequest ? handlers.handleVerifyRequest(item.id, item.is_verified) : handlers.handleVerifyProduct(item.id, item.is_verified); }}
            className={`${item.is_verified ? 'bg-blue-600' : 'bg-gray-400'} text-white text-[10px] font-black px-2 py-1 rounded shadow-md active:scale-90 transition-transform`}
          >
            {item.is_verified ? 'VERIFIED' : 'PENDING'}
          </button>
        </div>
      )}

      {/* CLICK TO EXPAND */}
      <div 
        className="aspect-square bg-gray-100 relative cursor-pointer group"
        onClick={() => handlers.setFullscreenImg(images[0])}
      >
        <img 
          src={images[0]} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          loading="lazy"
        />
        {/* Distance Badge */}
        {distance && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <span>📍</span> {distance}
          </div>
        )}
        {/* Type Badge */}
        {item.item_type && !isRequest && (
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/90 text-[8px] font-black uppercase px-2 py-1 rounded text-gray-500 shadow-sm">
            {item.item_type}
          </div>
        )}
      </div>

      {/* INFO AREA */}
      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1 mb-1">{item.title}</h3>
        
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-black text-[var(--wa-teal)]">
            ₦{Number(item.price || item.budget).toLocaleString()}
          </p>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">{item.campus}</span>
        </div>

        <button 
          onClick={() => isRequest ? handlers.handleFulfillRequest(item) : handlers.handleBuyClick(item)}
          className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg tap active:scale-95 transition-all ${isRequest ? 'bg-[#8E44AD] shadow-purple-200' : 'bg-[var(--wa-teal)] shadow-teal-100'}`}
        >
          {isRequest ? 'Fulfill Request' : 'Chat Seller'}
        </button>
      </div>
    </div>
  );
}