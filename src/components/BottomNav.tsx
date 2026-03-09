import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Wallet, User } from 'lucide-react';
import clsx from 'clsx';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { name: '首页', icon: Home, path: '/' },
    { name: '社区', icon: MessageSquare, path: '/community' },
    { name: '卡包', icon: Wallet, path: '/collection' },
    { name: '我的', icon: User, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-pink-100 dark:border-pink-900/20 pb-safe pt-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto h-16 pb-2">
        {navItems.map((item) => {
          const isActive = path === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                "flex flex-col items-center justify-center w-16 gap-1 transition-colors",
                isActive ? "text-pink-500" : "text-slate-400 hover:text-pink-400"
              )}
            >
              <item.icon 
                className={clsx("w-6 h-6", isActive && "fill-current")} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
