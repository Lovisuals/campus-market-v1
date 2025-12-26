import Image from 'next/image';

export default function ProductCard({ item, index }: { item: any; index: number }) {
  return (
    <div className="group border rounded-xl p-4 shadow-sm hover:shadow-lg transition-all bg-white border-gray-100">
      <div className="relative aspect-square mb-4 overflow-hidden rounded-lg">
        <Image
          src={item.image_url || '/placeholder.png'}
          alt={item.title || 'Product'}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={index < 4} 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <h3 className="font-bold text-gray-800 text-lg truncate">{item.title}</h3>
      <div className="flex justify-between items-center mt-2">
        <p className="text-green-600 font-bold text-xl">₦{item.price?.toLocaleString()}</p>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">P2P</span>
      </div>
    </div>
  );
}