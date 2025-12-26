"use client";

const filters = [
  // The Categories
  { name: "All Items", type: "cat" },
  { name: "Gadgets", type: "cat" },
  { name: "Hostels", type: "cat" },
  // The Universities (Restored)
  { name: "UNILAG", type: "uni" },
  { name: "LASU", type: "uni" },
  { name: "YABATECH", type: "uni" },
  { name: "OOU", type: "uni" },
  { name: "UI", type: "uni" },
  { name: "UNIBEN", type: "uni" },
  { name: "FUTA", type: "uni" },
  { name: "ABU Zaria", type: "uni" },
];

export default function CategoryBar() {
  return (
    <div className="w-full mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.name}
            className={`
              whitespace-nowrap px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border
              ${f.type === 'uni' 
                ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100' 
                : 'bg-white text-wa-teal border-wa-teal/30 shadow-sm'
              }
            `}
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}