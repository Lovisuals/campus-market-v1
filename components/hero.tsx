export default function Hero() {
  return (
    <div className="flex flex-col gap-12 items-center py-10">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-center">
          CAMPUS <span className="text-green-600">MARKET</span>
        </h1>
        <div className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold uppercase tracking-widest">
          P2P Student Trading
        </div>
      </div>
      
      <p className="text-xl lg:text-2xl text-center max-w-2xl text-gray-600 !leading-relaxed">
        The most reliable way to buy and sell on campus. 
        <span className="block font-semibold text-gray-900">By students, for students.</span>
      </p>

      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4" />
    </div>
  );
}