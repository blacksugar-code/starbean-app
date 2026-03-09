import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Star, ChevronRight, Info, Sparkles, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import * as api from '../services/api';
import { resolveAssetUrl } from '../services/api';

export const TemplateDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useStore();
  const [template, setTemplate] = useState<api.TemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 从后端获取模板详情
   */
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.getTemplate(id);
        setTemplate(data);
      } catch (err) {
        console.error('获取模板详情失败:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  const handleDraw = () => {
    if (!user.digitalAvatarGenerated) {
      navigate('/login'); 
      return;
    }
    navigate(`/gacha/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <p className="text-slate-400">模板不存在</p>
        <button onClick={() => navigate(-1)} className="text-pink-500 text-sm underline">返回</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-32">
      {/* Hero Image - 使用 detail_image 或 cover_image */}
      <div className="relative w-full h-[60vh]">
        {(template.detail_image || template.cover_image) ? (
          <img src={resolveAssetUrl(template.detail_image || template.cover_image)} alt={template.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-400/30 to-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-20 h-20 text-pink-300/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-slate-50 dark:to-zinc-950"></div>
        
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white z-10 pt-safe">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/30 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/30 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-10 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-pink-500 rounded text-[10px] font-bold">官方授权</span>
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold border border-white/30">{template.artist_name}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{template.title}</h1>
          <p className="text-sm text-white/80 line-clamp-2">{template.description}</p>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        {/* Artist Ref Images - 艺人参考图预览 */}
        {template.artist_ref_images && template.artist_ref_images.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-lg border border-slate-100 dark:border-zinc-800 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-pink-500 fill-pink-500" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">艺人形象</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {template.artist_ref_images.map((img, i) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-zinc-800">
                  <img src={img} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rarity Rates */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-base text-slate-800 dark:text-white">概率公示</h3>
            <Info className="w-3 h-3 text-slate-400" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { r: 'N', p: template.rarity_rates?.N || '-', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-zinc-800' },
              { r: 'R', p: template.rarity_rates?.R || '-', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
              { r: 'SR', p: template.rarity_rates?.SR || '-', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
              { r: 'SSR', p: template.rarity_rates?.SSR || '-', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
            ].map((item) => (
              <div key={item.r} className={`${item.bg} rounded-xl p-2 flex flex-col items-center justify-center border border-transparent dark:border-white/5`}>
                <span className={`text-lg font-black italic ${item.color}`}>{item.r}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{item.p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Pool Preview */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-base text-slate-800 dark:text-white">卡池预览</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg bg-slate-200 dark:bg-zinc-800 overflow-hidden relative group">
                <img src={`https://picsum.photos/seed/card_${id}_${i}/300/400`} alt="Card" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                {i === 0 && <span className="absolute top-1 right-1 bg-yellow-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">SSR</span>}
                {i === 1 && <span className="absolute top-1 right-1 bg-purple-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">SR</span>}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar - 使用后端价格 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-zinc-800 p-4 pb-safe z-50">
        <div className="max-w-md mx-auto flex gap-3">
          <button 
            onClick={() => handleDraw()}
            className="flex-1 h-12 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex flex-col items-center justify-center active:scale-95 transition-transform hover:bg-slate-50 dark:hover:bg-zinc-700"
          >
            <div className="flex items-center gap-1 text-slate-800 dark:text-white font-bold text-sm">
              <Star className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
              <span>{template.single_draw_price}</span>
            </div>
            <span className="text-[10px] text-slate-500">单抽</span>
          </button>
          
          <button 
            onClick={() => handleDraw()}
            className="flex-[2] h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex flex-col items-center justify-center shadow-lg shadow-pink-500/30 active:scale-95 transition-transform relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]"></div>
            <div className="flex items-center gap-1 font-bold relative z-10 text-sm">
              <Sparkles className="w-4 h-4 fill-white" />
              <span>开始合拍</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] opacity-90 relative z-10">
              <Star className="w-2.5 h-2.5 fill-white" />
              <span>{template.ten_draw_price} (十连必出SR)</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
