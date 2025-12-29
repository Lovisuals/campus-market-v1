"use client";

import { useMemo } from 'react';

interface ProductCardProps {
  item: any;
  viewMode: string;
  isAdmin: boolean;
  userLoc: { lat: number; lng: number } | null;
  campuses: any[];
  handlers: any;
}

export default function ProductCard({ item, viewMode, isAdmin, userLoc, campuses, handlers }: ProductCardProps) {
  
  // 1. Image Parsing: Ensures arrays or strings work without drift
  const images = useMemo(() => {
    if (Array.isArray(item.images) && item.images.length > 0) return item.images;
    try {
      if (typeof item.images === 'string') {
        const parsed = JSON.parse(item.images);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* silent fail to fallback */ }
    return [item.image_url || "https://placehold.co/600x600/008069/white?text=No+Image"];
  }, [item.images, item.image_url]);

  const isRequest = viewMode === 'requests';

  return (
    <div className={`relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 animate-fade-in 
      ${item.is_verified ? 'verified-pulse border-[var(--wa-teal)]/30' : 'opacity-90'}`}>
      
      {/* SOVEREIGN ADMIN OVERLAY */}
      {isAdmin && (
        <div className="absolute top-2 left-2 z-30 flex gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); handlers.handleExpungeProduct(item.id); }} 
            className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg tap"
          >
            DEL
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); isRequest ? handlers.handleVerifyRequest(item.id, item.is_verified) : handlers.handleVerifyProduct(item.id, item.is_verified); }} 
            className={`${item.is_verified ? 'bg-blue-600' : 'bg-gray-500'} text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg tap`}
          >
            {item.is_verified ? 'VERIFIED' : 'PENDING'}
          </button>
        </div>
      )}

      {/* MULTI-IMAGE CAROUSEL (THE HOOK) */}
      <div className="aspect-square bg-gray-100 relative group overflow-hidden">
        <div className="snap-x-mandatory scrollbar-hide w-full h-full">
          {images.map((img: string, i: number) => (
            <div 
              key={i} 
              className="snap-center-item w-full h-full cursor-pointer"
              onClick={() => handlers.openGallery(images, i)}
            >
              <img 
                src={img} 
                alt={`${item.title} - ${i}`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* PHOTO COUNT BADGE */}
        {images.length > 1 && (
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-full z-10 uppercase tracking-tighter">
            {images.length} Photos
          </div>
        )}

        {/* INDICATOR DOTS */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
            {images.map((_: any, i: number) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white shadow-sm opacity-60" />
            ))}
          </div>
        )}

        {/* TYPE BADGE */}
        {item.item_type && !isRequest && (
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/90 text-[8px] font-black uppercase px-2 py-1 rounded text-gray-500 shadow-sm z-10">
            {item.item_type}
          </div>
        )}
      </div>

      {/* PRODUCT DATA AREA */}
      <div className="p-3">
        <div className="flex items-center gap-1 mb-1">
          <h3 className="text-[13px] font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{item.title}</h3>
          {item.is_verified && <span className="text-blue-500 text-[10px]">✔</span>}
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <p className="text-[14px] font-black text-[var(--wa-teal)] price-tag">
            ₦{Number(item.price || item.budget).toLocaleString()}
          </p>
          <span className="text-[8px] text-gray-400 font-black bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
            {item.campus}
          </span>
        </div>

        <button 
          onClick={() => isRequest ? handlers.handleFulfillRequest(item) : handlers.handleBuyClick(item)}
          className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg tap btn-active transition-all ${isRequest ? 'bg-[#8E44AD] shadow-purple-200' : 'bg-[var(--wa-teal)] shadow-teal-100'}`}
        >
          {isRequest ? 'Fulfill Request' : 'Chat Seller'}
        </button>
      </div>
    </div>
  );
}
