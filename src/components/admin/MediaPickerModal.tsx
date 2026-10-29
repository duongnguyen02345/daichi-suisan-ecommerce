import React, { useEffect, useState } from 'react';
import { X, Search, Upload, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { MediaAsset } from '../../types';
import { loadMediaAssets, uploadMediaAsset } from '../../lib/mediaApi';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  title?: string;
  allowedFolder?: 'branding' | 'banners' | 'products' | 'categories' | 'pages' | 'articles' | 'common';
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Chọn hình ảnh từ thư viện',
  allowedFolder = 'common',
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [mimeFilter, setMimeFilter] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [error, setError] = useState('');

  const fetchAssets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await loadMediaAssets({
        search,
        mimeFilter,
      });
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thư viện ảnh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchAssets();
      setSelectedAsset(null);
    }
  }, [isOpen, search, mimeFilter]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    try {
      const uploaded = await uploadMediaAsset(file, { folder: allowedFolder });
      setAssets((prev) => [uploaded, ...prev]);
      setSelectedAsset(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải ảnh lên thất bại.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleConfirm = () => {
    if (selectedAsset) {
      onSelect(selectedAsset);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-[20px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#0E7A32]" />
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo tên file hoặc mô tả alt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0E7A32] focus:outline-none"
              />
            </div>
            <select
              value={mimeFilter}
              onChange={(e) => setMimeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
            >
              <option value="all">Tất cả định dạng</option>
              <option value="jpeg">JPEG / JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
              <option value="svg">SVG Vector</option>
              <option value="icon">ICO Icon</option>
            </select>
          </div>

          <label className="relative flex items-center gap-1.5 px-3 py-1.5 bg-[#0E7A32] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Đang tải...' : 'Tải ảnh mới lên'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>

        {error && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Asset Grid */}
        <div className="flex-1 p-6 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0E7A32]" />
              <span className="text-xs">Đang tải thư viện ảnh...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
              <ImageIcon className="w-10 h-10 stroke-[1.5]" />
              <p className="text-xs font-semibold">Chưa có hình ảnh nào trong thư viện</p>
              <p className="text-[11px] text-gray-400">Nhấn &quot;Tải ảnh mới lên&quot; để thêm vào kho media.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {assets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                    className={`group relative rounded-xl border-2 overflow-hidden text-left bg-gray-50 flex flex-col transition-all ${
                      isSelected
                        ? 'border-[#0E7A32] ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-square w-full relative bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={asset.publicUrl}
                        alt={asset.altText || asset.fileName}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0E7A32] text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-white flex-1 flex flex-col justify-between">
                      <div className="text-[11px] font-bold text-gray-800 truncate" title={asset.fileName}>
                        {asset.fileName}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-between">
                        <span>{(asset.fileSize / 1024).toFixed(0)} KB</span>
                        {asset.width && asset.height ? (
                          <span>{asset.width}x{asset.height}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {selectedAsset ? (
              <span>Đã chọn: <strong className="text-gray-800">{selectedAsset.fileName}</strong></span>
            ) : (
              <span>Chưa chọn ảnh nào</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedAsset}
              className="px-5 py-2 bg-[#0E7A32] text-white hover:bg-emerald-700 disabled:opacity-40 rounded-xl text-xs font-bold transition shadow-xs"
            >
              Chọn hình ảnh này
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
