import { resolveAssetUrl } from '../services/api';
import React from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, Search, Plus, ChevronRight, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

// Mock Master Data for Albums
const ALBUM_CARDS_DB: Record<string, Array<{ id: string; name: string; rarity: 'SSR' | 'SR' | 'R' | 'N'; imageUrl: string }>> = {
  '星光初舞台': [
    { id: 's1_ssr1', name: '璀璨星芒·01', rarity: 'SSR', imageUrl: 'https://picsum.photos/seed/s1_ssr1/400/600' },
    { id: 's1_ssr2', name: '璀璨星芒·02', rarity: 'SSR', imageUrl: 'https://picsum.photos/seed/s1_ssr2/400/600' },
    { id: 's1_sr1', name: '练习室·01', rarity: 'SR', imageUrl: 'https://picsum.photos/seed/s1_sr1/400/500' },
    { id: 's1_sr2', name: '练习室·02', rarity: 'SR', imageUrl: 'https://picsum.photos/seed/s1_sr2/400/500' },
    { id: 's1_sr3', name: '练习室·03', rarity: 'SR', imageUrl: 'https://picsum.photos/seed/s1_sr3/400/500' },
    { id: 's1_r1', name: '日常·01', rarity: 'R', imageUrl: 'https://picsum.photos/seed/s1_r1/300/400' },
    { id: 's1_r2', name: '日常·02', rarity: 'R', imageUrl: 'https://picsum.photos/seed/s1_r2/300/400' },
    { id: 's1_r3', name: '日常·03', rarity: 'R', imageUrl: 'https://picsum.photos/seed/s1_r3/300/400' },
    { id: 's1_r4', name: '日常·04', rarity: 'R', imageUrl: 'https://picsum.photos/seed/s1_r4/300/400' },
    { id: 's1_n1', name: '花絮·01', rarity: 'N', imageUrl: 'https://picsum.photos/seed/s1_n1/200/200' },
    { id: 's1_n2', name: '花絮·02', rarity: 'N', imageUrl: 'https://picsum.photos/seed/s1_n2/200/200' },
  ],
  '城市之光': [
    { id: 's2_sr1', name: '霓虹·01', rarity: 'SR', imageUrl: 'https://picsum.photos/seed/s2_sr1/400/500' },
    { id: 's2_sr2', name: '霓虹·02', rarity: 'SR', imageUrl: 'https://picsum.photos/seed/s2_sr2/400/500' },
    { id: 's2_r1', name: '街角·01', rarity: 'R', imageUrl: 'https://picsum.photos/seed/s2_r1/300/400' },
    { id: 's2_r2', name: '街角·02', rarity: 'R', imageUrl: 'https://picsum.photos/seed/s2_r2/300/400' },
  ],
  // Fallback for others
};

