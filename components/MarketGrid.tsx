import ProductCard from './ProductCard'; // Correct relative import

export default function MarketGrid({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return <div className="py-20 text-center text-gray-500">No items found.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {items.map((item, index) => (
        // This line fixes the "Cannot find name ProductCard" error
        <ProductCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}