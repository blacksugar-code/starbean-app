import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Search } from 'lucide-react';

export const CollectionDetail: React.FC = () => {
  const { rarity } = useParams<{ rarity: string }>();
  const navigate = useNavigate();
  const { user } = useStore();

  const rarityMap: Record<string, string> = {
    SSR: '典藏',
    SR: '超稀有',
    R: '稀有',
    N: '基础',
  };

  const currentRarity = rarity?.toUpperCase() || 'N';
  const displayRarity = rarityMap[currentRarity] || currentRarity;

  const filteredCards = user.collection.filter(
    (card) => card.rarity === currentRarity
  );

  // Determine grid columns and card style based on rarity
  const getLayoutConfig = (rarity: string) => {
    switch (rarity) {
      case 'SSR': 
        return {
          grid: 'grid-cols-1 px-8',
          card: 'aspect-[9/16] rounded-[2rem]',
          titleSize: 'text-2xl'
        };
      case 'SR': 
        return {
          grid: 'grid-cols-2',
          card: 'aspect-[4/5] rounded-2xl',
          titleSize: 'text-sm'
        };
      case 'R': 
        return {
          grid: 'grid-cols-3',
          card: 'aspect-[3/4] rounded-xl',
          titleSize: 'text-xs'
        };
      case 'N': 
        return {
          grid: 'grid-cols-4',
          card: 'aspect-square rounded-lg',
          titleSize: 'text-[10px]'
        };
      default: 
        return {
          grid: 'grid-cols-3',
          card: 'aspect-[3/4] rounded-xl',
          titleSize: 'text-xs'
        };
    }
  };

  const layout = getLayoutConfig(currentRarity);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black pb-safe">
       {/* Custom Header */}
      <div className="sticky top-0 z-50 bg-[#F5F5F7]/90 dark:bg-black/90 backdrop-blur-md px-4 h-14 flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{currentRarity} {displayRarity}图鉴</h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <Search className="w-6 h-6 text-slate-900 dark:text-white" />
        </button>
      </div>

      <div className={`p-4 grid ${layout.grid} gap-4`}>
        {filteredCards.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-200 dark:bg-zinc-800 rounded-full mb-4 flex items-center justify-center">
              <span className="text-2xl opacity-50">?</span>
            </div>
            <p>暂无该稀有度卡牌</p>
            <p className="text-xs mt-2 opacity-60">快去抽卡获取吧！</p>
          </div>
        ) : (
          filteredCards.map((card) => (
            <div key={card.id} className={`relative ${layout.card} overflow-hidden bg-white dark:bg-zinc-900 shadow-sm group`}>
              <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
              {/* Rarity Badge */}
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/10">
                {card.rarity}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <p className={`text-white font-bold truncate w-full ${layout.titleSize}`}>{card.name}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
