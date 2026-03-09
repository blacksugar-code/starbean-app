import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, Gem, Loader2, Camera, Archive, Star, Upload, User } from 'lucide-react';
import { useStore, Card } from '../store/useStore';
import * as api from '../services/api';
import { API_BASE } from '../services/api';

type Stage = 'idle' | 'animating' | 'reveal' | 'generating';

/** 等级对应的视觉配置 */
const RARITY_CONFIG: Record<string, {
  label: string; gradient: string; glow: string; text: string;
  particles: number; emoji: string;
}> = {
  SSR: { label: 'SSR', gradient: 'from-yellow-400 via-orange-400 to-red-500', glow: 'shadow-[0_0_100px_rgba(250,204,21,0.6)]', text: 'text-yellow-400', particles: 40, emoji: '🌟' },
  SR:  { label: 'SR',  gradient: 'from-purple-500 via-indigo-500 to-blue-600', glow: 'shadow-[0_0_80px_rgba(139,92,246,0.5)]',  text: 'text-purple-400', particles: 25, emoji: '💜' },
  R:   { label: 'R',   gradient: 'from-blue-400 via-cyan-400 to-teal-500',     glow: 'shadow-[0_0_60px_rgba(59,130,246,0.4)]',   text: 'text-blue-400',   particles: 15, emoji: '💎' },
  N:   { label: 'N',   gradient: 'from-slate-400 via-zinc-400 to-gray-500',    glow: 'shadow-[0_0_40px_rgba(148,163,184,0.3)]',  text: 'text-slate-300',  particles: 8,  emoji: '⭐' },
};

/**
 * 抽卡页面 — 新流程
 *
 * 1. 点击抽卡 → 后端只做概率+扣费（毫秒级）
 * 2. 播放抽卡动画（约 3 秒）
 * 3. 揭示卡牌等级（SSR 超级绚丽，N 简洁）
 * 4. 用户选择：「立即生成合照」或「存入卡包」
 */
