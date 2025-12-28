'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const CAMPUSES = [
  { id: 'All', name: 'All' },
  { id: 'UNILAG', name: 'UNILAG' },
  { id: 'LASU', name: 'LASU' },
  { id: 'YABATECH', name: 'YABATECH' },
  { id: 'OOU', name: 'OOU' },
  { id: 'UI', name: 'UI' },
  { id: 'UNIBEN', name: 'UNIBEN' },
  { id: 'OAU', name: 'OAU' },
  { id: 'FUTA', name: 'FUTA' },
  { id: 'UNN', name: 'UNN' },
];

export default function StoriesRail({ activeCampus, setActiveCampus }: { activeCampus: string, setActiveCampus: (c: string) => void }) {
  const supabase = createClient();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingStory, setViewingStory] = useState<any | null>(null);
  
  // ADMIN LINK (The "Trap" for new contributors)
  const BECOME_CONTRIBUTOR_LINK = "https://wa.me/2347068516779?text=I%20want%20to%20post%20video%20updates%20on%20Campus%20Market";

  // 1. FETCH & SUBSCRIBE
  useEffect(() => {
    fetchStories();

    // Realtime: Listen for new videos instantly
    const channel = supabase.channel('public:videos')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'videos' }, (payload) => {
        // Only add if it belongs to current filter
        if (activeCampus === 'All' || payload.new.school === activeCampus) {
           setStories(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeCampus]);

  const fetchStories = async () => {
    setLoading(true);
    const now = new Date().toISOString();

    // Query: Get videos that have NOT expired yet
    let query = supabase
      .from('videos')
      .select('*')
      .gt('expires_at', now) // ⚡ The Flash Logic (Only valid videos)
      .order('created_at', { ascending: false });

    if (activeCampus !== 'All') {
      query = query.eq('school', activeCampus);
    }

    const { data } = await query;
    if (data) setStories(data);
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
      
      {/* 1. FILTER PILLS (The Micro-Community Switch) */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide border-b border-gray-50 dark:border-gray-900">
        {CAMPUSES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCampus(c.name)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${
              activeCampus === c.name 
                ? 'bg-black text-white dark:bg-white dark:text-black' 
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* 2. THE STORY RAIL (The "Status" UI) */}
      <div className="flex gap-4 overflow-x-auto px-4 py-4 scrollbar-hide snap-x items-start">
        
        {/* ➕ ADD BUTTON (The Trap) */}
        <div 
          onClick={() => window.open(BECOME_CONTRIBUTOR_LINK, '_blank')}
          className="flex flex-col items-center gap-1 flex-shrink-0 snap-start cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center relative bg-gray-50 dark:bg-gray-900 group-hover:bg-gray-100 transition-colors">
            <span className="text-xl">📹</span>
            <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-[12px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold shadow-sm">+</div>
          </div>
          <span className="text-[9px] font-bold text-gray-400">Add Story</span>
        </div>

        {/* 📹 LIVE STORIES */}
        {loading ? (
           // Skeleton Loader
           [1,2,3].map(i => <div key={i} className="w-16 h-16 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />)
        ) : (
          stories.map((story) => (
            <div 
              key={story.id} 
              onClick={() => setViewingStory(story)}
              className="flex flex-col items-center gap-1 flex-shrink-0 snap-start cursor-pointer"
            >
              {/* The "Unwatched" Ring (Green) */}
              <div className={`w-16 h-16 rounded-full p-[2px] ring-2 ${story.type === 'sos' ? 'ring-red-500 animate-pulse' : 'ring-green-500'}`}>
                <img 
                  src={story.thumbnail_url} 
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black bg-gray-200"
                  alt="Story"
                />
              </div>
              <span className="text-[9px] font-bold text-black dark:text-white max-w-[60px] truncate">{story.school}</span>
            </div>
          ))
        )}
      </div>

      {/* 3. FULL SCREEN VIEWER (The Immersive Mode) */}
      {viewingStory && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
          
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex gap-2 items-center">
              <div className="w-8 h-8 rounded-full bg-gray-500 overflow-hidden">
                <img src={viewingStory.thumbnail_url} className="w-full h-full object-cover" />
              </div>
              <div>
                 <p className="text-white text-xs font-bold">{viewingStory.school} TV</p>
                 <p className="text-gray-300 text-[9px]">{new Date(viewingStory.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
            <button onClick={() => setViewingStory(null)} className="text-white text-3xl opacity-80 hover:opacity-100">×</button>
          </div>

          {/* Video Player */}
          <div className="flex-1 flex items-center justify-center relative">
            <video 
              src={viewingStory.playback_url} 
              autoPlay 
              playsInline 
              className="max-w-full max-h-full object-contain"
              onEnded={() => setViewingStory(null)} // Close when done
            />
          </div>

          {/* Footer / Caption */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent z-20">
             {viewingStory.type === 'sos' && <span className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-black rounded mb-2 inline-block">SOS ALERT</span>}
             <p className="text-white font-medium text-sm">{viewingStory.caption}</p>
             <div className="mt-4 flex gap-4 text-white/50 text-xs font-bold">
                <span>👁️ {viewingStory.views || 1} Views</span>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
