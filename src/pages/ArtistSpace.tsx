import { resolveAssetUrl } from '../services/api';
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share2, Plus, Camera } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Header } from '../components/Header';

export const ArtistSpace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // Mock data
  const artist = {
    id,
    name: 'StarBean Artist',
    avatar: 'https://picsum.photos/seed/artist/200',
    fans: '1.2M',
    templates: 156,
    gachas: '8.2k',
    rank: 24,
  };

  const templates = [
    { id: '1', title: 'Spring Bloom', count: '2.4k', image: 'https://picsum.photos/seed/spring/400' },
    { id: '2', title: 'Crystal Clear', count: '950', image: 'https://picsum.photos/seed/crystal/400' },
    { id: '3', title: 'Dream Garden', count: '1.2k', image: 'https://picsum.photos/seed/garden/400' },
    { id: '4', title: 'Sunset Vibes', count: '3.1k', image: 'https://picsum.photos/seed/sunset/400' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      <Header title="Artist Space" showMore />

      {/* Hero */}
      <div className="relative w-full h-64 overflow-hidden">
        <img src="https://picsum.photos/seed/artist_bg/800/400" alt="Background" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-zinc-950 via-transparent to-transparent opacity-80"></div>
      </div>

      {/* Info Bar */}
      <div className="sticky top-14 z-30 w-full bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800 -mt-12">
        <div className="flex items-center overflow-x-auto scrollbar-hide py-3 px-4 gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-pink-100 border border-white overflow-hidden shadow-sm">
              <img src={resolveAssetUrl(artist.avatar)} alt={artist.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none text-slate-900 dark:text-white">{artist.name}</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{artist.fans} Fans</p>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-zinc-700 shrink-0 mx-1"></div>
          <button className="shrink-0 flex items-center justify-center rounded-full h-8 px-5 bg-pink-500 text-white text-xs font-bold tracking-wide shadow-sm active:scale-95 transition-transform">
            <Plus className="w-3 h-3 mr-1" />
            Follow
          </button>
          <div className="flex gap-4 shrink-0 text-[11px] font-medium text-slate-600 dark:text-slate-300 ml-auto">
            <div className="flex flex-col items-center">
              <span className="text-slate-900 dark:text-white font-bold">{artist.templates}</span>
              <span className="text-slate-500 dark:text-slate-400">Templates</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-900 dark:text-white font-bold">{artist.gachas}</span>
              <span className="text-slate-500 dark:text-slate-400">Gachas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between px-1 pb-4">
          <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Template Series</h3>
          <button className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
            View All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((template) => (
            <Link key={template.id} to={`/template/${template.id}`} className="group relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm">
              <div className="aspect-square relative">
                <img src={template.image} alt={template.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="p-2">
                <p className="font-bold text-[11px] truncate text-slate-900 dark:text-white">{template.title}</p>
                <p className="text-[9px] text-slate-400 mt-1">{template.count} Gachas</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
