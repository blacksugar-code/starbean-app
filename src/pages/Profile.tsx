import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Settings, ChevronRight, Wallet, Award, MessageSquare, MapPin,
  Headphones, Rocket, Gift, Sparkles, Star, Gem, Camera, ImageIcon,
  CreditCard, ListOrdered, ChevronDown, X
} from 'lucide-react';
import { useStore, type Rarity } from '../store/useStore';
import { BottomNav } from '../components/BottomNav';
import { AvatarCropper } from '../components/AvatarCropper';
import { Link, useNavigate } from 'react-router-dom';

/**
 * 个人中心页面
 * 包含：AI 分身展示、资产看板、合拍统计、功能矩阵
 */
export const Profile: React.FC = () => {
  const { user, setUserAvatar, fetchUser, fetchCollection } = useStore();
  const navigate = useNavigate();
  const [showTransactions, setShowTransactions] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    fetchUser(user.id);
    fetchCollection();
  }, []);

  /** 选择文件后打开裁剪器 */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    // 重置 input，允许再次选同一文件
    e.target.value = '';
  };

  /** 裁剪完成后上传 */
  const handleCropConfirm = async (blob: Blob) => {
    setCropFile(null);
    try {
      const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const result = await import('../services/api').then((api) => api.uploadImage(croppedFile));
      setUserAvatar(result.url);
    } catch {
      alert('头像上传失败');
    }
  };

  // 按稀有度统计合拍数量
  const rarityCounts = useMemo(() => {
    const counts: Record<Rarity, number> = { N: 0, R: 0, SR: 0, SSR: 0 };
    user.collection.forEach((card) => {
      if (counts[card.rarity] !== undefined) counts[card.rarity]++;
    });
    return counts;
  }, [user.collection]);

  // 关注艺人数（从卡牌中提取去重艺人）
  const followedArtists = useMemo(() => {
    return new Set(user.collection.map((c) => c.artistId)).size;
  }, [user.collection]);

  // 资产看板数据
  const assetItems = [
    { label: '星豆余额', value: user.starBeans, icon: Gem, color: 'text-pink-500', canLink: true },
    { label: '星光碎片', value: user.fragments, icon: Star, color: 'text-yellow-500' },
    { label: '合照总数', value: user.collection.length, icon: Camera, color: 'text-blue-500' },
    { label: '关注艺人', value: followedArtists, icon: Sparkles, color: 'text-purple-500' },
  ];

  // 功能矩阵
  const menuItems = [
    { icon: Award, label: '勋章展馆', color: 'text-yellow-500', bg: 'bg-yellow-50', link: '#' },
    { icon: MessageSquare, label: '消息中心', color: 'text-blue-500', bg: 'bg-blue-50', link: '#' },
    { icon: ListOrdered, label: '订单记录', color: 'text-green-500', bg: 'bg-green-50', link: '#' },
    { icon: MapPin, label: '地址管理', color: 'text-purple-500', bg: 'bg-purple-50', link: '#' },
    { icon: Headphones, label: '在线客服', color: 'text-pink-500', bg: 'bg-pink-50', link: '#' },
    { icon: Rocket, label: '发行中心', color: 'text-orange-500', bg: 'bg-orange-50', link: '#' },
    { icon: Settings, label: '设置', color: 'text-slate-500', bg: 'bg-slate-50', link: '/settings' },
    { icon: Gift, label: '邀请抽奖', color: 'text-red-500', bg: 'bg-red-50', link: '/invite' },
  ];

  // 稀有度配色
  const rarityStyles: Record<Rarity, { bg: string; text: string; label: string }> = {
    SSR: { bg: 'bg-gradient-to-br from-yellow-400 to-orange-500', text: 'text-white', label: 'SSR' },
    SR: { bg: 'bg-gradient-to-br from-purple-400 to-indigo-500', text: 'text-white', label: 'SR' },
    R: { bg: 'bg-gradient-to-br from-blue-400 to-cyan-500', text: 'text-white', label: 'R' },
    N: { bg: 'bg-gradient-to-br from-slate-300 to-slate-400', text: 'text-white', label: 'N' },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* ========== 顶部背景 ========== */}
      <div className="relative">
        <div className="h-44 bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-8 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-4 w-40 h-40 bg-pink-200 rounded-full blur-3xl" />
          </div>
          <Link to="/settings" className="absolute top-6 right-4 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </Link>
        </div>

        {/* 用户信息卡片 */}
        <div className="mx-4 -mt-16 relative z-10 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-5">
          <div className="flex items-center gap-4">
            {/* 头像 - 点击可更换 */}
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-16 h-16 rounded-full border-[3px] border-pink-200 overflow-hidden bg-slate-200 dark:bg-zinc-700 shrink-0 cursor-pointer relative group"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{user.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">ID: {user.id.split('-')[0]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 虚拟形象展示区 ========== */}
      <div className="mx-4 mt-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-white">我的虚拟形象</h3>
          </div>
          <Link
            to="/avatar-generate"
            className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full"
          >
            {user.digitalAvatarGenerated ? '修改形象' : '生成形象'}
          </Link>
        </div>
        {user.digitalAvatarGenerated && user.digitalAvatarUrl ? (
          <div className="px-4 pb-4">
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
              <img src={user.digitalAvatarUrl} alt="虚拟形象" className="w-full h-full object-cover" />
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">此形象将用于 AI 合拍生图</p>
          </div>
        ) : (
          <div className="px-4 pb-5 flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-700 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-xs text-slate-400">尚未生成虚拟形象</p>
          </div>
        )}
      </div>

      {/* ========== 资产看板 ========== */}
      <div className="mx-4 mt-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-white">我的资产</h3>
          <button
            onClick={() => setShowTransactions(true)}
            className="text-xs text-pink-500 flex items-center gap-0.5"
          >
            明细 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {assetItems.map((item) => (
            <button
              key={item.label}
              onClick={() => item.canLink && navigate('/recharge')}
              className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="text-xl font-bold text-slate-800 dark:text-white leading-none">{item.value}</span>
              <span className="text-[10px] text-slate-400">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========== 合拍数量详情 ========== */}
      <div className="mx-4 mt-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3">合拍详情</h3>
        <div className="grid grid-cols-4 gap-2">
          {(['SSR', 'SR', 'R', 'N'] as Rarity[]).map((r) => (
            <div key={r} className={`${rarityStyles[r].bg} rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-black ${rarityStyles[r].text}`}>{rarityCounts[r]}</p>
              <p className={`text-xs font-bold ${rarityStyles[r].text} opacity-80 mt-0.5`}>{r}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========== 功能矩阵 ========== */}
      <div className="mx-4 mt-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3">功能服务</h3>
        <div className="grid grid-cols-4 gap-y-4">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.link}
              className="flex flex-col items-center gap-1.5"
            >
              <div className={`w-11 h-11 rounded-xl ${item.bg} dark:bg-zinc-800 flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ========== 交易明细弹窗 ========== */}
      {showTransactions && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowTransactions(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-t-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-zinc-900 flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">收支明细</h2>
              <button onClick={() => setShowTransactions(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-5">
              {/* TODO: 接入真实明细数据 */}
              <div className="text-center py-12">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">暂无交易记录</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 头像裁剪器弹窗 */}
      {cropFile && (
        <AvatarCropper
          file={cropFile}
          onCrop={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      <BottomNav />
    </div>
  );
};