export const Gacha: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, drawGacha } = useStore();

  // 页面状态
  const [stage, setStage] = useState<Stage>('idle');
  const [drawnCards, setDrawnCards] = useState<Card[]>([]);
  const [maxRarity, setMaxRarity] = useState<string>('N');

  // 模板数据
  const [template, setTemplate] = useState<api.TemplateData | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // 合照生成
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [generateMode, setGenerateMode] = useState<'avatar' | 'photo'>('avatar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const data = await fetch(`${API_BASE}/templates/${id}`).then((r) => r.json());
        setTemplate(data);
      } catch (e) {
        console.error('获取模板失败:', e);
      } finally {
        setLoadingTemplate(false);
      }
    };
    if (id) fetchTemplate();
  }, [id]);

  const singlePrice = template?.single_draw_price || 99;
  const tenPrice = template?.ten_draw_price || 890;

  /**
   * 计算最高等级
   */
  const getMaxRarity = (cards: Card[]): string => {
    const order = ['N', 'R', 'SR', 'SSR'];
    let max = 0;
    cards.forEach((c) => {
      const idx = order.indexOf(c.rarity);
      if (idx > max) max = idx;
    });
    return order[max];
  };

  /**
   * 执行抽卡（快速版 — 毫秒级返回）
   */
  const handleDraw = async (drawType: 'single' | 'ten') => {
    const cost = drawType === 'ten' ? tenPrice : singlePrice;
    if (user.starBeans < cost) {
      alert(`星豆不足！需要 ${cost} 星豆，当前余额 ${user.starBeans}`);
      return;
    }
    if (stage !== 'idle') return;

    try {
      // 1. 调后端（毫秒级，只做概率+扣费）
      const cards = await drawGacha(id || '', drawType);
      setDrawnCards(cards);
      setMaxRarity(getMaxRarity(cards));

      // 2. 启动动画
      setStage('animating');
    } catch (error: any) {
      alert(error.message || '抽卡失败，请重试');
    }
  };

  /**
   * 动画结束 → 进入等级揭示
   */
  useEffect(() => {
    if (stage !== 'animating') return;
    const timer = setTimeout(() => setStage('reveal'), 3000);
    return () => clearTimeout(timer);
  }, [stage]);

  /**
   * 获取目标卡牌（单抽取唯一卡，十连取最高等级卡）
   */
  const getTargetCard = (): Card | null => {
    if (drawnCards.length === 0) return null;
    if (drawnCards.length === 1) return drawnCards[0];
    return drawnCards.reduce((best, c) => {
      const order = ['N', 'R', 'SR', 'SSR'];
      return order.indexOf(c.rarity) > order.indexOf(best.rarity) ? c : best;
    });
  };

  /**
   * 「虚拟形象生成」按钮 — 直接调 API
   */
  const handleAvatarMode = async () => {
    const target = getTargetCard();
    if (!target) return;
    setGenerateMode('avatar');
    setStage('generating');
    setGeneratingImage(true);
    try {
      const result = await api.generateCardImage(target.id, user.id, 'avatar');
      setGeneratedImageUrl(result.image_url);
    } catch (e: any) {
      alert(e.message || '生成失败，请稍后重试');
      setStage('reveal');
    } finally {
      setGeneratingImage(false);
    }
  };

  /**
   * 「在我的照片里合照」按钮 — 先触发文件选择
   */
  const handlePhotoMode = () => {
    fileInputRef.current?.click();
  };

  /**
   * 用户选择照片后 → 读取 base64 → 调 API
   */
  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const target = getTargetCard();
    if (!target) return;

    setGenerateMode('photo');
    setStage('generating');
    setGeneratingImage(true);

    try {
      // 将文件转为 base64 data URI
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await api.generateCardImage(target.id, user.id, 'photo', b64);
      setGeneratedImageUrl(result.image_url);
    } catch (e: any) {
      alert(e.message || '生成失败，请稍后重试');
      setStage('reveal');
    } finally {
      setGeneratingImage(false);
      // 重置 file input 以便重复选择
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * 存入卡包（直接跳转）
   */
  const handleSaveToCollection = () => {
    navigate('/collection');
  };

  if (loadingTemplate) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
      </div>
    );
  }

  const rarityConfig = RARITY_CONFIG[maxRarity] || RARITY_CONFIG.N;

  return (
    <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">
      {/* ===== 背景 ===== */}
      {template?.cover_image && stage === 'idle' && (
        <div className="absolute inset-0">
          <img src={template.cover_image} alt="" className="w-full h-full object-cover opacity-20" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900" />

      {/* ===== 抽卡动画阶段 ===== */}
      <AnimatePresence>
        {stage === 'animating' && (
          <motion.div
            key="animation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* 粒子爆发效果 */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${rarityConfig.gradient}`}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 600,
                  y: (Math.random() - 0.5) * 800,
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 2, delay: 0.5 + Math.random() * 1, ease: 'easeOut' }}
              />
            ))}
            {/* 中心能量球 */}
            <motion.div
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${rarityConfig.gradient} ${rarityConfig.glow}`}
              initial={{ scale: 0, rotate: 0 }}
              animate={{
                scale: [0, 1.5, 0.8, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 2.5, ease: 'easeInOut' }}
            />
            <motion.p
              className="mt-8 text-xl font-bold text-white/80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              命运正在降临...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 等级揭示阶段 ===== */}
      <AnimatePresence>
        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* 背景粒子 */}
            {Array.from({ length: rarityConfig.particles }).map((_, i) => (
              <motion.div
                key={i}
                className={`absolute text-lg`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  y: -100,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 1.5,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2,
                }}
              >
                {rarityConfig.emoji}
              </motion.div>
            ))}

            {/* 等级揭示卡片 */}
            <motion.div
              initial={{ scale: 0, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 100 }}
              className={`w-64 h-80 rounded-3xl bg-gradient-to-br ${rarityConfig.gradient} ${rarityConfig.glow} flex flex-col items-center justify-center relative`}
            >
              {/* SSR 专属光环 */}
              {maxRarity === 'SSR' && (
                <motion.div
                  className="absolute inset-0 rounded-3xl border-4 border-yellow-300/60"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <motion.p
                className="text-7xl font-black text-white drop-shadow-2xl"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', damping: 10 }}
              >
                {rarityConfig.label}
              </motion.p>
              <motion.p
                className="mt-3 text-white/80 text-sm font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {drawnCards.length > 1 ? `${drawnCards.length} 张卡牌` : drawnCards[0]?.name}
              </motion.p>
              {/* 十连时显示各等级分布 */}
              {drawnCards.length > 1 && (
                <motion.div
                  className="flex gap-2 mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {['SSR', 'SR', 'R', 'N'].map((r) => {
                    const count = drawnCards.filter((c) => c.rarity === r).length;
                    if (count === 0) return null;
                    return (
                      <span key={r} className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                        {r}×{count}
                      </span>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>

            {/* 模式选择按钮 */}
            <motion.div
              className="mt-8 w-full max-w-xs flex flex-col gap-3 px-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              {/* 模式 1：虚拟形象生成 */}
              <button
                onClick={handleAvatarMode}
                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center gap-3 px-5 bg-gradient-to-r ${rarityConfig.gradient} text-white shadow-xl active:scale-95 transition-transform`}
              >
                <User className="w-6 h-6 shrink-0" />
                <div className="text-left">
                  <p>虚拟形象生成</p>
                  <p className="text-[10px] font-normal opacity-80">官方场景 · 更有代入感</p>
                </div>
              </button>

              {/* 模式 2：在我的照片里合照 */}
              <button
                onClick={handlePhotoMode}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center gap-3 px-5 bg-white/10 border border-white/20 text-white active:scale-95 transition-transform"
              >
                <Upload className="w-6 h-6 shrink-0" />
                <div className="text-left">
                  <p>在我的照片里合照</p>
                  <p className="text-[10px] font-normal opacity-60">上传照片 · 更真实可控</p>
                </div>
              </button>

              {/* 存入卡包 */}
              <button
                onClick={handleSaveToCollection}
                className="w-full py-2.5 rounded-2xl text-sm text-white/50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Archive className="w-4 h-4" />
                先存入卡包，稍后生成
              </button>
            </motion.div>

            {/* 隐藏的文件选择器 — 照片合拍模式用 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelected}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 合照生成中 ===== */}
      <AnimatePresence>
        {stage === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
          >
            {generatedImageUrl ? (
              /* 生成完成 — 展示合照 */
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6 px-6 w-full max-w-sm"
              >
                <div className={`w-full aspect-[3/4] rounded-2xl overflow-hidden ${rarityConfig.glow}`}>
                  <img src={generatedImageUrl} alt="合照" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-black ${rarityConfig.text}`}>{maxRarity}</span>
                  <span className="text-white/60 text-sm">{drawnCards[0]?.name}</span>
                </div>
                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={() => navigate('/collection')}
                    className={`w-full py-3 rounded-2xl font-bold bg-gradient-to-r ${rarityConfig.gradient} text-white active:scale-95 transition-transform`}
                  >
                    查看卡包
                  </button>
                  <button
                    onClick={() => { setStage('idle'); setDrawnCards([]); setGeneratedImageUrl(''); }}
                    className="w-full py-3 rounded-2xl font-medium bg-white/10 text-white/80 active:scale-95 transition-transform"
                  >
                    继续抽卡
                  </button>
                </div>
              </motion.div>
            ) : (
              /* 生成中 — Loading */
              <motion.div className="flex flex-col items-center gap-4">
                <motion.div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${rarityConfig.gradient}`}
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-xl font-bold text-white animate-pulse">AI 正在生成合照...</p>
                <p className="text-sm text-slate-400">这通常需要 30-60 秒</p>
                <button
                  onClick={() => { setStage('idle'); setDrawnCards([]); }}
                  className="mt-4 text-xs text-slate-500 underline"
                >
                  取消并返回
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 初始状态 — 抽卡界面 ===== */}
      {stage === 'idle' && (
        <>
          {/* 顶部导航 */}
          <div className="sticky top-0 z-40 px-4 py-3 flex items-center relative">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center z-10">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="absolute inset-0 flex items-center justify-center text-base font-bold text-white pointer-events-none">
              {template?.title || '合拍抽卡'}
            </h1>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-6 pb-20">
            {/* 模板卡片预览 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="w-56 h-72 rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_0_40px_rgba(236,72,153,0.3)] mb-8 relative group"
            >
              {template?.cover_image ? (
                <img src={template.cover_image} alt={template.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-purple-600/30 flex items-center justify-center">
                  <Sparkles className="w-20 h-20 text-pink-300 animate-pulse" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-lg font-bold">{template?.title}</p>
                <p className="text-white/60 text-xs">{template?.artist_name}</p>
              </div>
            </motion.div>

            {/* 概率提示 */}
            <div className="flex gap-2 mb-8">
              {['SSR 2%', 'SR 8%', 'R 20%', 'N 70%'].map((label) => (
                <span key={label} className="px-2 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] text-white/70 border border-white/10">
                  {label}
                </span>
              ))}
            </div>

            {/* 抽卡按钮 */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDraw('single')}
                className="flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl p-4 transition-all active:scale-95"
              >
                <span className="text-sm font-bold mb-1">单抽</span>
                <div className="flex items-center gap-1 text-pink-300">
                  <Gem className="w-4 h-4" />
                  <span className="font-bold">{singlePrice}</span>
                </div>
              </button>

              <button
                onClick={() => handleDraw('ten')}
                className="flex flex-col items-center justify-center bg-gradient-to-br from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600 rounded-xl p-4 shadow-lg shadow-pink-500/30 transition-all active:scale-95 relative overflow-hidden"
              >
                <span className="text-sm font-bold mb-1">十连抽</span>
                <div className="flex items-center gap-1 text-white">
                  <Gem className="w-4 h-4" />
                  <span className="font-bold">{tenPrice}</span>
                </div>
                <span className="absolute top-1 right-1 text-[9px] bg-yellow-400 text-yellow-900 px-1 rounded font-bold">SR+</span>
              </button>
            </div>

            {/* 余额 */}
            <div className="mt-6 text-xs text-slate-500 flex items-center gap-2">
              <span>余额:</span>
              <div className="flex items-center gap-1 text-pink-300">
                <Gem className="w-3 h-3" />
                <span>{user.starBeans}</span>
              </div>
              <button onClick={() => navigate('/recharge')} className="ml-2 text-white underline">充值</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
