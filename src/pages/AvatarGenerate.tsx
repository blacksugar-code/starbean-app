import { resolveAssetUrl } from '../services/api';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Shield, Info, Loader2, X, CheckCircle, RefreshCw, ChevronLeft, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';

/**
 * 数字形象生成页面
 * NOTE: step 和 generatedImageUrl 状态存储在 Zustand store 中
 *       防止组件因 store 更新触发 re-mount 时丢失状态
 */
export const AvatarGenerate: React.FC = () => {
  const navigate = useNavigate();

  // NOTE: 使用精确 selector 避免不相关状态变化触发 re-render
  const generateAvatar = useStore((s) => s.generateAvatar);
  const digitalAvatarGenerated = useStore((s) => s.user.digitalAvatarGenerated);
  const step = useStore((s) => s.avatarGenerateStep);
  const generatedImageUrl = useStore((s) => s.generatedAvatarUrl);
  const setStep = useStore((s) => s.setAvatarGenerateStep);
  const setGeneratedImageUrl = useStore((s) => s.setGeneratedAvatarUrl);

  const [photos, setPhotos] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string>('');

  /**
   * 处理文件选择，限制最多5张
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
      setError('');
    }
  }, []);

  /**
   * 移除已选择的照片
   */
  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * 开始生成数字形象
   * 调用后端 API，上传照片并等待返回结果
   */
  const isGeneratingRef = React.useRef(false);

  const handleGenerate = async () => {
    if (photos.length < 1 || isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    setStep('generating');
    setError('');

    try {
      const imageUrl = await generateAvatar(photos);
      // NOTE: 将结果写入 store 而非 local state，防止组件重挂载丢失
      setGeneratedImageUrl(imageUrl);
      setStep('preview');
    } catch (err: any) {
      console.error('数字形象生成失败:', err);
      setError(err.message || '生成失败，请重试');
      setStep('upload');
    } finally {
      isGeneratingRef.current = false;
    }
  };

  /**
   * 确认使用当前生成的形象
   */
  const handleConfirm = () => {
    // 重置 store 状态后返回
    setStep('upload');
    setGeneratedImageUrl('');
    navigate('/profile');
  };

  /**
   * 重新生成（回到上传阶段）
   */
  const handleRegenerate = () => {
    setStep('upload');
    setGeneratedImageUrl('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col">
      {/* 头部导航 */}
      <div className="relative h-14 flex items-center px-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
        <button
          onClick={() => {
            // 离开页面时重置状态
            setStep('upload');
            setGeneratedImageUrl('');
            navigate(-1);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-slate-800 dark:text-white">
          {digitalAvatarGenerated ? '修改数字形象' : '生成数字形象'}
        </h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-5">
        {/* 隐私声明 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">隐私保护</h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              您的照片仅用于本次AI形象生成，生成后将立即从服务器删除，不会被存储或用于其他用途。
            </p>
          </div>
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2">
            <X className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* ========== 上传阶段 ========== */}
        {step === 'upload' && (
          <>
            <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 opacity-50 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center w-full">
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-4 text-pink-500">
                  <Upload className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  上传照片 ({photos.length}/5)
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">
                  请上传1-5张清晰的正面照片，照片越多生成效果越好
                </p>

                {/* 照片预览槽位 */}
                <div className="flex gap-2 mb-5 flex-wrap justify-center">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden relative group"
                    >
                      {photos[i] ? (
                        <>
                          <img
                            src={URL.createObjectURL(photos[i])}
                            alt={`照片 ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-300 dark:text-zinc-600 text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* 选择照片按钮 */}
                <label className="cursor-pointer bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform">
                  {photos.length > 0 ? '继续添加' : '选择照片'}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {/* 开始生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={photos.length === 0}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-bold text-lg shadow-lg shadow-pink-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:shadow-xl active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" />
              开始生成 ({photos.length} 张照片)
            </button>
          </>
        )}

        {/* ========== 生成中 ========== */}
        {step === 'generating' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
              </div>
              {/* 脉冲动画环 */}
              <div className="absolute inset-0 rounded-full border-2 border-pink-300/50 animate-ping" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                AI 正在为您创作...
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                正在根据您的照片生成专属数字形象，请耐心等待
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                通常需要 10-30 秒
              </p>
            </div>
          </div>
        )}

        {/* ========== 预览确认 ========== */}
        {step === 'preview' && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white dark:border-zinc-700">
                  <img
                    src={generatedImageUrl}
                    alt="数字形象"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                生成完成！
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
                这是您的专属数字形象，确认后将用于所有合拍模板
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-bold text-lg shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transition-all hover:shadow-xl active:scale-[0.98]"
              >
                <CheckCircle className="w-5 h-5" />
                确认使用
              </button>
              <button
                onClick={handleRegenerate}
                className="w-full py-3 bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 rounded-full font-bold text-sm border border-slate-200 dark:border-zinc-700 flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <RefreshCw className="w-4 h-4" />
                重新生成
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
