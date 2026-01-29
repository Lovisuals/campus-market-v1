"use client";

import React, { useMemo, memo } from 'react';

interface Product {
  id: string;
  title: string;
  price?: number | string;
  budget?: number | string;
  images?: string[] | string;
  image_url?: string;
  is_verified?: boolean;
  campus?: string;
}

interface Handlers {
  openGallery: (images: string[], index: number) => void;
  handleExpungeProduct: (id: string) => void;
  handleVerifyProduct: (id: string, current: boolean) => void;
  handleFulfillRequest: (item: Product) => void;
  handleBuyClick: (item: Product) => void;
}

interface ProductCardProps {
  item: Product;
  product?: Product; // Added optional product prop for compatibility
  viewMode?: string;
  isAdmin?: boolean;
  handlers: Handlers;
}

function ProductCard({ item, viewMode = '', isAdmin = false, handlers }: ProductCardProps) {
  const images = useMemo<string[]>(() => {
    if (Array.isArray(item.images) && item.images.length > 0) return item.images as string[];
    try {
      if (typeof item.images === 'string') {
        const parsed = JSON.parse(item.images as string);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [item.image_url || 'https://placehold.co/600x600/008069/white?text=No+Photo'];
  }, [item.images, item.image_url]);

  const isRequest = viewMode === 'requests';

  return (
    <div className={`relative bg-white dark:bg-[#111b21] rounded-[24px] overflow-hidden shadow-sm border border-gray-100 dark:border-[#2a3942] animate-fade-in 
      ${item.is_verified ? 'verified-pulse ring-1 ring-[var(--wa-teal)]/20' : ''}`}>
      {isAdmin && (
        <div className="absolute top-2 left-2 z-30 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handlers.handleExpungeProduct(item.id); }}
            className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg tap"
          >
            DELETE
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handlers.handleVerifyProduct(item.id, !!item.is_verified); }}
            className={`${item.is_verified ? 'bg-blue-600' : 'bg-gray-500'} text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg tap`}
          >
            {item.is_verified ? 'VERIFIED' : 'PENDING'}
          </button>
        </div>
      )}

      <div className="aspect-square bg-gray-100 dark:bg-[#202c33] relative group overflow-hidden">
        <div className="flex snap-x-mandatory scrollbar-hide w-full h-full overflow-x-auto">
          {images.map((img: string, i: number) => (
            <div
              key={i}
              className="snap-center w-full h-full flex-shrink-0 cursor-pointer"
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

        {images.length > 1 && (
          <>
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-full z-10">
              {images.length} PHOTOS
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_: any, i: number) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm" />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-1 mb-1">
          <h3 className="text-[13px] font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
            {item.title}
          </h3>
          {item.is_verified && <span className="text-[var(--wa-teal)] text-[10px]">✔</span>}
        </div>

        <div className="flex justify-between items-center mb-3">
          <p className="text-[15px] font-black text-[var(--wa-teal)]">
            ₦{Number((item.price ?? item.budget) || 0).toLocaleString()}
          </p>
          <span className="text-[8px] text-gray-400 font-black bg-gray-50 dark:bg-[#2a3942] px-2 py-1 rounded-md uppercase">
            {item.campus}
          </span>
        </div>

        <button
          onClick={() => isRequest ? handlers.handleFulfillRequest(item) : handlers.handleBuyClick(item)}
          className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg tap btn-active transition-all 
            ${isRequest ? 'bg-[#8E44AD] shadow-purple-200' : 'bg-[var(--wa-teal)] shadow-teal-100'}`}
        >
          {isRequest ? 'Fulfill Request' : 'Chat Seller'}
        </button>
      </div>
    </div>
  );
}

export default memo(ProductCard);
