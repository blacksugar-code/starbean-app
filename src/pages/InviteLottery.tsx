import React, { useState } from 'react';
import { ChevronLeft, Copy, Share2, Gift, Check, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

/**
 * 邀请抽奖页面
 * 生成专属邀请链接/海报，好友注册双方得奖励
 */
export const InviteLottery: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [copied, setCopied] = useState(false);

  // 基于用户 ID 生成专属邀请码
  const inviteCode = user.id.split('-')[0].toUpperCase();
  const inviteLink = `https://starbean.app/invite?code=${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // 降级方案：选中文字
      const el = document.createElement('textarea');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const rewardRules = [
    { icon: '🎁', title: '分享链接', desc: '将专属邀请链接分享给好友' },
    { icon: '✅', title: '好友注册', desc: '好友通过链接完成注册' },
    { icon: '🎉', title: '双方奖励', desc: '你和好友各获得 50 星豆 + 1 次免费抽卡' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-500 via-pink-500 to-purple-600">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-white -ml-9">邀请抽奖</h1>
      </div>

      {/* 主视觉 */}
      <div className="px-6 pt-4 pb-8 text-center">
        <div className="relative inline-block">
          <Gift className="w-20 h-20 text-yellow-300 mx-auto mb-4 animate-bounce" />
          <Sparkles className="w-6 h-6 text-yellow-200 absolute -top-1 -right-2 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">邀请好友 · 一起抽卡</h2>
        <p className="text-sm text-white/70">分享专属邀请链接，双方均获丰厚奖励</p>
      </div>

      {/* 内容卡片 */}
      <div className="px-4 space-y-4 pb-12">
        {/* 邀请码 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3">你的专属邀请码</h3>
          <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <span className="text-2xl font-black tracking-[0.3em] text-pink-500">{inviteCode}</span>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                copied
                  ? 'bg-green-100 text-green-600'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {copied ? <><Check className="w-4 h-4 inline mr-1" />已复制</> : <><Copy className="w-4 h-4 inline mr-1" />复制链接</>}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 truncate">链接: {inviteLink}</p>
        </div>

        {/* 奖励规则 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">活动规则</h3>
          <div className="space-y-4">
            {rewardRules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-50 dark:bg-zinc-800 flex items-center justify-center text-xl shrink-0">
                  {rule.icon}
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-pink-500 bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 rounded">步骤 {i + 1}</span>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-white">{rule.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{rule.desc}</p>
                </div>
                {i < rewardRules.length - 1 && (
                  <div className="absolute left-9 mt-10 w-px h-4 bg-pink-200 dark:bg-zinc-700" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 邀请统计 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3">邀请统计</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-pink-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-pink-500">0</p>
              <p className="text-[10px] text-slate-400 mt-0.5">已邀请</p>
            </div>
            <div className="bg-purple-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-purple-500">0</p>
              <p className="text-[10px] text-slate-400 mt-0.5">已注册</p>
            </div>
            <div className="bg-yellow-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-yellow-500">0</p>
              <p className="text-[10px] text-slate-400 mt-0.5">获得星豆</p>
            </div>
          </div>
        </div>

        {/* 分享按钮 */}
        <button
          onClick={handleCopy}
          className="w-full py-3.5 bg-white text-pink-500 rounded-2xl font-bold text-base shadow-xl flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors"
        >
          <Share2 className="w-5 h-5" /> 分享邀请链接
        </button>
      </div>
    </div>
  );
};
