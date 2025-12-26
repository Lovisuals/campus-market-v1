import Image from 'next/image';

export default function ProductCard({ item, index }: { item: any; index: number }) {
  // Calculative Date Logic: Formats the timestamp to "Today" or "Yesterday"
  const timeAgo = item.created_at 
    ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'Recently';

  return (
    <div className="group relative flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-green-500/50 transition-all duration-300 shadow-sm active:scale-[0.98]">
      
      {/* Product Image Section */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-50">
        <Image
          src={item.image_url || '/placeholder.png'}
          alt={item.title || 'Campus Item'}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority={index < 4}
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {/* P2P Trust Badge - Floating */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-green-700">Verified P2P</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
              {item.title}
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 font-medium mb-2 uppercase">{item.category || 'General'}</p>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-medium">Price</span>
            <p className="text-lg font-black text-green-600 leading-none">
              ₦{item.price?.toLocaleString()}
            </p>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] text-gray-400 block mb-1">{timeAgo}</span>
            <button className="bg-green-50 text-green-600 p-1.5 rounded-full hover:bg-green-600 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}