import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crop,
  RotateCw,
  Sparkles,
  Maximize2,
  Check,
  X,
  ScanLine,
  Sliders,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { ocrService, CropRect } from '../../services/ocrService';

interface ReceiptCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onConfirmCrop: (processedDataUrl: string, rawCroppedUrl: string) => void;
}

export const ReceiptCropModal: React.FC<ReceiptCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onConfirmCrop,
}) => {
  const [crop, setCrop] = useState<CropRect>({ x: 0.1, y: 0.05, width: 0.8, height: 0.9 });
  const [rotation, setRotation] = useState<number>(0);
  const [enhanceBinarization, setEnhanceBinarization] = useState<boolean>(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);
  const [isProcessingPreview, setIsProcessingPreview] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Drag state
  const dragRef = useRef<{
    type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | null;
    startX: number;
    startY: number;
    startCrop: CropRect;
  }>({
    type: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 0.1, y: 0.05, width: 0.8, height: 0.9 },
  });

  // When modal opens, auto-detect receipt bounds
  useEffect(() => {
    if (isOpen && imageSrc) {
      setRotation(0);
      setEnhanceBinarization(true);
      setShowLivePreview(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const autoBounds = ocrService.detectReceiptBounds(img);
          setCrop(autoBounds);
        } catch {
          setCrop({ x: 0.1, y: 0.05, width: 0.8, height: 0.9 });
        }
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  // Update preview when crop or enhance changes
  const updatePreview = useCallback(async () => {
    if (!imageSrc || !imgRef.current) return;
    setIsProcessingPreview(true);
    try {
      const { previewDataUrl } = await ocrService.cropAndPreprocess(
        imgRef.current,
        crop,
        rotation,
        enhanceBinarization
      );
      setPreviewUrl(previewDataUrl);
    } catch (e) {
      console.warn('Failed to generate crop preview:', e);
    } finally {
      setIsProcessingPreview(false);
    }
  }, [imageSrc, crop, rotation, enhanceBinarization]);

  useEffect(() => {
    if (isOpen && showLivePreview) {
      const timer = setTimeout(() => {
        updatePreview();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showLivePreview, crop, rotation, enhanceBinarization, updatePreview]);

  if (!isOpen) return null;

  // Handle Drag Start
  const handleDragStart = (
    e: React.MouseEvent | React.TouchEvent,
    type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragRef.current = {
      type,
      startX: clientX,
      startY: clientY,
      startCrop: { ...crop },
    };

    const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragRef.current.type || !containerRef.current) return;

      const curX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const curY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;

      const rect = containerRef.current.getBoundingClientRect();
      const dx = (curX - dragRef.current.startX) / rect.width;
      const dy = (curY - dragRef.current.startY) / rect.height;

      const { startCrop, type: actionType } = dragRef.current;
      let newCrop = { ...startCrop };

      if (actionType === 'move') {
        newCrop.x = Math.max(0, Math.min(1 - startCrop.width, startCrop.x + dx));
        newCrop.y = Math.max(0, Math.min(1 - startCrop.height, startCrop.y + dy));
      } else {
        // Resizing
        if (actionType.includes('w')) {
          const right = startCrop.x + startCrop.width;
          newCrop.x = Math.max(0, Math.min(right - 0.1, startCrop.x + dx));
          newCrop.width = right - newCrop.x;
        }
        if (actionType.includes('e')) {
          newCrop.width = Math.max(0.1, Math.min(1 - startCrop.x, startCrop.width + dx));
        }
        if (actionType.includes('n')) {
          const bottom = startCrop.y + startCrop.height;
          newCrop.y = Math.max(0, Math.min(bottom - 0.1, startCrop.y + dy));
          newCrop.height = bottom - newCrop.y;
        }
        if (actionType.includes('s')) {
          newCrop.height = Math.max(0.1, Math.min(1 - startCrop.y, startCrop.height + dy));
        }
      }

      setCrop(newCrop);
    };

    const handlePointerUp = () => {
      dragRef.current.type = null;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  // Reset to auto bounds
  const handleAutoFit = () => {
    if (imgRef.current) {
      const bounds = ocrService.detectReceiptBounds(imgRef.current);
      setCrop(bounds);
    }
  };

  // Reset to full image
  const handleResetFull = () => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  };

  // Rotate 90 deg
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Confirm and start OCR
  const handleConfirm = async () => {
    if (!imgRef.current) return;
    try {
      const { processedDataUrl, rawCroppedUrl } = await ocrService.cropAndPreprocess(
        imgRef.current,
        crop,
        rotation,
        enhanceBinarization
      );
      onConfirmCrop(processedDataUrl, rawCroppedUrl);
    } catch (err) {
      console.error('Failed to crop receipt:', err);
      onConfirmCrop(imageSrc, imageSrc);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Crop className="w-5 h-5 text-teal-600" />
              小票区域裁切与增强 (去杂色)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              拖动边缘框选仅包含小票纸张的范围，彻底去除藤编、桌面及阴影干扰
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAutoFit}
              className="px-2.5 py-1.5 bg-white hover:bg-teal-50 text-teal-700 font-medium rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1 transition-colors"
              title="自动寻找小票白色纸张边界"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              智能贴合纸张
            </button>
            <button
              type="button"
              onClick={handleResetFull}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              全图
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1 transition-colors"
              title="顺时针旋转90度"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
              旋转90° {rotation > 0 && `(${rotation}°)`}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700">
              <input
                type="checkbox"
                checked={enhanceBinarization}
                onChange={(e) => setEnhanceBinarization(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span className="font-medium text-[11px] text-slate-700">热敏纸黑白去噪</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setShowLivePreview(!showLivePreview);
                if (!showLivePreview) updatePreview();
              }}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 transition-colors ${
                showLivePreview
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3 h-3" />
              效果预览
            </button>
          </div>
        </div>

        {/* Main Crop Viewport */}
        <div className="relative flex-1 p-4 bg-slate-900/95 flex items-center justify-center overflow-hidden min-h-[260px] select-none">
          {showLivePreview ? (
            <div className="flex flex-col items-center justify-center max-h-[50vh] overflow-auto p-2 bg-slate-800 rounded-xl">
              {isProcessingPreview ? (
                <div className="text-white text-xs py-8">正在生成高对比去杂色效果...</div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Enhanced Crop Preview"
                  className="max-h-[46vh] max-w-full object-contain rounded-sm border border-slate-700"
                />
              ) : (
                <div className="text-slate-400 text-xs py-8">暂无预览</div>
              )}
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative inline-block max-w-full max-h-[50vh] touch-none"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease',
              }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Source Receipt"
                className="max-h-[48vh] max-w-full object-contain block pointer-events-none"
              />

              {/* Mask overlay outside crop */}
              {/* Top mask */}
              <div
                className="absolute left-0 right-0 top-0 bg-black/60 pointer-events-none"
                style={{ height: `${crop.y * 100}%` }}
              />
              {/* Bottom mask */}
              <div
                className="absolute left-0 right-0 bottom-0 bg-black/60 pointer-events-none"
                style={{ height: `${(1 - (crop.y + crop.height)) * 100}%` }}
              />
              {/* Left mask */}
              <div
                className="absolute left-0 bg-black/60 pointer-events-none"
                style={{
                  top: `${crop.y * 100}%`,
                  height: `${crop.height * 100}%`,
                  width: `${crop.x * 100}%`,
                }}
              />
              {/* Right mask */}
              <div
                className="absolute right-0 bg-black/60 pointer-events-none"
                style={{
                  top: `${crop.y * 100}%`,
                  height: `${crop.height * 100}%`,
                  width: `${(1 - (crop.x + crop.width)) * 100}%`,
                }}
              />

              {/* Crop Box Window */}
              <div
                className="absolute border-2 border-teal-400 shadow-sm cursor-move flex items-center justify-center group"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.width * 100}%`,
                  height: `${crop.height * 100}%`,
                }}
                onMouseDown={(e) => handleDragStart(e, 'move')}
                onTouchStart={(e) => handleDragStart(e, 'move')}
              >
                {/* Center crosshair / guide */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-teal-300/40" />
                  <div className="border-r border-b border-teal-300/40" />
                  <div className="border-b border-teal-300/40" />
                  <div className="border-r border-b border-teal-300/40" />
                  <div className="border-r border-b border-teal-300/40" />
                  <div className="border-b border-teal-300/40" />
                  <div className="border-r border-teal-300/40" />
                  <div className="border-r border-teal-300/40" />
                  <div />
                </div>

                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-teal-300 font-mono pointer-events-none">
                  按住拖动调整小票区域
                </div>

                {/* 4 Corner Handles */}
                <div
                  className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-teal-400 border-2 border-white rounded-full shadow-md cursor-nwse-resize z-10"
                  onMouseDown={(e) => handleDragStart(e, 'nw')}
                  onTouchStart={(e) => handleDragStart(e, 'nw')}
                />
                <div
                  className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-teal-400 border-2 border-white rounded-full shadow-md cursor-nesw-resize z-10"
                  onMouseDown={(e) => handleDragStart(e, 'ne')}
                  onTouchStart={(e) => handleDragStart(e, 'ne')}
                />
                <div
                  className="absolute -bottom-2.5 -left-2.5 w-6 h-6 bg-teal-400 border-2 border-white rounded-full shadow-md cursor-nesw-resize z-10"
                  onMouseDown={(e) => handleDragStart(e, 'sw')}
                  onTouchStart={(e) => handleDragStart(e, 'sw')}
                />
                <div
                  className="absolute -bottom-2.5 -right-2.5 w-6 h-6 bg-teal-400 border-2 border-white rounded-full shadow-md cursor-nwse-resize z-10"
                  onMouseDown={(e) => handleDragStart(e, 'se')}
                  onTouchStart={(e) => handleDragStart(e, 'se')}
                />

                {/* 4 Edge Handles */}
                <div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-teal-300/80 rounded-full cursor-ns-resize"
                  onMouseDown={(e) => handleDragStart(e, 'n')}
                  onTouchStart={(e) => handleDragStart(e, 'n')}
                />
                <div
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-teal-300/80 rounded-full cursor-ns-resize"
                  onMouseDown={(e) => handleDragStart(e, 's')}
                  onTouchStart={(e) => handleDragStart(e, 's')}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -left-1.5 h-8 w-3 bg-teal-300/80 rounded-full cursor-ew-resize"
                  onMouseDown={(e) => handleDragStart(e, 'w')}
                  onTouchStart={(e) => handleDragStart(e, 'w')}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -right-1.5 h-8 w-3 bg-teal-300/80 rounded-full cursor-ew-resize"
                  onMouseDown={(e) => handleDragStart(e, 'e')}
                  onTouchStart={(e) => handleDragStart(e, 'e')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span>裁切掉背景能 100% 杜绝藤编或反光产生的虚假字符</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <ScanLine className="w-4 h-4" />
              <span>开始本地 OCR 识别</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
