import React, { useEffect, useRef } from 'react';

// HELPER: Calculate Distance
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

export default function ProductCard({ item, viewMode, isAdmin, userLoc, campuses, handlers }) {
    const isSold = (item.click_count || 0) >= 5;
    const campData = campuses.find(c => c.id === item.campus);
    const dist = userLoc && campData ? getDistance(userLoc.lat, userLoc.lng, campData.lat, campData.lng).toFixed(1) + 'km' : item.campus;
    
    // --- AUTO-SCROLL LOGIC ---
    const scrollRef = useRef(null);
    
    useEffect(() => {
        // Only auto-scroll if there are multiple images
        if (!item.images || item.images.length <= 1) return;

        const interval = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                // If we reached the end, snap back to start. Otherwise, scroll one page width.
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    scrollRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
                }
            }
        }, 3000); // 3 Seconds Interval

        return () => clearInterval(interval);
    }, [item.images]);

    // --- RENDER: MARKET ITEM ---
    if (viewMode === 'market') {
        return (
            <div className={`relative bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300 ${item.is_admin_post ? 'ring-2 ring-yellow-400' : ''}`}>
                
                {/* IMAGE CAROUSEL */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden group">
                    <div 
                        ref={scrollRef}
                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full"
                    >
                         {item.images && item.images.length > 0 ? item.images.map((img, idx) => (
                            <img 
                                key={idx} 
                                src={img} 
                                // Pass the WHOLE item to the handler, not just one image
                                onClick={() => handlers.openLightbox(item, idx)} 
                                className="w-full h-full object-cover flex-shrink-0 snap-center cursor-pointer" 
                            />
                        )) : <img src="https://placehold.co/400x400/008069/white?text=No+Photo" className="w-full h-full object-cover" />}
                    </div>

                    {/* Dots Indicator */}
                    {item.images?.length > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                            {item.images.map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-white/80 shadow-sm backdrop-blur-sm"></div>)}
                        </div>
                    )}

                    {/* Badges */}
                    {isSold && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20"><span className="text-white font-black border-2 px-1 py-0.5 text-[8px] -rotate-12">SOLD</span></div>}
                    {item.is_verified && <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-20"><span>🛡️</span></div>}
                </div>

                {/* DETAILS */}
                <div className="p-2.5">
                    <div className="h-8 mb-1">
                        <h3 className="text-[10px] font-bold leading-tight line-clamp-2 text-gray-800 dark:text-gray-200">
                            {item.title}
                        </h3>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                         <p className="font-black text-xs text-[var(--wa-teal)]">₦{Number(item.price).toLocaleString()}</p>
                         <span className="text-[8px] font-bold text-gray-400">{dist}</span>
                    </div>

                    <button 
                        onClick={() => handlers.handleBuyClick(item)} 
                        disabled={isSold} 
                        className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-wide transition tap ${isSold ? 'bg-gray-100 text-gray-400' : 'bg-[var(--wa-teal)]/10 text-[var(--wa-teal)] hover:bg-[var(--wa-teal)] hover:text-white'}`}
                    >
                        {isSold ? 'Sold' : 'Chat'}
                    </button>

                    {isAdmin && (
                        <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={() => handlers.handleExpungeProduct(item.id)} className="bg-red-50 text-red-500 py-1 rounded text-[8px] font-bold">DEL</button>
                            <button onClick={() => handlers.handleVerifyProduct(item.id, item.is_verified)} className={`py-1 rounded text-[8px] font-bold ${item.is_verified ? 'bg-gray-100' : 'bg-yellow-50 text-yellow-600'}`}>
                                {item.is_verified ? 'UN-V' : 'VER'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- RENDER: REQUEST ITEM ---
    return (
        <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-[#8E44AD] transition-colors duration-300">
            <div className="p-3 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="bg-[#8E44AD]/10 text-[#8E44AD] text-[7px] font-black px-1.5 py-0.5 rounded uppercase">WANTED</span>
                        <span className="text-[8px] font-bold text-gray-400">{dist}</span>
                    </div>
                    
                    <h3 className="text-[10px] font-bold leading-tight mb-2 line-clamp-2 text-gray-800 dark:text-gray-200">{item.title}</h3>
                    
                    {item.image_url && (
                        <img 
                            src={item.image_url} 
                            onClick={() => handlers.openLightbox(item, 0)} 
                            className="w-8 h-8 rounded-md object-cover mb-2 border border-gray-100 dark:border-gray-700 cursor-pointer" 
                        />
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
}
