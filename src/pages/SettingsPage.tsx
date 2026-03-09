import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Shield, Bell, Lock, FileText, Eye, UserX, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface SettingItem {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick?: () => void;
  danger?: boolean;
}

/**
 * 基础设置页面
 * 包含：账号安全、隐私设置、通知管理、用户协议、隐私政策、账号注销
 */
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { resetUser } = useStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: '账号与安全',
      items: [
        { icon: Shield, label: '账号安全', color: 'text-blue-500', onClick: () => alert('功能开发中') },
        { icon: Eye, label: '隐私设置', color: 'text-purple-500', onClick: () => alert('功能开发中') },
        { icon: Bell, label: '通知管理', color: 'text-orange-500', onClick: () => alert('功能开发中') },
      ],
    },
    {
      title: '关于',
      items: [
        { icon: FileText, label: '用户协议', color: 'text-slate-500', onClick: () => alert('用户协议页面开发中') },
        { icon: Lock, label: '隐私政策', color: 'text-slate-500', onClick: () => alert('隐私政策页面开发中') },
      ],
    },
    {
      title: '其他',
      items: [
        { icon: LogOut, label: '退出登录', color: 'text-orange-500', onClick: () => setShowLogoutConfirm(true) },
        { icon: UserX, label: '注销账号', color: 'text-red-500', onClick: () => setShowDeleteConfirm(true), danger: true },
      ],
    },
  ];

  const handleLogout = () => {
    resetUser();
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    // NOTE: 生产环境需要后端删除用户数据
    resetUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-3 flex items-center border-b border-slate-100 dark:border-zinc-800">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-slate-800 dark:text-white -ml-9">设置</h1>
      </div>

      <div className="p-4 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-1">{section.title}</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800 ${
                    i < section.items.length - 1 ? 'border-b border-slate-50 dark:border-zinc-800' : ''
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className={`flex-1 text-sm font-medium ${item.danger ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 版本号 */}
        <p className="text-center text-xs text-slate-300 dark:text-zinc-600 pt-4">
          星豆 StarBean v1.0.0
        </p>
      </div>

      {/* 退出登录确认 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <LogOut className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">退出登录</h3>
            <p className="text-sm text-slate-500 mb-6">确定要退出当前账号吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">取消</button>
              <button onClick={handleLogout} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600">退出</button>
            </div>
          </div>
        </div>
      )}

      {/* 注销账号确认 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <UserX className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">注销账号</h3>
            <p className="text-sm text-slate-500 mb-1">此操作将永久删除所有数据</p>
            <p className="text-xs text-red-400 mb-6">⚠️ 不可恢复</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">取消</button>
              <button onClick={handleDeleteAccount} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">确认注销</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
