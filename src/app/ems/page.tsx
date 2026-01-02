import Link from 'next/link';

export default function EMSDashboard() {
  return (
    <div className="space-y-12 max-w-6xl mx-auto py-12 px-6">
      {/* 🏛️ NATIONAL HEADER */}
      <div className="text-center space-y-4">
        <div className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
          🇳🇬 National Student Utility
        </div>
        <h2 className="text-6xl font-black tracking-tighter text-zinc-900 dark:text-white">
          FreeGST <span className="text-[var(--wa-teal)]">Hub</span>
        </h2>
        <p className="text-xl font-medium text-zinc-500 max-w-2xl mx-auto">
          The universal practice engine for Use of English, Philosophy, and Computer Studies. 
          Built for every Nigerian Undergraduate.
        </p>
      </div>

      {/* ⚡ THE TRIAD OF LEARNING */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/ems/practice" className="p-8 rounded-[40px] bg-zinc-900 text-white hover:scale-[1.02] transition-transform tap group">
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-[var(--wa-teal)] transition-colors">⏱️</div>
          <h3 className="text-2xl font-bold mb-2">CBT Simulator</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Timed practice exams using the standard 50-question / 40-minute NUC format.</p>
        </Link>

        <Link href="/ems/learn" className="p-8 rounded-[40px] border-2 border-zinc-100 hover:border-[var(--wa-teal)] transition-all tap group">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-[var(--wa-teal)] group-hover:text-white transition-colors">🧠</div>
          <h3 className="text-2xl font-bold mb-2">Infinite Patience</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">Untimed learning. Every wrong answer triggers a step-by-step AI explanation.</p>
        </Link>

        <Link href="/ems/analytics" className="p-8 rounded-[40px] border-2 border-zinc-100 hover:border-purple-500 transition-all tap group">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors">📊</div>
          <h3 className="text-2xl font-bold mb-2">Weakness Radar</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">Identify which GST topics are pulling your GPA down before the real exam.</p>
        </Link>
      </div>

      {/* 📚 COURSE GRID */}
      <div className="pt-10 border-t border-zinc-100">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 text-center">Active Course Banks</h4>
        <div className="flex flex-wrap justify-center gap-3">
          {['GST101', 'GST102', 'GST103', 'GST104', 'GST105', 'GST203'].map(code => (
            <div key={code} className="px-6 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-sm font-bold text-zinc-600">
              {code}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
