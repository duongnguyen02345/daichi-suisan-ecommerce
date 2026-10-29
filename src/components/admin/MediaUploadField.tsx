import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Trash2, FolderOpen, ExternalLink, Loader2 } from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';
import { MediaAsset } from '../../types';
import { uploadMediaAsset } from '../../lib/mediaApi';

interface MediaUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  description?: string;
  folder?: 'branding' | 'banners' | 'products' | 'pages' | 'articles' | 'common';
  aspectRatioClass?: string;
  previewHeightClass?: string;
}

export const MediaUploadField: React.FC<MediaUploadFieldProps> = ({
  label,
  value,
  onChange,
  description,
  folder = 'branding',
  aspectRatioClass = 'aspect-video',
  previewHeightClass = 'h-32',
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    try {
      const asset = await uploadMediaAsset(file, { folder });
      onChange(asset.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải ảnh lên thất bại.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handlePickerSelect = (asset: MediaAsset) => {
    onChange(asset.publicUrl);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">{label}</label>
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
          >
            <span>Mở ảnh gốc</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {description && <p className="text-[11px] text-gray-500 leading-relaxed">{description}</p>}

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Preview Container */}
        <div
          className={`relative ${previewHeightClass} ${aspectRatioClass} w-full sm:w-auto min-w-[140px] rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-none group`}
        >
          {value ? (
            <>
              <img src={value} alt={label} className="w-full h-full object-contain p-1" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute top-1.5 right-1.5 p-1 bg-red-600/80 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-sm"
                title="Xóa ảnh"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 p-3 text-center">
              <ImageIcon className="w-6 h-6 stroke-[1.5]" />
              <span className="text-[10px] mt-1 font-medium">Chưa có ảnh</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-1 space-y-2 w-full">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0E7A32] rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-emerald-200"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Chọn từ thư viện</span>
            </button>

            <label className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-gray-200 cursor-pointer shadow-xs">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-[#0E7A32]" /> : <Upload className="w-4 h-4 text-gray-500" />}
              <span>{isUploading ? 'Đang tải lên...' : 'Tải ảnh trực tiếp'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon"
                onChange={handleDirectUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium transition"
              >
                Xóa
              </button>
            )}
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Hoặc dán trực tiếp URL ảnh tại đây..."
            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
          />

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        </div>
      </div>

      <MediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handlePickerSelect}
        title={`Chọn ảnh cho: ${label}`}
        allowedFolder={folder}
      />
    </div>
  );
};
