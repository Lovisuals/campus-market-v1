"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function StoriesRail({ activeCampus, setActiveCampus }: any) {
  const supabase = createClient();
  const [stories, setStories] = useState<any[]>([]);
  const [viewingStory, setViewingStory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Admin Post States
  const [showPostModal, setShowPostModal] = useState(false);
  const [newVideo, setNewVideo] = useState({ url: '', caption: '', category: 'general' });

  const CAMPUS_PILLS = ['All', 'UNILAG', 'LASU', 'YABATECH', 'TASUED', 'OOU', 'UI', 'OAU', 'UNN'];

  useEffect(() => {
    fetchStories();
    checkAdminStatus();
    
    const channel = supabase.channel('realtime_stories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, fetchStories)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [activeCampus]);

  const checkAdminStatus = async () => {
    const phone = localStorage.getItem('user_phone');
    if (phone) {
      const { data } = await supabase.from('contributors').select('is_admin').eq('phone', phone).maybeSingle();
      if (data?.is_admin) setIsAdmin(true);
    }
  };

  const fetchStories = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*, contributors!inner(name, school, is_admin, phone)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) setStories(data);
    setLoading(false);
  };

  const handleSovereignPost = async () => {
    if (!newVideo.url) return alert("Enter Cloudinary URL");
    const phone = localStorage.getItem('user_phone');
    
    const { error } = await supabase.from('videos').insert([{
      contributor_phone: phone,
      cloudinary_url: newVideo.url,
      thumbnail_url: newVideo.url.replace(/\.[^/.]+$/, ".jpg"),
      caption: newVideo.caption,
      category: newVideo.category,
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 Hour Expiry
    }]);

    if (!error) {
      setShowPostModal(false);
      setNewVideo({ url: '', caption: '', category: 'general' });
      fetchStories();
    }
  };

  const adminStories = stories.filter(s => s.contributors?.is_admin);
  const userStories = stories.filter(s => !s.contributors?.is_admin && (activeCampus === 'All' || s.contributors?.school === activeCampus));

  return (
    <div className="bg-[var(--wa-chat-bg)] border-b border-[var(--border)] pt-2 pb-4">
      {/* 📍 CAMPUS FILTERS */}
      <div className="flex gap-2 overflow-x-auto px-5 mb-4 scrollbar-hide no-bounce">
        {CAMPUS_PILLS.map(pill => (
          <button key={pill} onClick={() => setActiveCampus(pill)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all tap 
              ${activeCampus === pill ? 'bg-[var(--wa-teal)] text-white shadow-md' : 'bg-[var(--surface)] text-gray-400 border border-[var(--border)]'}`}>
            {pill}
          </button>
        ))}
      </div>

      <div className="flex items-start px-5 gap-4 overflow-x-auto scrollbar-hide snap-x-mandatory">
        {/* 👑 SUPREME ADMIN PIN */}
        <div className="flex-shrink-0 flex gap-4 border-r border-[var(--border)] pr-4">
          {adminStories.length > 0 ? adminStories.map(story => (
             <StoryCircle key={story.id} story={story} isAdmin onClick={() => setViewingStory(story)} />
          )) : (
            <div className="w-16 flex flex-col items-center gap-1 opacity-20"><div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xl">👑</div></div>
          )}
        </div>

        {/* ➕ DYNAMIC PORTAL */}
        <div onClick={() => isAdmin ? setShowPostModal(true) : window.open('https://wa.me/2347068516779?text=Start%20video%20updates', '_blank')}
          className="flex-shrink-0 w-16 flex flex-col items-center gap-1 cursor-pointer tap">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white transition-all
            ${isAdmin ? 'bg-yellow-500 scale-110 shadow-yellow-500/40' : 'bg-blue-600'}`}>
            {isAdmin ? '👑' : '+'}
          </div>
          <span className={`text-[8px] font-black uppercase text-center ${isAdmin ? 'text-yellow-600' : 'text-blue-600'}`}>
            {isAdmin ? 'Post Elite' : 'Add Story'}
          </span>
        </div>

        {/* 👤 USER STORIES */}
        {loading ? <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" /> :
          userStories.map(story => <StoryCircle key={story.id} story={story} onClick={() => setViewingStory(story)} />)
        }
      </div>

      {/* 👑 ADMIN POST MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-[var(--surface)] w-full max-w-sm rounded-[32px] p-8 border border-[var(--border)] shadow-2xl animate-scale-up">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2">👑 SUPREME UPLOAD</h2>
            <input type="text" placeholder="Cloudinary Video URL" className="w-full bg-[var(--wa-chat-bg)] border border-[var(--border)] p-4 rounded-2xl text-xs mb-4 outline-none focus:border-yellow-500" onChange={(e) => setNewVideo({...newVideo, url: e.target.value})} />
            <input type="text" placeholder="Caption..." className="w-full bg-[var(--wa-chat-bg)] border border-[var(--border)] p-4 rounded-2xl text-xs mb-6 outline-none" onChange={(e) => setNewVideo({...newVideo, caption: e.target.value})} />
            <div className="flex gap-2 mb-6">
              {['news', 'sos', 'market'].map(c => (
                <button key={c} onClick={() => setNewVideo({...newVideo, category: c})} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border ${newVideo.category === c ? 'bg-yellow-500 border-yellow-600' : 'opacity-40'}`}>{c}</button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowPostModal(false)} className="flex-1 text-xs font-bold opacity-50">Cancel</button>
              <button onClick={handleSovereignPost} className="flex-[2] py-4 bg-yellow-500 text-black rounded-2xl text-xs font-black shadow-lg shadow-yellow-500/20">POST NOW</button>
            </div>
          </div>
        </div>
      )}

      {/* 📺 VIEWER */}
      {viewingStory && (
        <div className="fixed inset-0 z-[1000] bg-black animate-fade-in flex flex-col">
          <div className="absolute top-0 w-full h-1 bg-white/20 z-[1001]"><div className="h-full bg-white progress-bar" /></div>
          <div className="p-6 flex justify-between items-center text-white z-50 pt-10">
            <div className="flex items-center gap-3">
              <img src={viewingStory.thumbnail_url} className="w-8 h-8 rounded-full border border-white" />
              <p className="text-xs font-black">{viewingStory.contributors?.name}</p>
            </div>
            <button onClick={() => setViewingStory(null)} className="text-4xl font-light">×</button>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <video autoPlay playsInline onEnded={() => setViewingStory(null)} className="w-full max-h-[85vh] object-contain" src={viewingStory.cloudinary_url + '?eo_15'} />
            <div className="absolute bottom-10 px-8 text-center bg-black/60 py-3 rounded-2xl backdrop-blur-md mx-4"><p className="text-white text-sm font-bold">{viewingStory.caption}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

function StoryCircle({ story, isAdmin, onClick }: any) {
  const isSOS = story.category === 'sos';
  return (
    <div onClick={onClick} className="flex-shrink-0 w-16 flex flex-col items-center gap-1 tap snap-center">
      <div className={`w-14 h-14 rounded-full p-0.5 border-2 ${isAdmin ? 'border-yellow-500 bg-gradient-to-tr from-yellow-500 to-orange-400' : isSOS ? 'border-red-600 verified-pulse' : 'border-[var(--wa-teal)]'}`}>
        <img src={story.thumbnail_url} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black" />
      </div>
      <span className={`text-[8px] font-black uppercase truncate w-full text-center ${isAdmin ? 'text-yellow-600' : isSOS ? 'text-red-600' : 'text-gray-500'}`}>
        {isAdmin ? 'Supreme' : story.contributors?.name.split(' ')[0]}
      </span>
    </div>
  );
}