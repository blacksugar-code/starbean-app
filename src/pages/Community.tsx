import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Header } from '../components/Header';

export const Community: React.FC = () => {
  const navigate = useNavigate();
  const posts = [
    { id: 1, user: 'Elena_Stars', avatar: 'https://picsum.photos/seed/elena/50', image: 'https://picsum.photos/seed/post1/400/500', content: 'Got a new SR card! Look at this lighting ✨', likes: 124 },
    { id: 2, user: 'CryptoK_Fan', avatar: 'https://picsum.photos/seed/crypto/50', image: 'https://picsum.photos/seed/post2/400/600', content: 'Finally got an SSR! Waited weeks for this series.', likes: 892 },
    { id: 3, user: 'Momo', avatar: 'https://picsum.photos/seed/momo/50', image: 'https://picsum.photos/seed/post3/400/400', content: 'Daily check-in. Have a great day everyone 🌸', likes: 45 },
    { id: 4, user: 'Lucky_Guy', avatar: 'https://picsum.photos/seed/lucky/50', image: 'https://picsum.photos/seed/post4/400/550', content: 'First draw luck! This outfit is amazing!', likes: 2100 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      <Header title="社区" showBack={false} />

      <div className="px-4 py-2 flex justify-center gap-8 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-14 z-30">
        <button className="pb-2 border-b-2 border-pink-500 text-pink-500 font-bold text-sm">推荐</button>
        <button className="pb-2 border-b-2 border-transparent text-slate-500 font-medium text-sm">关注</button>
        <button className="pb-2 border-b-2 border-transparent text-slate-500 font-medium text-sm">圈子</button>
      </div>

      <div className="p-4 columns-2 gap-4 space-y-4">
        {posts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => navigate(`/community/post/${post.id}`)}
            className="break-inside-avoid bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-zinc-800 cursor-pointer hover:shadow-md transition-shadow"
          >
            <img src={post.image} alt="Post" className="w-full h-auto" />
            <div className="p-3">
              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mb-2 line-clamp-2">{post.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <img src={post.avatar} alt={post.user} className="w-5 h-5 rounded-full" />
                  <span className="text-[10px] text-slate-500 truncate max-w-[60px]">{post.user}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Heart className="w-3 h-3" />
                  <span className="text-[10px]">{post.likes}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};
