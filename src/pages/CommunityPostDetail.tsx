import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Heart, Star, ChevronRight, Sparkles, Send } from 'lucide-react';

export const CommunityPostDetail: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [comment, setComment] = useState('');

  // Mock Data (matching the HTML example)
  const post = {
    id: postId,
    image: 'https://picsum.photos/seed/post_detail_ssr/800/1000', // Placeholder for the SSR card image
    rarity: 'SSR',
    author: {
      name: '星豆官方画师',
      avatar: 'https://picsum.photos/seed/official_artist/100/100',
      time: '今天 14:30 发布'
    },
    title: '惊艳绝伦！最新星豆AI卡片掉落 ✨',
    celebrity: {
      name: '林小豆',
      avatar: 'https://picsum.photos/seed/linxiaodou/100/100'
    },
    content: '快来看看这张超级稀有的星豆AI卡片，细节拉满，光影质感精美绝伦！通过最新的图生图算法生成，完美还原了神韵。大家觉得如何？这绝对是粉丝必备的电子收藏品！喜欢的话赶紧抱走吧～ 💖',
    tags: ['#星豆AI', '#明星周边', '#神级画质', '#粉丝福利', '#电子手办'],
    stats: {
      likes: '8.2k',
      stars: '1.5k',
      comments: 128
    },
    comments: [
      {
        id: 1,
        user: '追星少女阿瑶',
        avatar: 'https://picsum.photos/seed/ayao/100/100',
        content: '啊啊啊啊太好好看了吧！质感真的像实物一样，求原图当壁纸！',
        likes: 45,
        time: '刚刚',
        location: '广东'
      },
      {
        id: 2,
        user: '卡牌收集控',
        avatar: 'https://picsum.photos/seed/collector/100/100',
        content: '这张SSR绝了，星豆的AI技术越来越强了，准备用同款配方去试着捏一张自己的爱豆！',
        likes: 12,
        time: '20分钟前',
        location: '北京'
      }
    ]
  };

  const handleSendComment = () => {
    if (!comment.trim()) return;
    // In a real app, this would send the comment to the backend
    console.log('Sending comment:', comment);
    setComment('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans pb-24">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto border border-white/30 shadow-sm hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto border border-white/30 shadow-sm hover:bg-white/30 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      <main className="w-full min-h-screen shadow-sm relative">
        {/* Image Section */}
        <div className="relative w-full aspect-[3/4] bg-slate-100 dark:bg-zinc-800 overflow-hidden">
          <div 
            className="w-full h-full bg-cover bg-center" 
            style={{ backgroundImage: `url(${post.image})` }}
          ></div>
          
          {/* Rarity Badge */}
          <div className="absolute top-16 right-4 bg-white/40 backdrop-blur-md border border-white/50 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
            <Sparkles className="w-4 h-4 text-[#ec5b13] fill-[#ec5b13]" />
            <span className="text-[#ec5b13] font-bold text-xs tracking-wider uppercase">{post.rarity} 级稀有</span>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-50 dark:from-zinc-950 to-transparent"></div>
        </div>

        {/* Content Section */}
        <div className="px-5 pt-1 pb-4 relative z-10 bg-slate-50 dark:bg-zinc-950 -mt-4 rounded-t-3xl">
          {/* Author Info */}
          <div className="flex items-center justify-between mb-5 pt-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-full bg-cover bg-center border-2 border-white dark:border-zinc-800 shadow-sm"
                style={{ backgroundImage: `url(${post.author.avatar})` }}
              ></div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">{post.author.name}</span>
                <span className="text-slate-400 text-xs mt-0.5">{post.author.time}</span>
              </div>
            </div>
            <button className="px-5 py-1.5 rounded-full bg-[#ec5b13]/10 text-[#ec5b13] font-semibold text-sm hover:bg-[#ec5b13]/20 transition-colors border border-[#ec5b13]/20">
              关注
            </button>
          </div>

          <h1 className="text-[20px] font-bold text-slate-900 dark:text-white mb-4 leading-snug tracking-tight">
            {post.title}
          </h1>

          {/* Celebrity Tag */}
          <div className="mb-5 p-3 rounded-xl bg-[#ec5b13]/5 border border-[#ec5b13]/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-14 h-14 rounded-full bg-cover bg-center border-2 border-white dark:border-zinc-800 shadow-sm ring-2 ring-[#ec5b13]/10"
                style={{ backgroundImage: `url(${post.celebrity.avatar})` }}
              ></div>
              <div className="flex flex-col">
                <span className="text-xs text-[#ec5b13] font-semibold uppercase tracking-wider mb-0.5">图中艺人</span>
                <span className="font-bold text-slate-900 dark:text-white text-base">{post.celebrity.name}</span>
              </div>
            </div>
            <button className="flex items-center gap-1 text-[#ec5b13] font-bold text-xs bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-full shadow-sm border border-[#ec5b13]/10">
              查看资料 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed mb-4">
            {post.content}
            <br/><br/>
            <span className="text-[#ec5b13]/90 font-medium">
              {post.tags.join(' ')}
            </span>
          </p>

          <div className="h-px w-full bg-slate-200 dark:bg-zinc-800 my-4"></div>
        </div>

        {/* Comments Section */}
        <div className="px-5 pb-12 bg-slate-50 dark:bg-zinc-950">
          <h3 className="text-[13px] font-medium text-slate-500 mb-5">共 {post.stats.comments} 条评论</h3>
          
          {post.comments.map(comment => (
            <div key={comment.id} className="flex gap-3 mb-6">
              <div 
                className="w-8 h-8 rounded-full bg-cover bg-center shrink-0 mt-1"
                style={{ backgroundImage: `url(${comment.avatar})` }}
              ></div>
              <div className="flex-1 border-b border-slate-100 dark:border-zinc-800 pb-5">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-slate-500 text-[13px] font-medium">{comment.user}</span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Heart className="w-3.5 h-3.5" />
                    <span className="text-xs">{comment.likes}</span>
                  </div>
                </div>
                <p className="text-slate-800 dark:text-slate-200 text-[14px] leading-relaxed mb-2">{comment.content}</p>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>{comment.time}</span>
                  <span>{comment.location}</span>
                  <span className="font-medium">回复</span>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center text-slate-400 text-xs py-4">没有更多评论了</div>
        </div>
      </main>

      {/* Bottom Fixed Bar */}
      <div className="fixed bottom-0 left-0 w-full z-50 pb-[env(safe-area-inset-bottom)] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              className="w-full bg-slate-100 dark:bg-zinc-800 border-none rounded-full py-2 pl-4 pr-10 text-[15px] focus:ring-1 focus:ring-[#ec5b13] placeholder:text-slate-400 outline-none text-slate-900 dark:text-slate-100" 
              placeholder="说点什么..." 
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {comment && (
              <button 
                onClick={handleSendComment}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-[#ec5b13] rounded-full text-white hover:bg-[#d64b0f] transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4 px-1">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`flex flex-col items-center cursor-pointer transition-colors ${isLiked ? 'text-[#ec5b13]' : 'text-slate-500 hover:text-[#ec5b13]'}`}
            >
              <Heart className={`w-[22px] h-[22px] ${isLiked ? 'fill-[#ec5b13]' : ''}`} />
              <span className="text-[9px] font-bold">{post.stats.likes}</span>
            </button>
            <button 
              onClick={() => setIsStarred(!isStarred)}
              className={`flex flex-col items-center cursor-pointer transition-colors ${isStarred ? 'text-[#ec5b13]' : 'text-slate-500 hover:text-[#ec5b13]'}`}
            >
              <Star className={`w-[22px] h-[22px] ${isStarred ? 'fill-[#ec5b13]' : ''}`} />
              <span className="text-[9px] font-bold">{post.stats.stars}</span>
            </button>
          </div>
          
          <button 
            onClick={() => navigate('/gacha/1')}
            className="bg-gradient-to-r from-[#ec5b13] to-[#ff7e3d] text-white px-4 py-2 rounded-full font-bold text-[13px] flex items-center gap-1.5 shadow-md shadow-[#ec5b13]/25 active:scale-95 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            拍同款
          </button>
        </div>
      </div>
    </div>
  );
};
