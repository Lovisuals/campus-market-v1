"use client";

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function StoriesRail({ activeCampus, setActiveCampus }: any) {
  const supabase = createClient();
  const [stories, setStories] = useState<any[]>([]);
  const [viewingStory, setViewingStory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // CAMPUSES SYNCED WITH PAGE.TSX
  const CAMPUS_PILLS = ['All', 'UNILAG', 'LASU', 'YABATECH', 'TASUED', 'OOU', 'UI', 'OAU', 'UNN'];

  useEffect(() => {
    fetchStories();
    const channel = supabase.channel('realtime_stories')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'videos' }, fetchStories)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchStories = async () => {
    const { data } = await supabase
      .from('videos')
      .select('*, contributors!inner(name, school, is_admin, phone)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) setStories(data);
    setLoading(false);
  };

  // --- SEPARATION LOGIC ---
  const adminStories = stories.filter(s => s.contributors?.is_admin);
  const userStories = stories.filter(s => !s.contributors?.is_admin && (activeCampus === 'All' || s.contributors?.school === activeCampus));

  return (
    <div className="bg-[var(--wa-chat-bg)] border-b border-[var(--border)] pt-2 pb-4">
      {/* 📍 CAMPUS FILTER PILLS */}
      <div className="flex gap-2 overflow-x-auto px-5 mb-4 scrollbar-hide no-bounce">
        {CAMPUS_PILLS.map(pill => (
          <button
            key={pill}
            onClick={() => setActiveCampus(pill)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all tap 
              ${activeCampus === pill ? 'bg-[var(--wa-teal)] text-white shadow-md' : 'bg-[var(--surface)] text-gray-400 border border-[var(--border)]'}`}
          >
            {pill}
          </button>
        ))}
      </div>

      {/* 🏎️ THE RAIL */}
      <div className="flex items-start px-5 gap-4 overflow-x-auto scrollbar-hide snap-x-mandatory">
        
        {/* 👑 SUPREME ADMIN PIN (Fixed on left) */}
        <div className="flex-shrink-0 flex gap-4 border-r border-[var(--border)] pr-4">
          {adminStories.length > 0 ? adminStories.map(story => (
             <StoryCircle key={story.id} story={story} isAdmin onClick={() => setViewingStory(story)} />
          )) : (
            <div className="w-16 flex flex-col items-center gap-1 opacity-20">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xl">👑</div>
              <span className="text-[8px] font-black uppercase">Admin</span>
            </div>
          )}
        </div>

        {/* ➕ ADD STORY / VERIFY TRAP */}
        <div 
          onClick={() => window.open('https://wa.me/2347068516779?text=Verify%20me%20for%20Campus%20Stories', '_blank')}
          className="flex-shrink-0 w-16 flex flex-col items-center gap-1 cursor-pointer tap"
        >
          <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-light shadow-lg border-2 border-white">+</div>
          <span className="text-[8px] font-black uppercase text-blue-500 text-center">Add Story</span>
        </div>

        {/* 👤 USER STORIES */}
        {loading ? [1,2,3].map(i => <div key={i} className="w-14 h-14 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />) :
          userStories.map(story => (
            <StoryCircle key={story.id} story={story} onClick={() => setViewingStory(story)} />
          ))
        }
      </div>

      {/* 📺 FULLSCREEN VIEWER */}
      {viewingStory && (
        <div className="fixed inset-0 z-[1000] bg-black animate-fade-in flex flex-col">
          <div className="absolute top-0 w-full h-1.5 bg-white/20 z-[1001]">
             <div className="h-full bg-white animate-[progress_15s_linear_forwards]" />
          </div>
          
          <div className="p-6 flex justify-between items-center text-white z-50 pt-10">
            <div className="flex items-center gap-3">
              <img src={viewingStory.thumbnail_url} className="w-8 h-8 rounded-full border border-white" />
              <div>
                <p className="text-xs font-black">{viewingStory.contributors?.name}</p>
                <p className="text-[9px] opacity-60 uppercase">{viewingStory.category} • {viewingStory.contributors?.school}</p>
              </div>
            </div>
            <button onClick={() => setViewingStory(null)} className="text-3xl tap">×</button>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            <video 
              autoPlay 
              playsInline
              onEnded={() => setViewingStory(null)}
              className="w-full max-h-screen object-contain"
              src={viewingStory.cloudinary_url + '?eo_15'} // 15s Recall Enforced
            />
            <div className="absolute bottom-10 px-8 text-center">
               <p className="text-white text-sm font-bold drop-shadow-lg">{viewingStory.caption}</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  );
}

// --- SUB-COMPONENT: STORY CIRCLE ---
function StoryCircle({ story, isAdmin, onClick }: any) {
  const isSOS = story.category === 'sos';
  return (
    <div onClick={onClick} className="flex-shrink-0 w-16 flex flex-col items-center gap-1 tap snap-center">
      <div className={`w-14 h-14 rounded-full p-0.5 border-2 transition-all 
        ${isAdmin ? 'border-yellow-500 bg-gradient-to-tr from-yellow-500 to-orange-400' : 
          isSOS ? 'border-red-600 verified-pulse' : 'border-[var(--wa-teal)]'}`}>
        <img src={story.thumbnail_url} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black" loading="lazy" />
      </div>
      <span className={`text-[8px] font-black uppercase truncate w-full text-center 
        ${isAdmin ? 'text-yellow-600' : isSOS ? 'text-red-600' : 'text-gray-500'}`}>
        {isAdmin ? 'Supreme' : story.contributors?.name.split(' ')[0]}
      </span>
    </div>
  );
}
