import React from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showMore?: boolean;
  className?: string;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = true, 
  showMore = false,
  className,
  transparent = false
}) => {
  const navigate = useNavigate();

  return (
    <header className={clsx(
      "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 h-14",
      transparent ? "bg-transparent text-white" : "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-slate-900 dark:text-white border-b border-pink-100 dark:border-pink-900/20",
      className
    )}>
      <div className="w-10 flex items-center justify-start">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
      </div>
      
      <h1 className="text-lg font-bold truncate flex-1 text-center">{title}</h1>
      
      <div className="w-10 flex items-center justify-end">
        {showMore && (
          <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        )}
      </div>
    </header>
  );
};
