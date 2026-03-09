import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Shield, Info, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Header } from '../components/Header';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { generateAvatar, setUserAvatar } = useStore();
  const [photos, setPhotos] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
    }
  };

  /**
   * 生成数字形象
   * 调用后端 Nanobanana API（当前为 Mock）
   */
  const handleGenerate = async () => {
    if (photos.length < 1) return;

    setIsGenerating(true);
    try {
      // 调用后端生成数字形象
      await generateAvatar(photos);
      navigate('/');
    } catch (error) {
      console.error('Generation failed:', error);
      // FIXME: 后端不可用时使用本地 Mock 作为降级方案
      const mockUrl = `https://picsum.photos/seed/${Date.now()}/400/400`;
      setUserAvatar(mockUrl);
      navigate('/');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col">
      <Header title="上传照片" showBack={false} />

      <div className="flex-1 px-4 py-6 flex flex-col gap-6">
        {/* Privacy Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">隐私保护</h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              您的照片仅用于本次AI生成，生成后将立即删除。
            </p>
          </div>
          <Info className="w-4 h-4 text-blue-400" />
        </div>

        {/* Upload Area */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 flex flex-col items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 opacity-50 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-4 text-pink-500">
              <Upload className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">上传照片 ({photos.length}/5)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
              请上传5张清晰的正面照片以生成您的专属数字形象。
            </p>

            <div className="flex gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                  {photos[i] ? (
                    <img src={URL.createObjectURL(photos[i])} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-300 text-xs">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>

            <label className="cursor-pointer bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform">
              选择照片
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGenerate}
          disabled={photos.length === 0 || isGenerating}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-bold text-lg shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              正在生成形象...
            </>
          ) : (
            <>
              确认生成
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
