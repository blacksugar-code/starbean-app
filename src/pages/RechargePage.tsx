import React, { useRef, useState } from 'react';
import { ChevronLeft, Plus, Minus, Gem, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const RECHARGE_OPTIONS = [
  { beans: 100, price: 10, label: '入门' },
  { beans: 500, price: 45, label: '热门', hot: true },
  { beans: 1000, price: 80, label: '超值', hot: true },
  { beans: 3000, price: 220, label: '豪华' },
  { beans: 5000, price: 350, label: '至尊' },
  { beans: 10000, price: 650, label: '鲸鱼' },
];

/**
 * 充值页面
 * 选择星豆套餐进行充值
 */
export const RechargePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [selected, setSelected] = useState(1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-3 flex items-center border-b border-slate-100 dark:border-zinc-800 relative">
        <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 z-10">
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-white" />
        </button>
        <h1 className="absolute inset-0 flex items-center justify-center text-base font-bold text-slate-800 dark:text-white pointer-events-none">充值星豆</h1>
      </div>

      {/* 当前余额 */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-5 text-white">
        <p className="text-sm opacity-80">当前余额</p>
        <div className="flex items-baseline gap-2 mt-1">
          <Gem className="w-6 h-6" />
          <span className="text-3xl font-black">{user.starBeans}</span>
          <span className="text-sm opacity-70">星豆</span>
        </div>
      </div>

      {/* 充值套餐 */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3">选择套餐</h3>
        <div className="grid grid-cols-3 gap-3">
          {RECHARGE_OPTIONS.map((opt, i) => (
            <button
              key={opt.beans}
              onClick={() => setSelected(i)}
              className={`relative rounded-2xl p-4 text-center transition-all border-2 ${
                selected === i
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-lg shadow-pink-500/10'
                  : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-pink-200'
              }`}
            >
              {opt.hot && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] font-bold rounded-full">
                  {opt.label}
                </span>
              )}
              {selected === i && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <Gem className={`w-6 h-6 mx-auto mb-1 ${selected === i ? 'text-pink-500' : 'text-slate-400'}`} />
              <p className={`text-xl font-black ${selected === i ? 'text-pink-500' : 'text-slate-800 dark:text-white'}`}>{opt.beans}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">星豆</p>
              <p className={`text-sm font-bold mt-2 ${selected === i ? 'text-pink-500' : 'text-slate-600 dark:text-slate-300'}`}>¥{opt.price}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 支付按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-slate-100 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm text-slate-500">应付金额</span>
          <span className="text-xl font-black text-pink-500">¥{RECHARGE_OPTIONS[selected].price}</span>
        </div>
        <button
          onClick={() => alert('支付功能开发中，敬请期待！')}
          className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 active:scale-[0.98] transition-transform"
        >
          立即充值
        </button>
      </div>
    </div>
  );
};
