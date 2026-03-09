import React, { useState } from 'react';
import { Image, LayoutGrid, Star, Users, MessageSquare, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

import { BannerAdmin } from './BannerAdmin';
import { TemplateAdmin } from './TemplateAdmin';
import { ArtistAdmin } from './ArtistAdmin';
import { UserAdmin } from './UserAdmin';
import { CommunityAdmin } from './CommunityAdmin';

type AdminModule = 'banner' | 'template' | 'artist' | 'user' | 'community';

interface NavItem {
  key: AdminModule;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'banner', label: 'Banner', icon: Image },
  { key: 'template', label: '模板管理', icon: LayoutGrid },
  { key: 'artist', label: '明星管理', icon: Star },
  { key: 'user', label: '用户管理', icon: Users },
  { key: 'community', label: '社区管理', icon: MessageSquare },
];

/**
 * 后台管理通用布局
 * 固定左侧导航 + 右侧内容区
 */
export const AdminLayout: React.FC = () => {
  const [activeModule, setActiveModule] = useState<AdminModule>('banner');
  const [collapsed, setCollapsed] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'banner':
        return <BannerAdmin />;
      case 'template':
        return <TemplateAdmin />;
      case 'artist':
        return <ArtistAdmin />;
      case 'user':
        return <UserAdmin />;
      case 'community':
        return <CommunityAdmin />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-56'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-gray-100 gap-2 px-3">
          <Sparkles className="w-6 h-6 text-pink-500 shrink-0" />
          {!collapsed && (
            <span className="text-base font-bold text-gray-800 whitespace-nowrap">
              星豆后台
            </span>
          )}
        </div>

        {/* 导航列表 */}
        <nav className="flex-1 py-3 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeModule === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveModule(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-pink-50 text-pink-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={item.label}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-pink-500' : 'text-gray-400'}`} />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* 折叠按钮 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-10 flex items-center justify-center border-t border-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* 右侧内容区 */}
      <main className="flex-1 overflow-auto">
        {/* 顶部标题栏 */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-800">
            {NAV_ITEMS.find((n) => n.key === activeModule)?.label || '后台管理'}
          </h1>
        </header>
        {/* 内容 */}
        <div className="p-6">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};
