"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Contributor = {
  name?: string;
  is_admin?: boolean;
  school?: string;
};

type Story = {
  id: string;
  cloudinary_url?: string;
  thumbnail_url?: string;
  caption?: string;
  category?: string;
  campus?: string;
  is_admin?: boolean;
  contributors?: Contributor;
  created_at?: string;
  is_elite?: boolean;
};

export default function StoriesRail({ activeCampus, setActiveCampus }: { activeCampus: string; setActiveCampus: (c: string) => void; }) {
  const supabase = createClient();
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showPostModal, setShowPostModal] = useState(false);
  const [newVideo, setNewVideo] = useState({ url: '', caption: '', category: 'general' });

  const CAMPUS_PILLS = ['All', 'UNILAG', 'LASU', 'YABATECH', 'TASUED', 'OOU', 'UI', 'OAU', 'UNN'];

  useEffect(() => {
    fetchStories();
    checkAdminStatus();
    
    const channel = supabase.channel('realtime_stories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => fetchStories())
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [activeCampus]);

  const checkAdminStatus = async () => {
    try {
      const phone = typeof window !== 'undefined' ? localStorage.getItem('user_phone') : null;
      if (!phone) return;
      const { data, error } = await supabase.from('contributors').select('is_admin').eq('phone', phone).maybeSingle();
      if (!error && data?.is_admin) setIsAdmin(true);
    } catch (e) {
      console.error('checkAdminStatus error', e);
    }
  };

  const fetchStories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*, contributors(name, is_admin, school)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('fetchStories SQL error', error);
        setLoading(false);
        return;
      }

      if (data && Array.isArray(data)) {
        const processedStories = data.map((s: any) => ({
          ...(s as Story),
          is_elite: s.is_admin === true || s.contributors?.is_admin === true,
        }));
        setStories(processedStories as Story[]);
      }
    } catch (e) {
      console.error('fetchStories error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSovereignPost = async () => {
    if (!newVideo.url) return alert('Enter Cloudinary URL');
    try {
      const phone = typeof window !== 'undefined' ? localStorage.getItem('user_phone') || '2348083000771' : '2348083000771';
      const { error } = await supabase.from('videos').insert([{
        contributor_phone: phone,
        cloudinary_url: newVideo.url,
        thumbnail_url: newVideo.url.replace(/\.[^/.]+$/, '.jpg'),
        caption: newVideo.caption,
        category: newVideo.category,
        is_admin: true,
        campus: activeCampus === 'All' ? 'GLOBAL' : activeCampus,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }]);

      if (!error) {
        setShowPostModal(false);
        setNewVideo({ url: '', caption: '', category: 'general' });
        fetchStories();
      } else {
        console.error('handleSovereignPost error', error);
      }
    } catch (e) {
      console.error('handleSovereignPost exception', e);
    }
  };

  // 🔍 FILTERING LOGIC USING is_elite
  const eliteStories = stories.filter(s => s.is_elite);
  const userStories = stories.filter(s => 
    !s.is_elite && 
    (activeCampus === 'All' || s.campus === activeCampus || s.contributors?.school === activeCampus)
  );

  return (
    <div className="bg-[var(--wa-chat-bg)] border-b border-[var(--border)] pt-2 pb-4">
      {/* Campus Filters */}
      <div className="flex gap-2 overflow-x-auto px-5 mb-4 scrollbar-hide no-bounce">
        {CAMPUS_PILLS.map(pill => (
          <button 
            key={pill} 
            onClick={() => setActiveCampus(pill)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all tap 
              ${activeCampus === pill 
                ? 'bg-[var(--wa-teal)] text-white shadow-md' 
                : 'bg-[var(--surface)] text-gray-400 border border-[var(--border)]'
              }`}
          >
            {pill}
          </button>
        ))}
      </div>

      <div className="flex items-start px-5 gap-4 overflow-x-auto scrollbar-hide snap-x-mandatory">
        {/* Supreme Admin Pin - Always Visible */}
        <div className="flex-shrink-0 flex items-center gap-4 border-r border-[var(--border)] pr-4 min-w-[80px]">
          {eliteStories.length > 0 ? (
            eliteStories.map(story => (
              <StoryCircle 
                key={story.id} 
                story={story} 
                isAdmin 
                onClick={() => setViewingStory(story)} 
              />
            ))
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-50 group cursor-default">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-yellow-600/40 flex items-center justify-center bg-yellow-500/10 backdrop-blur-sm">
                <span className="text-2xl group-hover:scale-110 transition-transform"></span>
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest text-yellow-700">
                No Updates
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Portal */}
        <div 
          onClick={() => isAdmin 
            ? setShowPostModal(true) 
            : window.open('https://wa.me/2347068516779?text=Start%20video%20updates', '_blank')
          }
          className="flex-shrink-0 w-16 flex flex-col items-center gap-1 cursor-pointer tap"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white transition-all
            ${isAdmin ? 'bg-yellow-500 scale-110 shadow-yellow-500/40' : 'bg-blue-600'}`}
          >
            {isAdmin ? '' : '+'}
          </div>
          <span className={`text-[8px] font-black uppercase text-center ${isAdmin ? 'text-yellow-600' : 'text-blue-600'}`}>
            {isAdmin ? 'Post Elite' : 'Add Story'}
          </span>
        </div>

        {/* User Stories */}
        {loading ? (
          <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
        ) : (
          userStories.map(story => (
            <StoryCircle 
              key={story.id} 
              story={story} 
              onClick={() => setViewingStory(story)} 
            />
          ))
        )}
      </div>

      {/* Admin Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-[var(--surface)] w-full max-w-sm rounded-[32px] p-8 border border-[var(--border)] shadow-2xl animate-scale-up">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2">SUPREME UPLOAD</h2>
            <input 
              type="text" 
              placeholder="Cloudinary Video URL" 
              className="w-full bg-[var(--wa-chat-bg)] border border-[var(--border)] p-4 rounded-2xl text-xs mb-4 outline-none focus:border-yellow-500 text-white" 
              onChange={(e) => setNewVideo({...newVideo, url: e.target.value})} 
            />
            <input 
              type="text" 
              placeholder="Caption..." 
              className="w-full bg-[var(--wa-chat-bg)] border border-[var(--border)] p-4 rounded-2xl text-xs mb-6 outline-none text-white" 
              onChange={(e) => setNewVideo({...newVideo, caption: e.target.value})} 
            />
            <div className="flex gap-2 mb-6">
              {['news', 'sos', 'market'].map(c => (
                <button 
                  key={c} 
                  onClick={() => setNewVideo({...newVideo, category: c})} 
                  className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border transition-all 
                    ${newVideo.category === c 
                      ? 'bg-yellow-500 border-yellow-600 text-black' 
                      : 'opacity-40 text-white'
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowPostModal(false)} 
                className="flex-1 text-xs font-bold opacity-50 text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleSovereignPost} 
                className="flex-[2] py-4 bg-yellow-500 text-black rounded-2xl text-xs font-black shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform"
              >
                POST NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer */}
      {viewingStory && (
        <div className="fixed inset-0 z-[1000] bg-black animate-fade-in flex flex-col">
          <div className="absolute top-0 w-full h-1 bg-white/20 z-[1001]">
            <div className="h-full bg-white progress-bar" />
          </div>
          <div className="p-6 flex justify-between items-center text-white z-50 pt-10">
            <div className="flex items-center gap-3">
              <img 
                src={viewingStory.thumbnail_url} 
                className="w-8 h-8 rounded-full border border-white object-cover" 
                alt="profile"
              />
              <p className="text-xs font-black">
                {viewingStory.contributors?.name || 'Sovereign Admin'}
              </p>
            </div>
            <button 
              onClick={() => setViewingStory(null)} 
              className="text-4xl font-light leading-none"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <video 
              autoPlay 
              playsInline 
              onEnded={() => setViewingStory(null)} 
              className="w-full max-h-[85vh] object-contain" 
              src={viewingStory.cloudinary_url} 
            />
            <div className="absolute bottom-10 px-8 w-full">
              <div className="bg-black/60 py-4 px-6 rounded-2xl backdrop-blur-md text-center">
                <p className="text-white text-sm font-bold leading-relaxed">
                  {viewingStory.caption}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StoryCircle({ story, isAdmin = false, onClick }: any) {
  const isSOS = story.category === 'sos';
  
  return (
    <div 
      onClick={onClick} 
      className="flex-shrink-0 w-16 flex flex-col items-center gap-1 tap snap-center cursor-pointer"
    >
      <div className={`w-14 h-14 rounded-full p-0.5 border-2 
        ${isAdmin 
          ? 'border-yellow-500 bg-gradient-to-tr from-yellow-500 to-orange-400' 
          : isSOS 
            ? 'border-red-600 verified-pulse' 
            : 'border-[var(--wa-teal)]'
        }`}
      >
        <img 
          src={story.thumbnail_url} 
          className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black" 
          alt="story thumb" 
        />
      </div>
      <span className={`text-[8px] font-black uppercase truncate w-full text-center 
        ${isAdmin 
          ? 'text-yellow-600' 
          : isSOS 
            ? 'text-red-600' 
            : 'text-gray-500'
        }`}
      >
        {isAdmin 
          ? 'Supreme' 
          : (story.contributors?.name?.split(' ')[0] || 'Member')
        }
      </span>
    </div>
  );
}