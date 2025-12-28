'use client';
import { useState } from 'react';

export default function StudioClient({ user, token }: { user: any, token: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [type, setType] = useState('news');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFile = (e: any) => {
    const f = e.target.files[0];
    if(f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleUpload = async () => {
    if(!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', caption);
    formData.append('type', type);
    formData.append('school', user.school);
    
    await fetch('/api/studio/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    setSuccess(true);
    setUploading(false);
  };

  if (success) return <div className="h-screen bg-black text-white flex items-center justify-center flex-col"><h1 className="text-2xl font-bold mb-4">UPLOADED ✅</h1><button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 rounded font-bold">AGAIN</button></div>;

  return (
    <div className="h-screen bg-zinc-900 text-white p-6 space-y-6">
       <div className="flex justify-between items-center border-b border-zinc-700 pb-4">
         <h1 className="font-black">STUDIO</h1>
         <span className="text-xs bg-zinc-800 px-2 py-1 rounded">{user.school}</span>
       </div>
       
       <div className="grid grid-cols-3 gap-2">
          {['news', 'sos', 'market'].map(t => <button key={t} onClick={() => setType(t)} className={`p-2 text-xs font-bold uppercase rounded ${type===t ? 'bg-white text-black' : 'bg-zinc-800'}`}>{t}</button>)}
       </div>

       <div className="aspect-[9/16] bg-black border-2 border-dashed border-zinc-700 flex items-center justify-center relative rounded-xl overflow-hidden">
          {preview ? (file?.type.startsWith('video') ? <video src={preview} autoPlay muted loop className="w-full h-full object-cover"/> : <img src={preview} className="w-full h-full object-cover"/>) : <span className="text-4xl">📷</span>}
          <input type="file" onChange={handleFile} accept="image/*,video/*" className="absolute inset-0 opacity-0"/>
       </div>

       <textarea value={caption} onChange={e=>setCaption(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-xl text-sm" placeholder="Caption..."/>
       
       <button disabled={!file || uploading} onClick={handleUpload} className="w-full bg-green-500 text-black py-4 rounded-xl font-black uppercase">{uploading ? 'UPLOADING...' : 'PUBLISH'}</button>
    </div>
  );
}