export const CollectionAlbumDetail: React.FC = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const { seriesId } = useParams<{ seriesId: string }>();

  // Decode seriesId if needed (e.g. if it contains spaces or special chars)
  const currentSeries = seriesId ? decodeURIComponent(seriesId) : '';

  const sections = [
    { id: 'SSR', label: 'SSR', title: 'DIAMOND COLLECTION', type: 'horizontal', badgeColor: 'text-purple-600 bg-white shadow-sm' },
    { id: 'SR', label: 'SR', title: 'RARE SERIES', type: 'grid-2', badgeColor: 'text-purple-500 bg-white shadow-sm' },
    { id: 'R', label: 'R', title: 'CLASSIC', type: 'grid-3', badgeColor: 'text-blue-500 bg-white shadow-sm' },
    { id: 'N', label: 'N', title: 'BASE', type: 'grid-4', badgeColor: 'text-slate-400 bg-white shadow-sm' },
  ];

  // Get all possible cards for this series from DB
  let allSeriesCards = ALBUM_CARDS_DB[currentSeries] || [];

  // Fallback generator if no specific data exists for this series
  if (allSeriesCards.length === 0 && currentSeries) {
    allSeriesCards = [
      { id: `gen_${currentSeries}_1`, name: `${currentSeries}·01`, rarity: 'SR', imageUrl: `https://picsum.photos/seed/${currentSeries}1/400/500` },
      { id: `gen_${currentSeries}_2`, name: `${currentSeries}·02`, rarity: 'SR', imageUrl: `https://picsum.photos/seed/${currentSeries}2/400/500` },
      { id: `gen_${currentSeries}_3`, name: `${currentSeries}·03`, rarity: 'R', imageUrl: `https://picsum.photos/seed/${currentSeries}3/300/400` },
      { id: `gen_${currentSeries}_4`, name: `${currentSeries}·04`, rarity: 'R', imageUrl: `https://picsum.photos/seed/${currentSeries}4/300/400` },
      { id: `gen_${currentSeries}_5`, name: `${currentSeries}·05`, rarity: 'N', imageUrl: `https://picsum.photos/seed/${currentSeries}5/200/200` },
    ] as any;
  }

  // Helper to check ownership
  const isOwned = (cardId: string) => user.collection.some(c => c.id === cardId || c.name === cardId); // Simplified check

  // If no DB entry, maybe generate some placeholders or show empty?
  // For demo, let's generate placeholders if empty
  const getDisplayCards = (rarity: string) => {
    const dbCards = allSeriesCards.filter(c => c.rarity === rarity);
    if (dbCards.length > 0) return dbCards;
    
    // Fallback: if we don't have DB data but have user cards, show them
    const userCards = user.collection.filter(c => c.rarity === rarity && c.series === currentSeries);
    if (userCards.length > 0) return userCards.map(c => ({ ...c, isOwned: true }));

    return [];
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black pb-safe">
      {/* Custom Header */}
      <div className="sticky top-0 z-50 bg-[#F5F5F7]/90 dark:bg-black/90 backdrop-blur-md px-4 h-14 flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{currentSeries || '全部合集'}</h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <Search className="w-6 h-6 text-slate-900 dark:text-white" />
        </button>
      </div>

      <div className="space-y-8 pt-4 pb-8">
        {sections.map((section) => {
          const cards = getDisplayCards(section.id);
          
          if (cards.length === 0) return null;

          return (
            <div key={section.id} className="space-y-4">
              {/* Section Header */}
              <div 
                className="px-4 flex items-center gap-4 group/header"
              >
                <div className={`px-4 py-1 rounded-full ${section.badgeColor} flex items-center justify-center shrink-0 border border-slate-100 dark:border-zinc-800`}>
                  <span className="text-lg font-bold italic font-serif">{section.label}</span>
                </div>
                <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800"></div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase shrink-0 font-sans">
                  {section.title}
                </span>
              </div>

              {/* Content */}
              {section.type === 'horizontal' && (
                <div className="flex overflow-x-auto snap-x gap-4 px-4 pb-4 no-scrollbar">
                  {cards.map((card) => {
                    const owned = isOwned(card.id);
                    return (
                      <div key={card.id} className="snap-center shrink-0 w-[85vw] aspect-[9/16] relative rounded-[2rem] overflow-hidden shadow-xl bg-white dark:bg-zinc-900 group">
                        <img 
                          src={resolveAssetUrl(card.imageUrl)} 
                          className={`w-full h-full object-cover transition-all duration-500 ${!owned ? 'grayscale opacity-60 blur-[2px]' : ''}`} 
                          alt={card.name} 
                        />
                        {!owned && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                              <Lock className="w-8 h-8 text-white/80" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
                          <h3 className="text-3xl font-bold text-white mb-2 font-serif tracking-wide">{card.name}</h3>
                          <p className="text-white/70 text-xs tracking-widest uppercase">Diamond Collection Limited</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {section.type === 'grid-2' && (
                <div className="grid grid-cols-2 gap-4 px-4">
                   {cards.map((card) => {
                     const owned = isOwned(card.id);
                     return (
                       <div key={card.id} className="aspect-[4/5] rounded-2xl overflow-hidden shadow-md bg-white dark:bg-zinc-900 relative group">
                          <img 
                            src={resolveAssetUrl(card.imageUrl)} 
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!owned ? 'grayscale opacity-60' : ''}`} 
                            alt={card.name} 
                          />
                          {!owned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                              <Lock className="w-8 h-8 text-white/80 drop-shadow-lg" />
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
              )}

              {section.type === 'grid-3' && (
                <div className="grid grid-cols-3 gap-3 px-4">
                   {cards.map((card) => {
                     const owned = isOwned(card.id);
                     return (
                       <div key={card.id} className="aspect-[3/4] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900 relative group">
                          <img 
                            src={resolveAssetUrl(card.imageUrl)} 
                            className={`w-full h-full object-cover transition-all duration-300 ${!owned ? 'grayscale opacity-50' : ''}`} 
                            alt={card.name} 
                          />
                          {!owned && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-6 h-6 text-slate-800/50 dark:text-white/50" />
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
              )}

              {section.type === 'grid-4' && (
                <div className="grid grid-cols-4 gap-3 px-4">
                   {cards.map((card) => {
                     const owned = isOwned(card.id);
                     return (
                       <div key={card.id} className="aspect-square rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900 relative p-2 flex items-center justify-center group hover:shadow-md transition-all">
                          <img 
                            src={resolveAssetUrl(card.imageUrl)} 
                            className={`w-full h-full object-cover rounded-lg transition-opacity ${!owned ? 'grayscale opacity-30' : 'opacity-100'}`} 
                            alt={card.name} 
                          />
                          {!owned && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Empty State (if no cards found in DB or user collection) */}
        {sections.every(section => getDisplayCards(section.id).length === 0) && (
           <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-16 h-16 bg-slate-200 dark:bg-zinc-800 rounded-full mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 opacity-50" />
              </div>
              <p>该合集暂无卡牌数据</p>
           </div>
        )}
      </div>
    </div>
  );
};
