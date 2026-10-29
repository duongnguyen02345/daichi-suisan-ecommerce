import React, { useEffect, useState } from 'react';
import {
  Globe,
  Save,
  Search,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { SiteSeoSetting } from '../../types';
import { defaultSeoSettings, loadAllSeoSettings, saveSeoSetting } from '../../lib/seoApi';
import { MediaUploadField } from './MediaUploadField';

interface PathOption {
  path: string;
  label: string;
  description: string;
}

const PATH_OPTIONS: PathOption[] = [
  { path: 'default', label: 'Cấu hình mặc định toàn trang', description: 'Áp dụng cho mọi trang nếu trang đó chưa có cấu hình riêng.' },
  { path: '/', label: 'Trang chủ (/)', description: 'SEO tối ưu cho trang chủ DAICHI SUISAN.' },
  { path: '/about', label: 'Về chúng tôi (/about)', description: 'Câu chuyện thương hiệu, nguồn gốc hải sản và cam kết chất lượng.' },
  { path: '/products', label: 'Tất cả sản phẩm (/products)', description: 'Danh mục sản phẩm, sashimi, cá tươi và đồ khô Nhật Bản.' },
  { path: '/news', label: 'Tin tức & Bài viết (/news)', description: 'Kiến thức ẩm thực, cẩm nang nấu nướng và ưu đãi.' },
  { path: '/contact', label: 'Trang liên hệ (/contact)', description: 'Thông tin liên hệ, hotline tư vấn và đặt hàng.' },
];

export const SeoSection: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('default');
  const [allSettings, setAllSettings] = useState<SiteSeoSetting[]>([]);
  const [draft, setDraft] = useState<SiteSeoSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await loadAllSeoSettings();
      setAllSettings(data);
      const current = data.find((s) => s.pagePath === selectedPath);
      if (current) {
        setDraft(current);
      } else {
        const fallback = defaultSeoSettings.find((s) => s.pagePath === selectedPath) || {
          id: `seo-${selectedPath.replace(/[^a-z0-9]/gi, '_')}`,
          pagePath: selectedPath,
          metaTitle: '',
          metaDescription: '',
          ogImageUrl: '',
          ogTitle: '',
          ogDescription: '',
          canonicalUrl: '',
          keywords: '',
          isIndexable: true,
        };
        setDraft(fallback);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lỗi tải cấu hình SEO.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, [selectedPath]);

  const updateDraft = (updates: Partial<SiteSeoSetting>) => {
    if (!draft) return;
    setDraft({ ...draft, ...updates });
    setNotification(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;

    setIsSaving(true);
    setNotification(null);
    try {
      const saved = await saveSeoSetting(draft);
      setDraft(saved);
      setAllSettings((prev) =>
        prev.map((s) => (s.pagePath === saved.pagePath ? saved : s)),
      );
      setNotification({
        type: 'success',
        message: `Đã lưu thành công cấu hình SEO cho "${selectedPath}".`,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lưu cấu hình SEO thất bại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedMeta = PATH_OPTIONS.find((p) => p.path === selectedPath) || PATH_OPTIONS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#0E7A32]" />
              Cấu hình SEO & Siêu dữ liệu tìm kiếm
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Tối ưu hóa tiêu đề trình duyệt (title), mô tả tìm kiếm Google (meta description), từ khóa và hình ảnh
              chia sẻ lên mạng xã hội (Open Graph Facebook/Zalo) theo từng trang.
            </p>
          </div>
        </div>

        {/* Path Selector Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-gray-100 pt-4">
          {PATH_OPTIONS.map((opt) => (
            <button
              key={opt.path}
              type="button"
              onClick={() => setSelectedPath(opt.path)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                selectedPath === opt.path
                  ? 'bg-[#0E7A32] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>{opt.label}</span>
            </button>
          ))}
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
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Split: Left Form, Right Live Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-[16px] border border-gray-200 p-6 shadow-card">
          {isLoading || !draft ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0E7A32]" />
              <span className="text-xs">Đang tải thông số SEO...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{selectedMeta.label}</h3>
                  <p className="text-[11px] text-gray-500">{selectedMeta.description}</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.isIndexable}
                    onChange={(e) => updateDraft({ isIndexable: e.target.checked })}
                    className="rounded text-[#0E7A32] focus:ring-[#0E7A32] h-4 w-4"
                  />
                  <span>Cho phép Google lập chỉ mục</span>
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Tiêu đề SEO (Title Tag) *
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {draft.metaTitle.length}/60 ký tự khuyến nghị
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={draft.metaTitle}
                  onChange={(e) => updateDraft({ metaTitle: e.target.value })}
                  placeholder="Ví dụ: DAICHI SUISAN - Tinh Hoa Hải Sản Nhật Bản"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0E7A32] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Thẻ mô tả (Meta Description) *
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {draft.metaDescription.length}/160 ký tự khuyến nghị
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={draft.metaDescription}
                  onChange={(e) => updateDraft({ metaDescription: e.target.value })}
                  placeholder="Mô tả ngắn gọn, súc tích và hấp dẫn về nội dung trang để hiển thị trên kết quả tìm kiếm..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-[#0E7A32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Từ khóa SEO (Keywords, cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={draft.keywords}
                  onChange={(e) => updateDraft({ keywords: e.target.value })}
                  placeholder="hải sản nhật, sashimi, cá hồi, daichi suisan..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0E7A32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Đường dẫn chuẩn (Canonical URL - Tùy chọn)
                </label>
                <input
                  type="text"
                  value={draft.canonicalUrl}
                  onChange={(e) => updateDraft({ canonicalUrl: e.target.value })}
                  placeholder="Để trống để hệ thống tự động nhận diện theo URL hiện tại"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#0E7A32] focus:outline-none"
                />
              </div>

              {/* Social / Open Graph image */}
              <div className="pt-2 border-t border-gray-100">
                <MediaUploadField
                  label="Hình ảnh chia sẻ mạng xã hội (Open Graph Image)"
                  description="Kích thước tối ưu 1200x630 px. Hình ảnh này xuất hiện khi gửi link qua Zalo, Facebook, Messenger..."
                  value={draft.ogImageUrl}
                  onChange={(url) => updateDraft({ ogImageUrl: url })}
                  folder="branding"
                  previewHeightClass="h-28"
                  aspectRatioClass="aspect-[1.91/1]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#0E7A32] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình SEO'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Live Previews Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Google Search Result Preview */}
          <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-card space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 border-b border-gray-100 pb-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span>Xem trước kết quả tìm kiếm Google (SERP)</span>
            </div>

            <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/80 space-y-1 font-sans">
              <div className="flex items-center gap-2 text-[11px] text-[#202124]">
                <div className="w-4 h-4 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[9px] font-bold">
                  D
                </div>
                <div className="truncate">
                  <span className="font-semibold">DAICHI SUISAN</span>
                  <span className="text-gray-400 ml-1.5 text-[10px]">
                    https://daichisuisan.vn{selectedPath === 'default' ? '' : selectedPath}
                  </span>
                </div>
              </div>
              <h4 className="text-base text-[#1a0dab] font-medium hover:underline cursor-pointer line-clamp-1">
                {draft?.metaTitle || 'DAICHI SUISAN - Tinh Hoa Hải Sản Nhật Bản'}
              </h4>
              <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                {draft?.metaDescription ||
                  'Chuyên cung cấp hải sản cao cấp nhập khẩu trực tiếp từ Nhật Bản: Cá hồi Nauy, Cá ngừ đại dương, Bào ngư...'}
              </p>
            </div>
          </div>

          {/* Social Share Card Preview (Facebook/Zalo) */}
          <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-card space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 border-b border-gray-100 pb-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Xem trước chia sẻ Zalo / Facebook</span>
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs max-w-sm mx-auto">
              <div className="aspect-[1.91/1] w-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
                {draft?.ogImageUrl ? (
                  <img
                    src={draft.ogImageUrl}
                    alt="OG Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-xs text-center p-4">
                    <span>Chưa có ảnh đại diện chia sẻ</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50/80 border-t border-gray-100 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  daichisuisan.vn
                </span>
                <h5 className="text-xs font-bold text-gray-900 line-clamp-1">
                  {draft?.metaTitle || 'DAICHI SUISAN'}
                </h5>
                <p className="text-[11px] text-gray-500 line-clamp-2">
                  {draft?.metaDescription || 'Mang tinh hoa thực phẩm Nhật Bản đến gần hơn với mọi gia đình.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
