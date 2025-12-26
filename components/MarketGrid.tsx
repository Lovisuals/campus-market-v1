import ProductCard from './ProductCard';

export default function MarketGrid({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <div className="bg-gray-50 p-6 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h3 className="text-gray-900 font-bold text-lg">No hustles found yet</h3>
        <p className="text-gray-500 max-w-xs mx-auto">Be the first to post something and start trading on campus!</p>
      </div>
    );
  }

  return (
    // Optimized Grid: 2 columns on mobile (grid-cols-2), 4 on desktop (lg:grid-cols-4)
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8 px-1">
      {items.map((item, index) => (
        <ProductCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}