import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  FolderOpen,
  Globe2,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  UploadCloud,
} from 'lucide-react';
import { useSiteProfile } from '../../context/SiteProfileContext';
import { saveSiteProfile, uploadSiteMedia } from '../../lib/siteProfileApi';
import { SiteProfile } from '../../types';
import { MediaPickerModal } from './MediaPickerModal';

type UploadTarget = 'logoUrl' | 'faviconUrl';

export const SiteProfileSection: React.FC = () => {
  const { profile, dataSource, refreshProfile } = useSiteProfile();
  const [draft, setDraft] = useState<SiteProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<UploadTarget | null>(null);
  const [pickerTarget, setPickerTarget] = useState<UploadTarget | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const updateField = <K extends keyof SiteProfile>(key: K, value: SiteProfile[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };

  const handleUpload = async (file: File | undefined, target: UploadTarget) => {
    if (!file) return;
    setUploadingTarget(target);
    setMessage(null);
    try {
      const result = await uploadSiteMedia(
        file,
        'branding',
        target === 'logoUrl' ? `Logo ${draft.brandName}` : `Favicon ${draft.brandName}`,
      );
      updateField(target, result.url);
      setMessage({
        type: 'success',
        text: 'Đã tải ảnh lên. Bấm “Lưu thông tin website” để áp dụng thay đổi.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể tải hình ảnh.',
      });
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.brandName.trim() || !draft.legalName.trim()) {
      setMessage({ type: 'error', text: 'Tên thương hiệu và tên pháp lý không được để trống.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const saved = await saveSiteProfile(draft);
      setDraft(saved);
      await refreshProfile();
      setMessage({ type: 'success', text: 'Đã lưu thông tin và nhận diện website.' });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Không thể lưu thông tin website.';
      setMessage({
        type: 'error',
        text: text.includes('site_profiles')
          ? 'Chưa có bảng CMS trên Supabase. Hãy áp migration site_cms_foundation trước khi lưu.'
          : text,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="rounded-[18px] border border-[#E5D2A6] bg-gradient-to-r from-[#FFF9EB] to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-[#9F1D24] text-[#FCEBC2]">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-header text-lg font-black text-[#172E3D]">Hồ sơ website</h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#65716C]">
                Thông tin tại đây được dùng đồng bộ cho header, footer, trang Liên hệ và nhận diện trình duyệt.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 sm:self-auto">
            <CheckCircle2 className="h-4 w-4" />
            {dataSource === 'supabase' ? 'Đồng bộ Supabase' : 'Chế độ local demo'}
          </div>
        </div>
      </section>

      {message ? (
        <div
          role="status"
          className={`rounded-[14px] border px-4 py-3 text-sm font-semibold ${message.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-rose-200 bg-rose-50 text-rose-700'}`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[#9F1D24]" />
          <div>
            <h3 className="font-bold text-gray-900">Logo và biểu tượng</h3>
            <p className="mt-0.5 text-xs text-gray-500">Logo nên là PNG, WebP hoặc SVG nền trong suốt; dung lượng tối đa 6 MB.</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-4">
            <div className="flex min-h-28 items-center justify-center rounded-[12px] border border-dashed border-gray-300 bg-white p-4">
              {draft.logoUrl ? (
                <img src={draft.logoUrl} alt={`Logo ${draft.brandName}`} className="max-h-20 max-w-full object-contain" />
              ) : (
                <div className="flex items-center gap-3 text-[#9F1D24]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#9F1D24] font-black text-[#FCEBC2]">大一</span>
                  <span className="font-header text-xl font-black">{draft.brandName || 'DAICHI SUISAN'}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setPickerTarget('logoUrl')} className="inline-flex h-10 items-center gap-1.5 rounded-[11px] bg-emerald-50 border border-emerald-200 px-3.5 text-xs font-bold text-[#0E7A32] hover:bg-emerald-100">
                <FolderOpen className="h-4 w-4" />
                Chọn từ thư viện
              </button>
              <button type="button" onClick={() => logoInputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-[11px] bg-[#9F1D24] px-4 text-xs font-bold text-white hover:bg-[#74151B]">
                {uploadingTarget === 'logoUrl' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Tải tệp mới
              </button>
              {draft.logoUrl ? <button type="button" onClick={() => updateField('logoUrl', '')} className="h-10 rounded-[11px] border border-gray-200 px-4 text-xs font-bold text-gray-600 hover:bg-gray-50">Dùng logo chữ mặc định</button> : null}
            </div>
            <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" className="hidden" onChange={(event) => void handleUpload(event.target.files?.[0], 'logoUrl')} />
          </div>

          <div className="rounded-[16px] border border-gray-200 bg-gray-50 p-4">
            <div className="flex min-h-28 items-center justify-center rounded-[12px] border border-dashed border-gray-300 bg-white p-4">
              {draft.faviconUrl ? <img src={draft.faviconUrl} alt="Favicon website" className="h-16 w-16 object-contain" /> : <Globe2 className="h-12 w-12 text-gray-300" />}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setPickerTarget('faviconUrl')} className="inline-flex h-10 items-center gap-1.5 rounded-[11px] bg-emerald-50 border border-emerald-200 px-3.5 text-xs font-bold text-[#0E7A32] hover:bg-emerald-100">
                <FolderOpen className="h-4 w-4" />
                Chọn từ thư viện
              </button>
              <button type="button" onClick={() => faviconInputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-gray-300 bg-white px-4 text-xs font-bold text-gray-700 hover:border-[#9F1D24] hover:text-[#9F1D24]">
                {uploadingTarget === 'faviconUrl' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Tải favicon mới
              </button>
              {draft.faviconUrl ? <button type="button" onClick={() => updateField('faviconUrl', '')} className="h-10 rounded-[11px] border border-gray-200 px-4 text-xs font-bold text-gray-600 hover:bg-gray-50">Xóa favicon</button> : null}
            </div>
            <input ref={faviconInputRef} type="file" accept="image/png,image/webp,image/x-icon,image/vnd.microsoft.icon,image/svg+xml" className="hidden" onChange={(event) => void handleUpload(event.target.files?.[0], 'faviconUrl')} />
          </div>
        </div>
      </section>

      <section className="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#9F1D24]" />
          <h3 className="font-bold text-gray-900">Thông tin thương hiệu và pháp lý</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold text-gray-700">Tên thương hiệu *
            <input value={draft.brandName} onChange={(event) => updateField('brandName', event.target.value)} maxLength={120} required className="mt-1.5 h-11 w-full rounded-[11px] border border-gray-200 px-3 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
          <label className="text-xs font-bold text-gray-700">Tên công ty pháp lý *
            <input value={draft.legalName} onChange={(event) => updateField('legalName', event.target.value)} maxLength={220} required className="mt-1.5 h-11 w-full rounded-[11px] border border-gray-200 px-3 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
          <label className="text-xs font-bold text-gray-700">Slogan
            <input value={draft.tagline} onChange={(event) => updateField('tagline', event.target.value)} maxLength={220} className="mt-1.5 h-11 w-full rounded-[11px] border border-gray-200 px-3 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
          <label className="text-xs font-bold text-gray-700">Mã số thuế
            <input value={draft.taxCode} onChange={(event) => updateField('taxCode', event.target.value)} maxLength={40} className="mt-1.5 h-11 w-full rounded-[11px] border border-gray-200 px-3 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
          <label className="md:col-span-2 text-xs font-bold text-gray-700">Giới thiệu ngắn
            <textarea value={draft.companyDescription} onChange={(event) => updateField('companyDescription', event.target.value)} maxLength={600} rows={3} className="mt-1.5 w-full rounded-[11px] border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
        </div>
      </section>

      <section className="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Phone className="h-5 w-5 text-[#9F1D24]" />
          <h3 className="font-bold text-gray-900">Thông tin liên hệ</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold text-gray-700"><Phone className="mr-1 inline h-3.5 w-3.5" />Hotline
            <input value={draft.hotline} onChange={(event) => updateField('hotline', event.target.value)} maxLength={40} inputMode="tel" className="mt-1.5 h-11 w-full rounded-[11px] border border-gray-200 px-3 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
          <label className="text-xs font-bold text-gray-700"><Mail className="mr-1 inline h-3.5 w-3.5" />Email
            <input value={draft.email} onChange={(event) => updateField('email', event.target.value)} maxLength={254} type="email" className="mt-1.5 h-11 w-full rounded-[11px] border border-gray-200 px-3 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
          <label className="md:col-span-2 text-xs font-bold text-gray-700"><MapPin className="mr-1 inline h-3.5 w-3.5" />Địa chỉ
            <input value={draft.address} onChange={(event) => updateField('address', event.target.value)} maxLength={400} className="mt-1.5 h-11 w-full rounded-[11px] border border-gray-200 px-3 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
          <label className="text-xs font-bold text-gray-700">Nhãn hỗ trợ
            <input value={draft.supportLabel} onChange={(event) => updateField('supportLabel', event.target.value)} maxLength={100} className="mt-1.5 h-11 w-full rounded-[11px] border border-gray-200 px-3 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
          <label className="text-xs font-bold text-gray-700">Giờ làm việc
            <input value={draft.businessHours} onChange={(event) => updateField('businessHours', event.target.value)} maxLength={180} className="mt-1.5 h-11 w-full rounded-[11px] border border-gray-200 px-3 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
          <label className="md:col-span-2 text-xs font-bold text-gray-700">Nội dung bản quyền
            <input value={draft.copyrightText} onChange={(event) => updateField('copyrightText', event.target.value)} maxLength={400} className="mt-1.5 h-11 w-full rounded-[11px] border border-gray-200 px-3 font-normal outline-none focus:border-[#9F1D24] focus:ring-2 focus:ring-rose-100" />
          </label>
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button type="submit" disabled={isSaving || uploadingTarget !== null} className="inline-flex h-12 items-center gap-2 rounded-[13px] bg-[#9F1D24] px-6 text-sm font-bold text-white shadow-lg shadow-rose-950/15 transition hover:bg-[#74151B] disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {isSaving ? 'Đang lưu...' : 'Lưu thông tin website'}
        </button>
      </div>

      <MediaPickerModal
        isOpen={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        onSelect={(asset) => {
          if (pickerTarget) {
            updateField(pickerTarget, asset.publicUrl);
            setMessage({
              type: 'success',
              text: 'Đã chọn ảnh từ thư viện. Bấm “Lưu thông tin website” để áp dụng thay đổi.',
            });
          }
        }}
        title={pickerTarget === 'logoUrl' ? 'Chọn logo từ thư viện' : 'Chọn favicon từ thư viện'}
        allowedFolder="branding"
      />
    </form>
  );
};
