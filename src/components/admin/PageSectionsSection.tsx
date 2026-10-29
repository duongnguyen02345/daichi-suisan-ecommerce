import React, { useEffect, useState } from 'react';
import {
  FileText,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  FolderOpen,
  Loader2,
  Layers,
} from 'lucide-react';
import { PageSection, PublicationStatus } from '../../types';
import {
  defaultPageSections,
  loadPageSections,
  savePageSection,
} from '../../lib/pageSectionsApi';
import { MediaPickerModal } from './MediaPickerModal';

interface PageTab {
  key: string;
  name: string;
  description: string;
}

const PAGE_TABS: PageTab[] = [
  { key: 'home', name: 'Trang chủ', description: 'Hero, giới thiệu ngắn, nghệ nhân và các cam kết vàng.' },
  { key: 'about', name: 'Về chúng tôi', description: 'Hero, tầm nhìn, sứ mệnh, giá trị cốt lõi và nội dung Daichi Online.' },
  { key: 'contact', name: 'Liên hệ', description: 'Tiêu đề, thông tin hỗ trợ, hotline, giờ làm việc và chỉ dẫn đơn hàng.' },
  { key: 'common', name: 'Dùng chung', description: 'Thông báo trên thanh header và lời nhắn chân trang.' },
];

export const PageSectionsSection: React.FC = () => {
  const [activePageKey, setActivePageKey] = useState<string>('home');
  const [sections, setSections] = useState<PageSection[]>([]);
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>('');
  const [draft, setDraft] = useState<PageSection | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const data = await loadPageSections(activePageKey);
      setSections(data);
      if (data.length > 0) {
        const first = data[0];
        setSelectedSectionKey(first.sectionKey);
        setDraft(first);
        setIsDirty(false);
      } else {
        setSelectedSectionKey('');
        setDraft(null);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể tải danh sách phần nội dung.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSections();
  }, [activePageKey]);

  const handleSelectSection = (section: PageSection) => {
    if (isDirty && !window.confirm('Bạn có thay đổi chưa lưu. Bạn có muốn chuyển sang phần khác không?')) {
      return;
    }
    setSelectedSectionKey(section.sectionKey);
    setDraft(section);
    setIsDirty(false);
    setNotification(null);
  };

  const updateDraft = (updates: Partial<PageSection>) => {
    if (!draft) return;
    setDraft({ ...draft, ...updates });
    setIsDirty(true);
    setNotification(null);
  };

  const updateBodyField = (field: string, value: any) => {
    if (!draft) return;
    const nextBody = { ...(draft.body || {}), [field]: value };
    updateDraft({ body: nextBody });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;

    setIsSaving(true);
    setNotification(null);
    try {
      const saved = await savePageSection(draft);
      setDraft(saved);
      setIsDirty(false);
      setSections((prev) =>
        prev.map((s) =>
          s.pageKey === saved.pageKey && s.sectionKey === saved.sectionKey ? saved : s,
        ),
      );
      setNotification({
        type: 'success',
        message: `Đã lưu thành công phần nội dung "${saved.title || saved.sectionKey}".`,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lỗi khi lưu nội dung.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeTabMeta = PAGE_TABS.find((t) => t.key === activePageKey) || PAGE_TABS[0];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0E7A32]" />
              Quản lý nội dung các trang (CMS)
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Tùy chỉnh tiêu đề, mô tả, cam kết, hình ảnh và nút bấm trên từng trang mà không cần thay đổi mã nguồn.
              Giao diện được bảo toàn chuẩn nhận diện thương hiệu DAICHI SUISAN.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Eye className="w-4 h-4 text-gray-500" />
              <span>Xem trước nhanh</span>
            </button>
          </div>
        </div>

        {/* Page Selector Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-gray-100 pt-4">
          {PAGE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActivePageKey(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activePageKey === tab.key
                  ? 'bg-[#0E7A32] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
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

      {/* Editor Layout: Left Section List, Right Section Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section List */}
        <div className="lg:col-span-4 bg-white rounded-[16px] border border-gray-200 p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Các phần của trang ({sections.length})
            </h3>
            <span className="text-[10px] text-gray-400">{activeTabMeta.name}</span>
          </div>

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#0E7A32]" />
              <span className="text-xs">Đang tải danh sách...</span>
            </div>
          ) : sections.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">Chưa có phần nội dung nào</div>
          ) : (
            <div className="space-y-1.5">
              {sections.map((sec) => {
                const isSelected = sec.sectionKey === selectedSectionKey;
                return (
                  <button
                    key={sec.sectionKey}
                    type="button"
                    onClick={() => handleSelectSection(sec)}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'border-[#0E7A32] bg-emerald-50/50 shadow-xs'
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {sec.title || sec.sectionKey}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        #{sec.sectionKey}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-none">
                      {sec.isVisible ? (
                        <span className="p-1 text-emerald-600 bg-emerald-50 rounded-md" title="Đang hiển thị">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1 text-gray-400 bg-gray-100 rounded-md" title="Đang ẩn">
                          <EyeOff className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          sec.publicationStatus === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sec.publicationStatus === 'draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {sec.publicationStatus}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Section Form */}
        <div className="lg:col-span-8 bg-white rounded-[16px] border border-gray-200 p-6 shadow-card">
          {!draft ? (
            <div className="py-16 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto stroke-[1.5] mb-2" />
              <p className="text-xs font-semibold">Chọn một phần nội dung ở danh sách bên trái để chỉnh sửa</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Top Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-bold">
                      {draft.pageKey} / {draft.sectionKey}
                    </span>
                    {isDirty && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                        Có thay đổi chưa lưu
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mt-1">
                    Chỉnh sửa: {draft.title || draft.sectionKey}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.isVisible}
                      onChange={(e) => updateDraft({ isVisible: e.target.checked })}
                      className="rounded text-[#0E7A32] focus:ring-[#0E7A32] h-4 w-4"
                    />
                    <span>Hiển thị trên web</span>
                  </label>

                  <select
                    value={draft.publicationStatus}
                    onChange={(e) => updateDraft({ publicationStatus: e.target.value as PublicationStatus })}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                  >
                    <option value="published">Xuất bản (Published)</option>
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="scheduled">Lên lịch (Scheduled)</option>
                    <option value="archived">Lưu trữ (Archived)</option>
                  </select>
                </div>
              </div>

              {/* Standard Fields: Title & Subtitle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tiêu đề chính
                  </label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => updateDraft({ title: e.target.value })}
                    placeholder="Tiêu đề hiển thị..."
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tiêu đề phụ / Lời tựa
                  </label>
                  <input
                    type="text"
                    value={draft.subtitle}
                    onChange={(e) => updateDraft({ subtitle: e.target.value })}
                    placeholder="Lời tựa dẫn dắt..."
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </div>
              </div>

              {/* Dynamic Body Fields based on Section Type */}
              <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Nội dung chi tiết (Structured Content)
                </h4>

                {/* Badge text */}
                {draft.body?.badge !== undefined && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nhãn thẻ nhỏ (Badge)</label>
                    <input
                      type="text"
                      value={draft.body.badge || ''}
                      onChange={(e) => updateBodyField('badge', e.target.value)}
                      placeholder="Ví dụ: HẢI SẢN CAO CẤP"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                )}

                {/* Description paragraph */}
                {draft.body?.description !== undefined && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Đoạn văn mô tả</label>
                    <textarea
                      rows={3}
                      value={draft.body.description || ''}
                      onChange={(e) => updateBodyField('description', e.target.value)}
                      placeholder="Nội dung giới thiệu chi tiết..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs leading-relaxed"
                    />
                  </div>
                )}

                {/* Quote */}
                {draft.body?.quote !== undefined && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Lời trích dẫn / Lời ngỏ</label>
                    <textarea
                      rows={2}
                      value={draft.body.quote || ''}
                      onChange={(e) => updateBodyField('quote', e.target.value)}
                      placeholder="Lời ngỏ từ nghệ nhân hoặc thương hiệu..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs italic"
                    />
                  </div>
                )}

                {/* Vision & Mission */}
                {draft.body?.vision !== undefined && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tầm nhìn</label>
                      <textarea
                        rows={2}
                        value={draft.body.vision || ''}
                        onChange={(e) => updateBodyField('vision', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Sứ mệnh</label>
                      <textarea
                        rows={2}
                        value={draft.body.mission || ''}
                        onChange={(e) => updateBodyField('mission', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Features or Commitments list */}
                {Array.isArray(draft.body?.features) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Các điểm nổi bật (mỗi dòng 1 điểm)
                    </label>
                    <textarea
                      rows={3}
                      value={draft.body.features.join('\n')}
                      onChange={(e) =>
                        updateBodyField(
                          'features',
                          e.target.value.split('\n').filter((l) => l.trim()),
                        )
                      }
                      placeholder="Giao hỏa tốc 2H&#10;Chuẩn sashimi 100%&#10;Bảo quản âm sâu -60°C"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                )}

                {/* Items array (commitments or core values) */}
                {Array.isArray(draft.body?.items) && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600">
                      Danh sách cam kết / mục tiêu:
                    </label>
                    {draft.body.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5">
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => {
                            const nextItems = [...draft.body.items];
                            nextItems[idx] = { ...item, title: e.target.value };
                            updateBodyField('items', nextItems);
                          }}
                          placeholder="Tiêu đề mục..."
                          className="w-full font-bold text-xs border-b border-gray-100 pb-1 focus:outline-none"
                        />
                        <textarea
                          rows={2}
                          value={item.desc || ''}
                          onChange={(e) => {
                            const nextItems = [...draft.body.items];
                            nextItems[idx] = { ...item, desc: e.target.value };
                            updateBodyField('items', nextItems);
                          }}
                          placeholder="Mô tả chi tiết mục..."
                          className="w-full text-xs text-gray-600 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Call to action fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nội dung nút bấm (CTA)</label>
                  <input
                    type="text"
                    value={draft.ctaText}
                    onChange={(e) => updateDraft({ ctaText: e.target.value })}
                    placeholder="Ví dụ: Khám phá ngay, Xem thêm..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Đường dẫn liên kết (Link)</label>
                  <input
                    type="text"
                    value={draft.ctaLink}
                    onChange={(e) => updateDraft({ ctaLink: e.target.value })}
                    placeholder="Ví dụ: /products, /about..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {draft.updatedAt && (
                    <span>Lần sửa cuối: {new Date(draft.updatedAt).toLocaleString('vi-VN')}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#0E7A32] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#F7EEDB] rounded-[24px] max-w-2xl w-full p-8 shadow-2xl border border-[#EAD7AD] relative">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 text-xs font-bold px-3 py-1.5 bg-white/80 hover:bg-white rounded-full text-gray-700"
            >
              Đóng
            </button>
            <div className="space-y-4">
              {draft.body?.badge && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF1DC] text-[#9F1D24] border border-[#E5CF9E] text-xs font-bold uppercase tracking-wider">
                  {draft.body.badge}
                </span>
              )}
              <h2 className="text-2xl font-black text-[#172E3D] font-header">{draft.title}</h2>
              {draft.subtitle && <p className="text-sm font-serif italic text-[#8B1E24]">{draft.subtitle}</p>}
              {draft.body?.description && (
                <p className="text-xs text-[#5D6B65] leading-relaxed">{draft.body.description}</p>
              )}
              {draft.body?.quote && (
                <blockquote className="p-4 bg-[#FFF9EB] border-l-4 border-[#C99B49] rounded-r-xl text-xs italic text-gray-800">
                  &ldquo;{draft.body.quote}&rdquo;
                </blockquote>
              )}
              {draft.ctaText && (
                <div className="pt-2">
                  <span className="inline-flex px-5 py-2.5 bg-[#9F1D24] text-white rounded-full text-xs font-bold shadow-md">
                    {draft.ctaText}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
