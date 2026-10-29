import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onComplete: (croppedDataUrl: string) => void;
  targetWidth?: number;
  targetHeight?: number;
  title?: string;
  aspectRatioLabel?: string;
}

const MAX_BOX_W = 500;
const MAX_BOX_H = 340;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onComplete,
  targetWidth = 800,
  targetHeight = 800,
  title,
  aspectRatioLabel,
}) => {
  const targetRatio = targetWidth && targetHeight ? targetWidth / targetHeight : 1;
  let cropBoxW = MAX_BOX_W;
  let cropBoxH = Math.round(cropBoxW / targetRatio);

  if (cropBoxH > MAX_BOX_H) {
    cropBoxH = MAX_BOX_H;
    cropBoxW = Math.round(cropBoxH * targetRatio);
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Load image when imageSrc or isOpen changes
  useEffect(() => {
    if (!imageSrc || !isOpen) {
      setImgElement(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Draw crop preview onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nw = imgElement.naturalWidth || 1;
    const nh = imgElement.naturalHeight || 1;

    // Base scale so the image completely fills the crop box
    const baseScale = Math.max(cropBoxW / nw, cropBoxH / nh);
    const currentScale = baseScale * zoom;
    const drawnW = nw * currentScale;
    const drawnH = nh * currentScale;

    // Keep offset within bounds so no empty background shows
    const maxOffsetX = Math.max(0, (drawnW - cropBoxW) / 2);
    const maxOffsetY = Math.max(0, (drawnH - cropBoxH) / 2);

    const clampedX = Math.min(maxOffsetX, Math.max(-maxOffsetX, offset.x));
    const clampedY = Math.min(maxOffsetY, Math.max(-maxOffsetY, offset.y));

    const imgX = (cropBoxW - drawnW) / 2 + clampedX;
    const imgY = (cropBoxH - drawnH) / 2 + clampedY;

    ctx.clearRect(0, 0, cropBoxW, cropBoxH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgElement, imgX, imgY, drawnW, drawnH);

    // Subtle crop guide grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Horizontal thirds
    ctx.moveTo(0, cropBoxH / 3);
    ctx.lineTo(cropBoxW, cropBoxH / 3);
    ctx.moveTo(0, (cropBoxH * 2) / 3);
    ctx.lineTo(cropBoxW, (cropBoxH * 2) / 3);
    // Vertical thirds
    ctx.moveTo(cropBoxW / 3, 0);
    ctx.lineTo(cropBoxW / 3, cropBoxH);
    ctx.moveTo((cropBoxW * 2) / 3, 0);
    ctx.lineTo((cropBoxW * 2) / 3, cropBoxH);
    ctx.stroke();
  }, [imgElement, zoom, offset, cropBoxW, cropBoxH]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(3, Math.max(1, +(prev + delta).toFixed(2))));
  };

  const handleConfirm = () => {
    if (!imgElement) return;

    const nw = imgElement.naturalWidth || 1;
    const nh = imgElement.naturalHeight || 1;

    const baseScale = Math.max(cropBoxW / nw, cropBoxH / nh);
    const currentScale = baseScale * zoom;
    const drawnW = nw * currentScale;
    const drawnH = nh * currentScale;

    const maxOffsetX = Math.max(0, (drawnW - cropBoxW) / 2);
    const maxOffsetY = Math.max(0, (drawnH - cropBoxH) / 2);

    const clampedX = Math.min(maxOffsetX, Math.max(-maxOffsetX, offset.x));
    const clampedY = Math.min(maxOffsetY, Math.max(-maxOffsetY, offset.y));

    const imgX = (cropBoxW - drawnW) / 2 + clampedX;
    const imgY = (cropBoxH - drawnH) / 2 + clampedY;

    // Map crop box back to source image coordinates
    const sx = (0 - imgX) / currentScale;
    const sy = (0 - imgY) / currentScale;
    const sw = cropBoxW / currentScale;
    const sh = cropBoxH / currentScale;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    exportCtx.imageSmoothingEnabled = true;
    exportCtx.imageSmoothingQuality = 'high';
    exportCtx.drawImage(imgElement, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

    const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.88);
    onComplete(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 animate-fadeSlideUp flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <h3 className="font-bold text-gray-900 text-lg">
            {title || (targetWidth === 800 && targetHeight === 800 ? 'Cắt ảnh sản phẩm' : 'Cắt ảnh')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Area with Dark Backdrop */}
        <div className="bg-[#52525b] p-6 flex flex-col items-center justify-center select-none overflow-hidden min-h-[360px]">
          <div
            className="relative border-2 border-white rounded-lg shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing bg-black"
            style={{ width: cropBoxW, height: cropBoxH }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              width={cropBoxW}
              height={cropBoxH}
              className="block"
            />
          </div>
        </div>

        {/* Zoom Controls & Requirements */}
        <div className="p-5 flex flex-col items-center bg-white border-b border-gray-100">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
              className="text-gray-500 hover:text-gray-800 p-1"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
              className="text-gray-500 hover:text-gray-800 p-1"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 font-medium">
            {targetWidth === 800 && targetHeight === 800
              ? 'Kích thước yêu cầu: Tối thiểu 400x400px (Chuẩn 800x800px, Tối đa 2MB)'
              : `Kích thước chuẩn: ${targetWidth} × ${targetHeight}px ${aspectRatioLabel ? `(Tỷ lệ ${aspectRatioLabel})` : ''} · Tối đa 2MB`}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 flex items-center justify-between bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg text-sm transition"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition shadow-sm"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
