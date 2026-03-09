import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { BottomNav } from '../components/BottomNav';
import { Search, ChevronRight, Image as ImageIcon, Loader2, Camera, Sparkles, User, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { API_BASE, resolveAssetUrl } from '../services/api';

/** 卡牌数据（后端返回） */
interface CardData {
  id: string;
  name: string;
  rarity: string;
  image_url: string;
  artist_id: string;
  series: string;
  obtained_at: string;
}

/** 按模板分组后的结构 */
interface TemplateGroup {
  templateId: string;
  templateTitle: string;
  artistName: string;
  coverImage: string;
  cards: CardData[];
  rarityCount: Record<string, number>;
}

/** 等级配色 */
const RARITY_COLORS: Record<string, { bg: string; text: string }> = {
  SSR: { bg: 'bg-gradient-to-r from-yellow-400 to-orange-500', text: 'text-yellow-900' },
  SR:  { bg: 'bg-gradient-to-r from-purple-500 to-indigo-500', text: 'text-white' },
  R:   { bg: 'bg-gradient-to-r from-blue-400 to-cyan-500', text: 'text-white' },
  N:   { bg: 'bg-gradient-to-r from-slate-300 to-slate-400', text: 'text-slate-700' },
};

/**
 * 卡包页面
 * 按明星/模板名字分类展示卡牌
 * 每个模板显示为一个卡组，内部按等级排列
 */
export const Collection: React.FC = () => {
  const { user } = useStore();
  const navigate = useNavigate();

  const [cards, setCards] = useState<CardData[]>([]);
  const [templates, setTemplates] = useState<Record<string, api.TemplateData>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('全部');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [generatingCardId, setGeneratingCardId] = useState<string | null>(null);

  // 模式选择弹窗
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 点击待生成卡牌 → 弹出模式选择
   */
  const handleCardClick = useCallback((card: CardData) => {
    if (generatingCardId) return;
    setSelectedCard(card);
    setShowModeModal(true);
  }, [generatingCardId]);

  /**
   * 虚拟形象模式生成
   */
  const handleAvatarGenerate = useCallback(async () => {
    if (!selectedCard || generatingCardId) return;
    setShowModeModal(false);
    setGeneratingCardId(selectedCard.id);
    try {
      const result = await api.generateCardImage(selectedCard.id, user.id, 'avatar');
      setCards((prev) =>
        prev.map((c) =>
          c.id === selectedCard.id ? { ...c, image_url: result.image_url } : c
        )
      );
    } catch (e: any) {
      alert(e.message || '生成合照失败，请重试');
    } finally {
      setGeneratingCardId(null);
      setSelectedCard(null);
    }
  }, [selectedCard, generatingCardId, user.id]);

  /**
   * 照片合拍模式 — 触发文件选择
   */
  const handlePhotoGenerate = useCallback(() => {
    setShowModeModal(false);
    fileInputRef.current?.click();
  }, []);

  /**
   * 用户选择照片后 → 调 API
   */
  const handlePhotoSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCard) return;

    setGeneratingCardId(selectedCard.id);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await api.generateCardImage(selectedCard.id, user.id, 'photo', b64);
      setCards((prev) =>
        prev.map((c) =>
          c.id === selectedCard.id ? { ...c, image_url: result.image_url } : c
        )
      );
    } catch (e: any) {
      alert(e.message || '生成合照失败，请重试');
    } finally {
      setGeneratingCardId(null);
      setSelectedCard(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [selectedCard, user.id]);

  // 从后端获取卡牌和模板数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cardsRes, templatesRes] = await Promise.all([
          fetch(`{API_BASE}/gacha/cards/${user.id}`).then((r) => r.json()),
          fetch(API_BASE + '/templates').then((r) => r.json()),
        ]);

        setCards(cardsRes.cards || []);

        // 模板数据转为 id → data 的 map
        const tplMap: Record<string, api.TemplateData> = {};
        (templatesRes || []).forEach((t: api.TemplateData) => {
          tplMap[t.id] = t;
        });
        setTemplates(tplMap);
      } catch (e) {
        console.error('获取卡包数据失败:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  // 按模板分组
  const groups: TemplateGroup[] = useMemo(() => {
    const map = new Map<string, TemplateGroup>();

    cards.forEach((card) => {
      const tplId = card.artist_id;
      if (!map.has(tplId)) {
        const tpl = templates[tplId];
        map.set(tplId, {
          templateId: tplId,
          templateTitle: tpl?.title || card.series.replace('Series-', ''),
          artistName: tpl?.artist_name || '未知艺人',
          coverImage: tpl?.cover_image || '',
          cards: [],
          rarityCount: { SSR: 0, SR: 0, R: 0, N: 0 },
        });
      }
      const group = map.get(tplId)!;
      group.cards.push(card);
      group.rarityCount[card.rarity] = (group.rarityCount[card.rarity] || 0) + 1;
    });

    // 按卡牌数量降序
    return Array.from(map.values()).sort((a, b) => b.cards.length - a.cards.length);
  }, [cards, templates]);

  // 等级筛选
  const filteredGroups = useMemo(() => {
    if (activeFilter === '全部') return groups;
    return groups
      .map((g) => ({
        ...g,
        cards: g.cards.filter((c) => c.rarity === activeFilter),
      }))
      .filter((g) => g.cards.length > 0);
  }, [groups, activeFilter]);

  // 等级排序优先级
  const rarityOrder = ['SSR', 'SR', 'R', 'N'];
  const sortCards = (cardList: CardData[]) =>
    [...cardList].sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));

  const totalCards = cards.length;
  const filters = ['全部', 'SSR', 'SR', 'R', 'N'];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-28">
      {/* 顶部 */}
      <div className="sticky top-0 z-50 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md px-4 h-14 flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/50">
        <h1 className="text-xl font-black text-slate-900 dark:text-white">我的卡包</h1>
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="font-bold text-slate-600 dark:text-slate-300">{totalCards} 张</span>
        </div>
      </div>

      {/* 等级筛选 */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === f
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-zinc-700'
            }`}
          >
            {f}
            {f !== '全部' && (
              <span className="ml-1 opacity-70">
                {cards.filter((c) => c.rarity === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 空状态 */}
      {filteredGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-slate-400 text-sm mb-4">
            {activeFilter === '全部' ? '卡包为空，快去抽卡吧！' : `暂无 ${activeFilter} 级别卡牌`}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-pink-500 text-white text-sm font-bold rounded-full"
          >
            去抽卡
          </button>
        </div>
      )}

      {/* 按模板分组卡牌 */}
      <div className="px-4 space-y-4 mt-1">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroup === group.templateId;
          const displayCards = isExpanded ? sortCards(group.cards) : sortCards(group.cards).slice(0, 4);

          return (
            <div
              key={group.templateId}
              className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* 分组头部 */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpandedGroup(isExpanded ? null : group.templateId)}
              >
                {/* 模板封面缩略图 */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0">
                  {group.coverImage ? (
                    <img src={resolveAssetUrl(group.coverImage)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {group.templateTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{group.artistName}</p>
                </div>

                {/* 等级统计标签 */}
                <div className="flex gap-1 shrink-0">
                  {rarityOrder.map((r) => {
                    const count = group.rarityCount[r] || 0;
                    if (count === 0) return null;
                    const style = RARITY_COLORS[r];
                    return (
                      <span
                        key={r}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${style.bg} ${style.text}`}
                      >
                        {r}·{count}
                      </span>
                    );
                  })}
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-slate-300 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </div>

              {/* 卡牌网格 */}
              <div className="px-4 pb-4">
                <div className="grid grid-cols-4 gap-2">
                  {displayCards.map((card) => {
                    const style = RARITY_COLORS[card.rarity] || RARITY_COLORS.N;
                    const hasImage = !!card.image_url;
                    const isGenerating = generatingCardId === card.id;

                    return (
                      <div
                        key={card.id}
                        onClick={() => !hasImage && !isGenerating && handleCardClick(card)}
                        className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 group ${
                          !hasImage ? 'cursor-pointer active:scale-95 transition-transform' : ''
                        }`}
                      >
                        {hasImage ? (
                          <img
                            src={resolveAssetUrl(card.image_url)}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : isGenerating ? (
                          /* 正在生成中 */
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-pink-50 dark:bg-pink-900/20">
                            <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                            <span className="text-[8px] text-pink-400 font-bold">生成中...</span>
                          </div>
                        ) : (
                          /* 未生成合照 — 点击可生成 */
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors">
                            <Camera className="w-5 h-5 text-slate-300 dark:text-zinc-600 group-hover:text-pink-400 transition-colors" />
                            <span className="text-[8px] text-slate-300 group-hover:text-pink-400 transition-colors">点击生成</span>
                          </div>
                        )}

                        {/* 等级标签 */}
                        <div className="absolute top-1 left-1">
                          <span className={`px-1 py-0.5 rounded text-[8px] font-black ${style.bg} ${style.text}`}>
                            {card.rarity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 展开/收起 */}
                {group.cards.length > 4 && !isExpanded && (
                  <button
                    onClick={() => setExpandedGroup(group.templateId)}
                    className="w-full mt-2 py-2 text-xs text-pink-500 font-bold text-center"
                  >
                    查看全部 {group.cards.length} 张 →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 模式选择弹窗 */}
      {showModeModal && selectedCard && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowModeModal(false)}>
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl p-6 pb-10 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">选择合照方式</h3>
              <button onClick={() => setShowModeModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <button
              onClick={handleAvatarGenerate}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white active:scale-[0.98] transition-transform"
            >
              <User className="w-8 h-8 shrink-0" />
              <div className="text-left">
                <p className="font-bold">虚拟形象生成</p>
                <p className="text-xs opacity-80">官方场景 · 更有代入感</p>
              </div>
            </button>

            <button
              onClick={handlePhotoGenerate}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white active:scale-[0.98] transition-transform"
            >
              <Upload className="w-8 h-8 shrink-0 text-pink-500" />
              <div className="text-left">
                <p className="font-bold">在我的照片里合照</p>
                <p className="text-xs text-slate-400">上传照片 · 更真实可控</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 隐藏的文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelected}
      />

      <BottomNav />
    </div>
  );
};
