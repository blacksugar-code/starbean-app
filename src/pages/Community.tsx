import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { API_BASE, resolveAssetUrl } from '../services/api';

/** 帖子数据类型 */
interface PostData {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  title: string;
  content: string;
  image_url: string;
  tags: string[];
  likes_count: number;
  created_at: string;
  comments_count: number;
}

export const Community: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recommend' | 'follow'>('recommend');

  /** 从后端获取帖子列表 */
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/posts?limit=50`);
        const data = await res.json();
        setPosts(data || []);
      } catch (e) {
        console.error('获取帖子失败:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  /** 点赞 */
  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/like`, { method: 'POST' });
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: data.likes_count } : p))
      );
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  /** 格式化时间 */
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}分钟前`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}小时前`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}天前`;
      return `${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      <Header title="社区" showBack={false} />

      {/* Tab 栏 */}
      <div className="px-4 py-2 flex justify-center gap-8 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-14 z-30">
        <button
          onClick={() => setActiveTab('recommend')}
          className={`pb-2 border-b-2 text-sm font-medium transition-colors ${
            activeTab === 'recommend' ? 'border-pink-500 text-pink-500 font-bold' : 'border-transparent text-slate-500'
          }`}
        >
          推荐
        </button>
        <button
          onClick={() => setActiveTab('follow')}
          className={`pb-2 border-b-2 text-sm font-medium transition-colors ${
            activeTab === 'follow' ? 'border-pink-500 text-pink-500 font-bold' : 'border-transparent text-slate-500'
          }`}
        >
          关注
        </button>
      </div>

      {/* 加载中 */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
        </div>
      )}

      {/* 空状态 */}
      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">暂无动态，快来发布第一条吧！</p>
        </div>
      )}

      {/* 瀑布流帖子列表 */}
      {!loading && posts.length > 0 && (
        <div className="p-4 columns-2 gap-3 space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/community/post/${post.id}`)}
              className="break-inside-avoid bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-zinc-800 cursor-pointer hover:shadow-md transition-shadow"
            >
              {/* 图片 */}
              {post.image_url && (
                <img
                  src={resolveAssetUrl(post.image_url)}
                  alt=""
                  className="w-full h-auto"
                  loading="lazy"
                />
              )}
              <div className="p-3">
                {/* 标题 */}
                {post.title && (
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">
                    {post.title}
                  </h3>
                )}
                {/* 内容 */}
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">
                  {post.content}
                </p>
                {/* 标签 */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-pink-50 dark:bg-pink-900/30 text-pink-500 px-1.5 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* 用户和互动 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {post.user_avatar ? (
                      <img src={resolveAssetUrl(post.user_avatar)} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
                    )}
                    <span className="text-[10px] text-slate-500 truncate max-w-[60px]">{post.user_name}</span>
                    <span className="text-[10px] text-slate-300 dark:text-zinc-600">{formatTime(post.created_at)}</span>
                  </div>
                  <button
                    onClick={(e) => handleLike(post.id, e)}
                    className="flex items-center gap-1 text-slate-400 hover:text-pink-500 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{post.likes_count || ''}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 悬浮发布按钮 */}
      <button
        onClick={() => navigate('/community/publish')}
        className="fixed right-5 bottom-24 z-40 w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/40 transition-all active:scale-90"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      <BottomNav />
    </div>
  );
};
