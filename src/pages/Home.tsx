import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, Calendar, User, Mail, Plus, Camera, Heart, Verified, Trophy, Crown, Loader2 } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import * as api from '../services/api';
import { API_BASE } from '../services/api';

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recommend' | 'star' | 'luck'>('recommend');
  const navigate = useNavigate();

  // 后端数据状态 - 无 Mock 数据，完全由后端驱动
  const [templates, setTemplates] = useState<api.TemplateData[]>([]);
  const [banners, setBanners] = useState<{ id: string; image_url: string; link_url: string }[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 从后端获取模板和 Banner 数据
   */
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [tplData, bannerData] = await Promise.all([
          api.getTemplates(),
          fetch(API_BASE + '/admin/banners').then((r) => r.json()).catch(() => []),
        ]);
        setTemplates(tplData);
        setBanners(bannerData);
      } catch (err: any) {
        setError('无法连接后端服务，请确认后端已启动');
        console.error('获取数据失败:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Banner 自动轮播
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setActiveBanner((p) => (p + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // 从模板中提取艺人列表（去重）
  const artists = Array.from(
    new Map<string, { name: string; avatar: string }>(
      templates.map((t) => [
        t.artist_name,
        {
          name: t.artist_name,
          avatar: t.artist_ref_images?.[0] || t.cover_image || '',
        },
      ])
    ).values()
  );

  const starList = [
    { rank: 1, name: '暂无数据', avatar: '', count: '-', label: '合拍' },
  ];

  const luckList = [
    { rank: 1, name: '暂无数据', avatar: '', count: '-', label: 'SSR' },
  ];

  const renderRankItem = (item: any, index: number) => (
    <div key={index} className="flex items-center p-3 bg-white dark:bg-zinc-900 rounded-xl mb-3 shadow-sm border border-slate-100 dark:border-zinc-800">
      <div className="w-8 flex justify-center font-bold text-lg italic mr-3">
        {item.rank === 1 ? <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" /> :
         <span className="text-slate-500 text-base not-italic">{item.rank}</span>}
      </div>
      <div className="w-12 h-12 rounded-full border border-slate-100 dark:border-zinc-700 overflow-hidden mr-3 bg-slate-200 dark:bg-zinc-800">
        {item.avatar && <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-800 dark:text-white">{item.name}</h3>
      </div>
      <div className="text-right">
        <p className="text-pink-500 font-bold text-lg">{item.count}</p>
        <p className="text-[10px] text-slate-400">{item.label}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* Header Search */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex-1 mr-4 relative">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="搜索艺人、合约、用户..." 
            className="w-full bg-slate-100 dark:bg-zinc-800 border-none rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-pink-200 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <Link to="/profile" className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden border-2 border-white dark:border-zinc-600 shadow-sm">
          <img src="https://picsum.photos/seed/user/100" alt="User" className="w-full h-full object-cover" />
        </Link>
      </div>

      {/* Hero Banner - 从后台管理获取 */}
      <div className="px-4 py-4">
        <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-pink-500/20 to-purple-600/30">
          {banners.length > 0 ? (
            <>
              {banners.map((b, i) => (
                <div
                  key={b.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === activeBanner ? 'opacity-100' : 'opacity-0'}`}
                  onClick={() => b.link_url && navigate(b.link_url)}
                  style={{ cursor: b.link_url ? 'pointer' : 'default' }}
                >
                  <img src={b.image_url} alt="Banner" className="w-full h-full object-cover" />
                </div>
              ))}
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveBanner(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === activeBanner ? 'bg-white w-5' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : templates.length > 0 && templates[0].cover_image ? (
            <img src={templates[0].cover_image} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-pink-300/50" />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-between px-4 py-2">
        {[
          { name: '抽卡', icon: Sparkles, color: 'text-pink-400' },
          { name: '周边', icon: ShoppingBag, color: 'text-pink-400' },
          { name: '榜单', icon: Trophy, color: 'text-pink-400' },
          { name: '活动', icon: Calendar, color: 'text-pink-400' },
          { name: '形象', icon: User, color: 'text-pink-400' },
          { name: '邮件', icon: Mail, color: 'text-pink-400' },
        ].map((item) => (
          <div key={item.name} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-slate-100 dark:border-zinc-700 shadow-sm">
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{item.name}</span>
          </div>
        ))}
      </div>

      {/* My Artists - 从模板数据中提取 */}
      {artists.length > 0 && (
        <div className="w-full overflow-hidden px-4 py-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-slate-800 dark:text-white">我的艺人</span>
          </div>
          <div className="flex flex-row items-start justify-start gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {artists.map((artist) => (
              <div key={artist.name} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-14 h-14 rounded-full border-[3px] border-pink-100 dark:border-pink-900 overflow-hidden shadow-sm p-0.5 bg-slate-200">
                  {artist.avatar && (
                    <img src={artist.avatar} alt={artist.name} className="w-full h-full rounded-full object-cover" />
                  )}
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{artist.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 sticky top-14 z-30 bg-slate-50/95 dark:bg-zinc-950/95 backdrop-blur-sm flex justify-center gap-8 border-b border-slate-200 dark:border-zinc-800 mb-4">
        <button 
          onClick={() => setActiveTab('recommend')}
          className={`relative pb-3 text-[15px] transition-colors ${activeTab === 'recommend' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}
        >
          推荐
          {activeTab === 'recommend' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-pink-400 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('star')}
          className={`relative pb-3 text-[15px] transition-colors ${activeTab === 'star' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}
        >
          星光榜
          {activeTab === 'star' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-pink-400 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('luck')}
          className={`relative pb-3 text-[15px] transition-colors ${activeTab === 'luck' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}
        >
          欧气榜
          {activeTab === 'luck' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-pink-400 rounded-t-full"></div>}
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {activeTab === 'recommend' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-slate-800 dark:text-white">推荐</span>
            </div>

            {/* 加载状态 */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <span className="text-sm">加载中...</span>
              </div>
            )}

            {/* 错误状态 */}
            {error && !isLoading && (
              <div className="text-center py-20">
                <p className="text-sm text-red-400 mb-2">{error}</p>
                <button onClick={() => window.location.reload()} className="text-xs text-pink-500 underline">重试</button>
              </div>
            )}

            {/* 空状态 */}
            {!isLoading && !error && templates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Sparkles className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-sm font-medium mb-1">暂无合拍模板</p>
                <p className="text-xs text-slate-400">请通过后端 API 添加模板</p>
              </div>
            )}

            {/* 模板列表 */}
            {!isLoading && templates.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div 
                    key={template.id} 
                    onClick={() => navigate(`/template/${template.id}`)}
                    className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-zinc-800 group cursor-pointer"
                  >
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-200 dark:bg-zinc-800">
                      {template.cover_image ? (
                        <img src={template.cover_image} alt={template.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-10 h-10 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-white/60 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                        <Verified className="w-3 h-3 text-pink-500 fill-pink-500" />
                        <span className="text-[9px] text-pink-600 font-bold">官方</span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1 shadow-sm hover:bg-white transition-colors">
                        <Camera className="w-3 h-3 text-pink-500" />
                        <span className="text-[9px] text-pink-600 font-bold">去抽</span>
                      </div>
                      <button className="absolute bottom-2 right-2 w-7 h-7 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center text-pink-500 hover:bg-white transition-colors" onClick={(e) => e.stopPropagation()}>
                        <Heart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm truncate text-slate-800 dark:text-white">{template.title}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">艺人: {template.artist_name}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-pink-500 font-bold">⭐ {template.single_draw_price}</span>
                        <span className="text-[10px] text-slate-400">{template.ten_draw_price}/十连</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'star' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-slate-800 dark:text-white">艺人合拍榜</span>
              <span className="text-xs text-slate-400">每周一更新</span>
            </div>
            {starList.map((item, index) => renderRankItem(item, index))}
          </div>
        )}

        {activeTab === 'luck' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-slate-800 dark:text-white">欧皇排行榜</span>
              <span className="text-xs text-slate-400">实时更新</span>
            </div>
            {luckList.map((item, index) => renderRankItem(item, index))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};
