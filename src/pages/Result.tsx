import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Download, Share2, RefreshCw, Home, ArrowLeft, MessageCircle, Aperture, BookOpen, Eye, Music, X, Check } from 'lucide-react';
import { Card } from '../store/useStore';
import { Header } from '../components/Header';

export const Result: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cards = location.state?.cards as Card[] || (location.state?.card ? [location.state.card] : []);
  
  const [isSaved, setIsSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!cards || cards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-500">
        <p>未找到卡牌数据。</p>
        <Link to="/" className="mt-4 text-pink-500 font-bold flex items-center gap-2">
          <Home className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    );
  }

  const isSingle = cards.length === 1;

  const handleSave = () => {
    if (isSaved) {
      setShowConfirm(true);
    } else {
      performSave();
    }
  };

  const performSave = () => {
    setIsSaved(true);
    setShowConfirm(false);
    showToast('已保存至本地');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const shareOptions = [
    { name: '微信', icon: MessageCircle, color: 'bg-green-500' },
    { name: '朋友圈', icon: Aperture, color: 'bg-green-600' },
    { name: '小红书', icon: BookOpen, color: 'bg-red-500' },
    { name: '微博', icon: Eye, color: 'bg-yellow-500' },
    { name: '抖音', icon: Music, color: 'bg-black' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col pb-safe relative">
      <Header title="抽卡结果" />

      <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto">
        
        {isSingle ? (
          // Single Card View
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl mb-6 group bg-slate-200 dark:bg-zinc-800">
              <img src={cards[0].imageUrl} alt={cards[0].name} className="w-full h-full object-cover" />
              
              <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-full">
                <span className={`text-lg font-black ${
                  cards[0].rarity === 'SSR' ? 'text-yellow-400' :
                  cards[0].rarity === 'SR' ? 'text-purple-400' :
                  'text-blue-400'
                }`}>{cards[0].rarity}</span>
              </div>

              <div className="absolute bottom-4 right-4 text-[10px] text-white/50 font-mono">
                Nanobanana AI
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{cards[0].name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              系列: {cards[0].series}
            </p>
          </div>
        ) : (
          // Grid View for 10x
          <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-8">
            {cards.map((card) => (
              <div key={card.id} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md bg-slate-200 dark:bg-zinc-800 group">
                <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">
                  <span className={`${
                    card.rarity === 'SSR' ? 'text-yellow-400' :
                    card.rarity === 'SR' ? 'text-purple-400' :
                    'text-blue-300'
                  }`}>{card.rarity}</span>
                </div>
                {card.rarity === 'SSR' && (
                  <div className="absolute inset-0 border-2 border-yellow-400/50 rounded-xl pointer-events-none animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="w-full max-w-sm flex flex-col gap-3 mt-auto">
          <div className="flex gap-3">
            <button 
              onClick={handleSave}
              className="flex-1 py-3 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Download className="w-5 h-5" />
              全部保存
            </button>
            <button 
              onClick={handleShare}
              className="flex-1 py-3 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Share2 className="w-5 h-5" />
              分享
            </button>
          </div>

          <button 
            onClick={() => navigate(-1)} 
            className="w-full py-4 bg-pink-500 text-white rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-5 h-5" />
            再抽一次
          </button>
          
          <Link to="/" className="mt-2 text-slate-400 flex items-center justify-center gap-1 text-sm py-2">
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-in fade-in zoom-in duration-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-xs shadow-xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">重复保存</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              已经保存之本地，是否再次保存？
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded-lg font-medium text-sm"
              >
                取消
              </button>
              <button 
                onClick={performSave}
                className="flex-1 py-2.5 bg-pink-500 text-white rounded-lg font-medium text-sm"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Sheet */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShare(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">分享至</h3>
              <button onClick={() => setShowShare(false)} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-5 gap-4 mb-8">
              {shareOptions.map((option) => (
                <button key={option.name} className="flex flex-col items-center gap-2 group">
                  <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center text-white shadow-lg group-active:scale-95 transition-transform`}>
                    <option.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{option.name}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowShare(false)}
              className="w-full py-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
