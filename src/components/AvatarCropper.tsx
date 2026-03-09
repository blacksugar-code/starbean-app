import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react';

interface AvatarCropperProps {
  /** 用户选中的原始文件 */
  file: File;
  /** 裁剪完成回调，返回裁剪后的 Blob */
  onCrop: (blob: Blob) => void;
  /** 取消裁剪 */
  onCancel: () => void;
}

/**
 * 头像裁剪组件
 * 支持拖动平移和缩放，圆形预览，导出正方形裁剪图
 */
export const AvatarCropper: React.FC<AvatarCropperProps> = ({ file, onCrop, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 图片加载状态
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 缩放和位置
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  // 触摸缩放
  const lastPinchDist = useRef<number | null>(null);

  // 裁剪区域大小（正方形边长，像素）
  const CROP_SIZE = 280;
  const CANVAS_SIZE = 320;

  // 加载用户选中的图片
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // 初始缩放：让图片短边填满裁剪框
      const minDim = Math.min(img.width, img.height);
      const initScale = CROP_SIZE / minDim;
      setScale(initScale);
      // 居中偏移
      setOffset({
        x: (CANVAS_SIZE - img.width * initScale) / 2,
        y: (CANVAS_SIZE - img.height * initScale) / 2,
      });
      setLoaded(true);
    };
    img.src = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(img.src);
  }, [file]);

  // 每次 scale/offset 变化重绘画布
  useEffect(() => {
    if (!loaded || !imgRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 绘制图片
    const img = imgRef.current;
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);

    // 绘制遮罩（裁剪区域外半透明）
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // 圆形裁剪区域
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const r = CROP_SIZE / 2;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 圆环边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }, [scale, offset, loaded]);

  // 鼠标拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);
  const handleMouseUp = () => { isDragging.current = false; };

  // 触摸拖动 + 双指缩放
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
      lastPinchDist.current = dist;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
      const delta = dist / lastPinchDist.current;
      lastPinchDist.current = dist;
      setScale((prev) => Math.max(0.1, Math.min(5, prev * delta)));
    }
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    lastPinchDist.current = null;
  };

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.95 : 1.05;
    setScale((prev) => Math.max(0.1, Math.min(5, prev * factor)));
  };

  // 缩放按钮
  const zoomIn = () => setScale((prev) => Math.min(5, prev * 1.15));
  const zoomOut = () => setScale((prev) => Math.max(0.1, prev / 1.15));

  // 重置
  const resetView = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const minDim = Math.min(img.width, img.height);
    const initScale = CROP_SIZE / minDim;
    setScale(initScale);
    setOffset({
      x: (CANVAS_SIZE - img.width * initScale) / 2,
      y: (CANVAS_SIZE - img.height * initScale) / 2,
    });
  };

  // 确认裁剪
  const handleConfirm = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const outputSize = 512; // 输出 512x512 正方形

    const offscreen = document.createElement('canvas');
    offscreen.width = outputSize;
    offscreen.height = outputSize;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // 计算裁剪区域对应的源图片坐标
    const cropLeft = (CANVAS_SIZE - CROP_SIZE) / 2;
    const cropTop = (CANVAS_SIZE - CROP_SIZE) / 2;
    // 图片在画布上的位置反推到原始图片坐标
    const srcX = (cropLeft - offset.x) / scale;
    const srcY = (cropTop - offset.y) / scale;
    const srcW = CROP_SIZE / scale;
    const srcH = CROP_SIZE / scale;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);

    offscreen.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      'image/jpeg',
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center" onClick={onCancel}>
      <div className="bg-zinc-900 rounded-2xl w-full max-w-[360px] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <button onClick={onCancel} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-bold text-white">调整头像</h3>
          <button onClick={handleConfirm} className="p-1 text-pink-400 hover:text-pink-300">
            <Check className="w-5 h-5" />
          </button>
        </div>

        {/* 裁剪区域 */}
        <div
          ref={containerRef}
          className="relative flex items-center justify-center bg-black cursor-grab active:cursor-grabbing select-none"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, margin: '0 auto' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="block" />
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">加载中...</div>
          )}
        </div>

        {/* 缩放控制 */}
        <div className="flex items-center justify-center gap-6 py-3 bg-zinc-900 border-t border-zinc-800">
          <button onClick={zoomOut} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
            <ZoomOut className="w-5 h-5" />
          </button>
          <div className="w-24 text-center text-xs text-zinc-500">{Math.round(scale * 100)}%</div>
          <button onClick={zoomIn} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={resetView} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors" title="重置">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 px-4 pb-4">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-zinc-600 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-800">取消</button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600">确认</button>
        </div>
      </div>
    </div>
  );
};
