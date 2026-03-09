import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Hash, ArrowLeft, Loader2, Send } from 'lucide-react';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

/**
 * 社区发帖页面
 * 支持：标题、内容、图片上传、标签
 */
export const CommunityPublish: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  /** 选择图片 */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('图片不能超过 10MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  /** 移除已选图片 */
  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** 添加标签 */
  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  /** 标签输入回车或空格 */
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addTag();
    }
  };

  /** 移除标签 */
  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  /** 提交发布 */
  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('请输入内容');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let imageUrl = '';

      // 如果有图片先上传
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch(`${API_BASE}/posts/upload-image`, {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('图片上传失败');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.image_url;
      }

      // 发布帖子
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
          tags,
        }),
      });

      if (!res.ok) throw new Error('发布失败');

      // 成功后返回社区页
      navigate('/community', { replace: true });
    } catch (e: any) {
      setError(e.message || '发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-slate-800 dark:text-white">发布动态</span>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold px-4 py-1.5 rounded-full disabled:opacity-50 flex items-center gap-1"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          发布
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* 标题 */}
        <input
          type="text"
          placeholder="添加标题（可选）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className="w-full text-lg font-bold bg-transparent border-none outline-none placeholder-slate-300 dark:placeholder-zinc-600 text-slate-800 dark:text-white"
        />

        {/* 内容 */}
        <textarea
          placeholder="分享你的故事..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={6}
          className="w-full bg-transparent border-none outline-none placeholder-slate-300 dark:placeholder-zinc-600 text-slate-700 dark:text-slate-200 text-sm resize-none leading-relaxed"
        />

        {/* 图片预览 */}
        {imagePreview ? (
          <div className="relative inline-block">
            <img src={imagePreview} alt="预览" className="max-h-60 rounded-xl object-cover" />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-pink-500 transition-colors py-3 px-4 border border-dashed border-slate-200 dark:border-zinc-700 rounded-xl"
          >
            <Camera className="w-5 h-5" />
            添加图片
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

        {/* 标签 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="添加标签，回车确认（最多5个）"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1 text-sm bg-transparent border-none outline-none placeholder-slate-300 dark:placeholder-zinc-600 text-slate-700 dark:text-slate-200"
            />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs bg-pink-50 dark:bg-pink-900/30 text-pink-500 px-2.5 py-1 rounded-full"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-pink-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
