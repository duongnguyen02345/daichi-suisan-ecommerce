import React, { useEffect, useState } from 'react';
import {
  Upload,
  Search,
  Image as ImageIcon,
  Copy,
  Check,
  Archive,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { MediaAsset } from '../../types';
import {
  archiveMediaAsset,
  checkMediaUsage,
  deleteMediaAssetPermanently,
  loadMediaAssets,
  updateMediaAltText,
  uploadMediaAsset,
} from '../../lib/mediaApi';

export const MediaLibrarySection: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [mimeFilter, setMimeFilter] = useState('all');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState('');
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState<MediaAsset | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ isInUse: boolean; locations: string[] } | null>(null);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const data = await loadMediaAssets({
        includeArchived,
        search,
        mimeFilter,
      });
      setAssets(data);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lỗi tải thư viện hình ảnh.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAssets();
  }, [includeArchived, search, mimeFilter]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setNotification(null);
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await uploadMediaAsset(file, { folder: 'common' });
        successCount++;
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Thất bại'}`);
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      setNotification({
        type: 'success',
        message: `Đã tải lên thành công ${successCount} tệp ảnh vào kho lưu trữ.`,
      });
      void fetchAssets();
    }
    if (errors.length > 0) {
      setNotification({
        type: 'error',
        message: `Một số tệp tải lên gặp lỗi: ${errors.join('; ')}`,
      });
    }
  };

  const handleCopyUrl = async (asset: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(asset.publicUrl);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setNotification({ type: 'error', message: 'Không thể sao chép liên kết vào bộ nhớ tạm.' });
    }
  };

  const handleSaveAlt = async (asset: MediaAsset) => {
    try {
      const updated = await updateMediaAltText(asset.id, altDraft);
      setAssets((prev) => prev.map((a) => (a.id === asset.id ? updated : a)));
      setEditingAltId(null);
      setNotification({ type: 'success', message: 'Đã cập nhật mô tả hình ảnh (alt text).' });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Cập nhật alt text thất bại.',
      });
    }
  };

  const handleArchive = async (asset: MediaAsset) => {
    if (!window.confirm(`Bạn có chắc muốn lưu trữ tệp "${asset.fileName}"? Tệp này sẽ bị ẩn khỏi các danh sách chọn.`)) return;

    try {
      await archiveMediaAsset(asset.id);
      setNotification({ type: 'success', message: 'Đã chuyển ảnh vào danh sách lưu trữ.' });
      void fetchAssets();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lưu trữ thất bại.',
      });
    }
  };

  const handleDeletePermanently = async (asset: MediaAsset) => {
    try {
      await deleteMediaAssetPermanently(asset);
      setNotification({ type: 'success', message: 'Đã xóa vĩnh viễn tệp hình ảnh khỏi hệ thống.' });
      setSelectedAssetForDetails(null);
      void fetchAssets();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Xóa tệp thất bại.',
      });
    }
  };

  const inspectAsset = async (asset: MediaAsset) => {
    setSelectedAssetForDetails(asset);
    setIsCheckingUsage(true);
    try {
      const usage = await checkMediaUsage(asset);
      setUsageInfo(usage);
    } catch {
      setUsageInfo(null);
    } finally {
      setIsCheckingUsage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Upload Zone */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-card">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#0E7A32]" />
              Thư viện hình ảnh & đa phương tiện
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Tải lên và quản lý ảnh logo, banner, bài viết và nội dung trang web. Tất cả tệp được lưu trữ trực tiếp
              trên Supabase Storage và bảo toàn liên kết vĩnh viễn.
            </p>
          </div>

          <label className="flex-none px-5 py-2.5 bg-[#0E7A32] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{isUploading ? 'Đang tải lên...' : 'Tải ảnh mới lên'}</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon"
              onChange={(e) => void handleFileUpload(e.target.files)}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Drag & drop helper box */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleFileUpload(e.dataTransfer.files);
          }}
          className="mt-5 border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-xl p-5 text-center bg-gray-50/50 hover:bg-emerald-50/20 transition cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center gap-1 text-gray-500 text-xs">
            <Upload className="w-5 h-5 text-gray-400 mb-1" />
            <span className="font-semibold text-gray-700">Kéo thả tệp hình ảnh vào đây</span>
            <span className="text-[11px] text-gray-400">Hỗ trợ JPG, PNG, WebP, GIF, SVG, ICO (Tối đa 6 MB/tệp)</span>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-4 shadow-card flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên file, alt text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#0E7A32] focus:outline-none"
            />
          </div>

          <select
            value={mimeFilter}
            onChange={(e) => setMimeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:bg-white focus:outline-none"
          >
            <option value="all">Tất cả định dạng</option>
            <option value="jpeg">JPG / JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="svg">SVG Vector</option>
            <option value="icon">ICO Icon</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-gray-600 font-medium cursor-pointer ml-auto sm:ml-2">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded text-[#0E7A32] focus:ring-[#0E7A32]"
            />
            <span>Hiển thị ảnh đã lưu trữ</span>
          </label>
        </div>
      </div>

      {/* Main Grid & Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Media Grid */}
        <div className={selectedAssetForDetails ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {isLoading ? (
            <div className="bg-white rounded-[16px] border border-gray-200 p-12 text-center shadow-card flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#0E7A32]" />
              <span className="text-xs text-gray-500 font-medium">Đang tải danh sách ảnh...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="bg-white rounded-[16px] border border-gray-200 p-12 text-center shadow-card flex flex-col items-center justify-center gap-2 text-gray-400">
              <ImageIcon className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm font-bold text-gray-700">Chưa có tệp hình ảnh phù hợp</p>
              <p className="text-xs">Tải ảnh lên hoặc điều chỉnh từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-4">
              {assets.map((asset) => {
                const isSelected = selectedAssetForDetails?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => void inspectAsset(asset)}
                    className={`bg-white rounded-xl border overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer flex flex-col ${
                      isSelected ? 'border-[#0E7A32] ring-2 ring-emerald-500/20' : 'border-gray-200'
                    }`}
                  >
                    <div className="aspect-square relative bg-gray-100 flex items-center justify-center overflow-hidden group">
                      <img
                        src={asset.publicUrl}
                        alt={asset.altText || asset.fileName}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                      />
                      {asset.archivedAt && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-gray-900/70 text-white rounded text-[9px] font-bold">
                          Đã lưu trữ
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleCopyUrl(asset);
                          }}
                          className="p-1.5 bg-white text-gray-800 rounded-lg shadow-sm hover:bg-gray-100"
                          title="Sao chép URL"
                        >
                          {copiedId === asset.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <a
                          href={asset.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 bg-white text-gray-800 rounded-lg shadow-sm hover:bg-gray-100"
                          title="Mở tab mới"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-800 truncate" title={asset.fileName}>
                          {asset.fileName}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-between">
                          <span>{(asset.fileSize / 1024).toFixed(0)} KB</span>
                          {asset.width && asset.height ? <span>{asset.width}x{asset.height}</span> : null}
                        </div>
                      </div>

                      {asset.altText && (
                        <p className="text-[10px] text-gray-500 italic truncate mt-1.5 bg-gray-50 px-1.5 py-0.5 rounded">
                          Alt: {asset.altText}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Asset Details Sidebar */}
        {selectedAssetForDetails && (
          <div className="lg:col-span-4 bg-white rounded-[16px] border border-gray-200 p-5 shadow-card space-y-5 sticky top-20">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">Chi tiết tệp hình ảnh</h3>
              <button
                type="button"
                onClick={() => setSelectedAssetForDetails(null)}
                className="text-xs text-gray-400 hover:text-gray-700"
              >
                Đóng
              </button>
            </div>

            <div className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-gray-200">
              <img
                src={selectedAssetForDetails.publicUrl}
                alt={selectedAssetForDetails.altText || selectedAssetForDetails.fileName}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px]">Tên tệp</span>
                <span className="font-bold text-gray-800 break-all">{selectedAssetForDetails.fileName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 block text-[11px]">Kích thước</span>
                  <span className="font-medium text-gray-700">
                    {selectedAssetForDetails.width && selectedAssetForDetails.height
                      ? `${selectedAssetForDetails.width} × ${selectedAssetForDetails.height} px`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Dung lượng</span>
                  <span className="font-medium text-gray-700">
                    {(selectedAssetForDetails.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Định dạng mime</span>
                <span className="font-medium text-gray-700">{selectedAssetForDetails.mimeType}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Ngày tải lên</span>
                <span className="font-medium text-gray-700">
                  {new Date(selectedAssetForDetails.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* In-Use Indicator */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Info className="w-4 h-4 text-gray-500" />
                <span>Trạng thái sử dụng:</span>
              </div>
              {isCheckingUsage ? (
                <div className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Đang kiểm tra trên toàn website...</span>
                </div>
              ) : usageInfo?.isInUse ? (
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertTriangle className="w-3 h-3" />
                    Đang được sử dụng
                  </span>
                  <ul className="mt-1.5 list-disc list-inside text-[11px] text-gray-600 space-y-0.5">
                    {usageInfo.locations.map((loc, idx) => (
                      <li key={idx} className="truncate" title={loc}>{loc}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Chưa phát hiện liên kết đang sử dụng tệp này</span>
                </div>
              )}
            </div>

            {/* Alt text editor */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">Văn bản thay thế (Alt text / SEO)</label>
              {editingAltId === selectedAssetForDetails.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={altDraft}
                    onChange={(e) => setAltDraft(e.target.value)}
                    placeholder="Mô tả nội dung hình ảnh..."
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0E7A32] focus:outline-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingAltId(null)}
                      className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveAlt(selectedAssetForDetails)}
                      className="px-3 py-1 bg-[#0E7A32] text-white text-xs font-bold rounded-lg"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-700 truncate">
                    {selectedAssetForDetails.altText || <span className="text-gray-400 italic">Chưa có alt text</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAltId(selectedAssetForDetails.id);
                      setAltDraft(selectedAssetForDetails.altText || '');
                    }}
                    className="text-[11px] text-[#0E7A32] font-bold hover:underline ml-2"
                  >
                    Sửa
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => void handleCopyUrl(selectedAssetForDetails)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                {copiedId === selectedAssetForDetails.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === selectedAssetForDetails.id ? 'Đã sao chép URL' : 'Sao chép đường dẫn URL'}</span>
              </button>

              {!selectedAssetForDetails.archivedAt && (
                <button
                  type="button"
                  onClick={() => void handleArchive(selectedAssetForDetails)}
                  className="w-full py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <Archive className="w-4 h-4 text-gray-500" />
                  <span>Lưu trữ (Ẩn khỏi danh mục chọn)</span>
                </button>
              )}

              <button
                type="button"
                disabled={usageInfo?.isInUse}
                onClick={() => {
                  if (window.confirm(`Xác nhận xóa vĩnh viễn tệp "${selectedAssetForDetails.fileName}" khỏi kho lưu trữ?`)) {
                    void handleDeletePermanently(selectedAssetForDetails);
                  }
                }}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                title={usageInfo?.isInUse ? 'Không thể xóa tệp đang được sử dụng trên trang' : 'Xóa vĩnh viễn tệp này'}
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Xóa vĩnh viễn tệp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
