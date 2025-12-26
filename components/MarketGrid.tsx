import ProductCard from './ProductCard';

export default function MarketGrid({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400 text-lg">Waiting for the next hustle... No items found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {items.map((item, index) => (
        <ProductCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}