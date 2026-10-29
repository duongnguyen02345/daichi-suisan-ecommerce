import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Crop,
  FileImage,
  FolderOpen,
  Image as ImageIcon,
  Link2,
  Loader2,
  Monitor,
  PauseCircle,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Smartphone,
  Star,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useOrders } from '../../context/OrderContext';
import { Banner, Product, Promotion } from '../../types';
import { formatPrice } from '../../lib/utils';
import { AdminStatCards } from './AdminStatCards';
import { AdminRightWidgets } from './AdminRightWidgets';
import { ImageCropModal } from './ImageCropModal';
import { MediaPickerModal } from './MediaPickerModal';
import { dataUrlToFile, uploadMediaAsset } from '../../lib/mediaApi';

const stockLabel = (product: Product) => {
  if (product.temporarilyUnavailable) return 'Tạm ngừng bán';
  if (product.stock <= 0) return 'Hết hàng';
  if (product.stock <= (product.lowStockThreshold ?? 10)) return 'Sắp hết';
  return 'Còn hàng';
};

export const AdminDashboardSection: React.FC = () => {
  const navigate = useNavigate();
  const { products, banners, promotions } = useAdmin();
  const { orders } = useOrders();

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= (p.lowStockThreshold ?? 10)).length,
    [products]
  );

  const unverifiedPayments = useMemo(
    () => orders.filter((o) => o.paymentStatus === 'customer_reported').length,
    [orders]
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'pending').length,
    [orders]
  );

  const activePromos = useMemo(
    () => promotions.filter((p) => p.status === 'active').length,
    [promotions]
  );

  return (
    <>
      <AdminStatCards />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 bg-white rounded-[16px] border border-[#E5E7EB] p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-base">Việc cần xử lý ngay</h2>
              <p className="text-xs text-gray-500 mt-0.5">Các mục yêu cầu quản trị viên kiểm tra và phê duyệt</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="text-left rounded-xl border border-amber-200 bg-amber-50/60 p-4 hover:bg-amber-100/70 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-amber-700">{unverifiedPayments}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-3 group-hover:text-amber-900 transition">
                  Xác minh thanh toán
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Đơn khách báo đã chuyển khoản cần đối soát với tài khoản ngân hàng.
                </p>
              </div>
              <div className="text-[11px] font-bold text-amber-700 mt-3 flex items-center gap-1">
                <span>Xử lý ngay</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/inventory')}
              className="text-left rounded-xl border border-rose-200 bg-rose-50/60 p-4 hover:bg-rose-100/70 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-800">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-rose-700">{lowStockCount}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-3 group-hover:text-rose-900 transition">
                  Kiểm tra tồn kho thấp
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Sản phẩm đã chạm ngưỡng cảnh báo cần nhập bổ sung để không gián đoạn bán hàng.
                </p>
              </div>
              <div className="text-[11px] font-bold text-rose-700 mt-3 flex items-center gap-1">
                <span>Vào kho hàng</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/promotions')}
              className="text-left rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 hover:bg-emerald-100/70 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-100 text-[#0E7A32]">
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-emerald-700">{activePromos}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-3 group-hover:text-emerald-900 transition">
                  Rà soát khuyến mại
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Theo dõi số lượt dùng và gia hạn hoặc dừng các mã ưu đãi sắp hết hạn.
                </p>
              </div>
              <div className="text-[11px] font-bold text-emerald-700 mt-3 flex items-center gap-1">
                <span>Quản lý ưu đãi</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          </div>
        </div>
        <div className="xl:col-span-4"><AdminRightWidgets /></div>
      </div>
    </>
  );
};

export const InventorySection: React.FC = () => {
  const { products, updateProduct } = useAdmin();
  const [search, setSearch] = useState('');
  const [stockDrafts, setStockDrafts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');

  const visibleProducts = useMemo(
    () => products.filter((product) =>
      `${product.name} ${product.sku}`.toLowerCase().includes(search.trim().toLowerCase()),
    ),
    [products, search],
  );

  const saveStock = async (product: Product, forcedStock?: number) => {
    const stock = forcedStock ?? stockDrafts[product.id] ?? product.stock;
    const result = await updateProduct(product.id, { stock: Math.max(0, stock) });
    setMessage(result.message);
  };

  return (
    <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-card overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Boxes className="w-5 h-5 text-[#0E7A32]" /> Tồn kho sản phẩm</h2>
          <p className="text-xs text-gray-500 mt-1">Cập nhật số lượng sẽ tự động thay đổi nhãn còn hàng, sắp hết hoặc hết hàng.</p>
        </div>
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc SKU" className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl" />
        </div>
      </div>
      {message && <div role="status" className="px-5 py-2 bg-emerald-50 text-emerald-800 text-xs font-semibold">{message}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[11px]">
            <tr><th className="text-left p-4">Sản phẩm</th><th className="text-left p-4">Hiện tại</th><th className="text-left p-4">Ngưỡng cảnh báo</th><th className="text-left p-4">Điều chỉnh</th><th className="text-right p-4">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleProducts.map((product) => (
              <tr key={product.id} className="hover:bg-emerald-50/20">
                <td className="p-4"><div className="font-bold text-gray-900">{product.name}</div><div className="text-[10px] text-gray-400">{product.sku}</div></td>
                <td className="p-4"><div className="font-bold text-gray-900">{product.stock}</div><div className="text-[10px] text-gray-500">{stockLabel(product)}</div></td>
                <td className="p-4 text-gray-700">≤ {product.lowStockThreshold ?? 10}</td>
                <td className="p-4"><input type="number" min="0" value={stockDrafts[product.id] ?? product.stock} onChange={(event) => setStockDrafts((current) => ({ ...current, [product.id]: Number(event.target.value) }))} className="w-24 border border-gray-200 rounded-lg px-3 py-2" /></td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => void saveStock(product, 0)} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-bold hover:bg-rose-100">Báo hết hàng</button>
                    <button onClick={() => void updateProduct(product.id, { temporarilyUnavailable: !product.temporarilyUnavailable })} className="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 font-bold hover:bg-amber-100">{product.temporarilyUnavailable ? 'Mở bán lại' : 'Tạm ngừng'}</button>
                    <button onClick={() => void saveStock(product)} className="px-3 py-2 rounded-lg bg-[#0E7A32] text-white font-bold hover:bg-[#0A5C25]">Lưu tồn</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const bannerPlacementLabels: Record<NonNullable<Banner['placement']>, string> = {
  home_hero: 'Banner chính trang chủ',
  home_secondary: 'Banner chân trang (Toàn màn hình)',
  home_footer: 'Banner chân trang (Toàn màn hình)',
  about_hero: 'Banner trang Về chúng tôi (Đầu trang)',
  about_digital: 'Ảnh món ăn trang Về chúng tôi (Mục DAICHI SUISAN ONLINE)',
  category: 'Banner trang danh mục',
  checkout: 'Banner trang thanh toán',
};

const bannerImageSpecs: Record<NonNullable<Banner['placement']>, { size: string; ratio: string; width: number; height: number }> = {
  home_hero: { size: '1600 × 700 px', ratio: '16:7', width: 1600, height: 700 },
  home_secondary: { size: '1600 × 600 px', ratio: '8:3', width: 1600, height: 600 },
  home_footer: { size: '1600 × 600 px', ratio: '8:3', width: 1600, height: 600 },
  about_hero: { size: '1600 × 600 px', ratio: '8:3', width: 1600, height: 600 },
  about_digital: { size: '800 × 700 px', ratio: '8:7', width: 800, height: 700 },
  category: { size: '1200 × 400 px', ratio: '3:1', width: 1200, height: 400 },
  checkout: { size: '1000 × 500 px', ratio: '2:1', width: 1000, height: 500 },
};

const mobileImageSpec = { size: '750 × 900 px', ratio: '5:6', width: 750, height: 900 };

const bannerPublicationLabels: Record<NonNullable<Banner['publicationStatus']>, string> = {
  draft: 'Bản nháp',
  scheduled: 'Đã lên lịch',
  published: 'Đang hiển thị',
  archived: 'Lưu trữ',
};

const bannerPublicationStyles: Record<NonNullable<Banner['publicationStatus']>, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-50 text-blue-700',
  published: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-amber-50 text-amber-700',
};

const BannerEditor: React.FC<{
  banner: Banner;
  isNew?: boolean;
  initiallyOpen?: boolean;
  onDone?: () => void;
}> = ({ banner, isNew = false, initiallyOpen = false, onDone }) => {
  const { addBanner, updateBanner, archiveBanner } = useAdmin();
  const [draft, setDraft] = useState(banner);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(initiallyOpen);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    setDraft(banner);
  }, [banner]);

  // Upload, crop & URL input state (tương tự như trang quản lý sản phẩm)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingMobileFile, setIsDraggingMobileFile] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<'desktop' | 'mobile'>('desktop');
  const [pendingCropImage, setPendingCropImage] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showMobileUrlInput, setShowMobileUrlInput] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'desktop' | 'mobile' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const placement = draft.placement || 'home_hero';
  const publicationStatus = draft.publicationStatus || (draft.active ? 'published' : 'draft');
  const imageSpec = bannerImageSpecs[placement];
  const gallery = draft.gallery?.length ? draft.gallery : draft.image ? [draft.image] : [''];
  const previewImage = gallery[Math.min(previewIndex, gallery.length - 1)] || '';

  const updateGalleryImage = (index: number, value: string) => {
    const nextGallery = [...gallery];
    nextGallery[index] = value;
    setDraft((current) => ({ ...current, image: nextGallery[0] || '', gallery: nextGallery }));
  };

  const addGalleryImage = () => {
    if (gallery.length >= 10) return;
    const nextGallery = [...gallery, ''];
    setDraft((current) => ({ ...current, gallery: nextGallery }));
    setPreviewIndex(nextGallery.length - 1);
  };

  const removeGalleryImage = (index: number) => {
    const nextGallery = gallery.length === 1 ? [''] : gallery.filter((_, itemIndex) => itemIndex !== index);
    setDraft((current) => ({ ...current, image: nextGallery[0] || '', gallery: nextGallery }));
    setPreviewIndex((current) => Math.min(current, nextGallery.length - 1));
  };

  const makeCoverImage = (index: number) => {
    if (index === 0) return;
    const nextGallery = [gallery[index], ...gallery.filter((_, itemIndex) => itemIndex !== index)];
    setDraft((current) => ({ ...current, image: nextGallery[0] || '', gallery: nextGallery }));
    setPreviewIndex(0);
  };

  const moveGalleryImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;
    const nextGallery = [...gallery];
    [nextGallery[index], nextGallery[targetIndex]] = [nextGallery[targetIndex], nextGallery[index]];
    setDraft((current) => ({ ...current, image: nextGallery[0] || '', gallery: nextGallery }));
    setPreviewIndex(targetIndex);
  };

  // Xử lý upload ảnh trực tiếp lên Supabase Storage
  const handleFileSelect = (file: File, target: 'desktop' | 'mobile' = 'desktop') => {
    if (!file.type.startsWith('image/')) {
      setMessage({ success: false, text: 'Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP).' });
      return;
    }

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    const isOverSize = file.size > MAX_FILE_SIZE;
    const spec = target === 'mobile' ? mobileImageSpec : imageSpec;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = async () => {
        const { naturalWidth, naturalHeight } = img;
        const currentRatio = naturalWidth / naturalHeight;
        const targetRatio = spec.width / spec.height;
        const ratioDiff = Math.abs(currentRatio - targetRatio);

        // Mở khung cắt ảnh nếu vượt kích thước chuẩn hoặc tỷ lệ khác tỷ lệ banner
        if (isOverSize || naturalWidth > spec.width || naturalHeight > spec.height || ratioDiff > 0.05) {
          setCropTarget(target);
          setPendingCropImage(dataUrl);
          setCropModalOpen(true);
        } else {
          setIsUploadingImage(true);
          try {
            const asset = await uploadMediaAsset(file, { folder: 'banners' });
            if (target === 'mobile') {
              setDraft((current) => ({ ...current, mobileImage: asset.publicUrl }));
            } else {
              updateGalleryImage(previewIndex, asset.publicUrl);
            }
            setMessage({ success: true, text: 'Đã tải ảnh banner lên lưu trữ thành công.' });
          } catch (err) {
            setMessage({
              success: false,
              text: err instanceof Error ? err.message : 'Tải ảnh lên thất bại.',
            });
          } finally {
            setIsUploadingImage(false);
          }
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCropOnCurrent = (target: 'desktop' | 'mobile' = 'desktop') => {
    const src = target === 'mobile' ? draft.mobileImage : previewImage;
    if (!src) return;
    setCropTarget(target);
    setPendingCropImage(src);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setIsUploadingImage(true);
    try {
      const file = dataUrlToFile(croppedDataUrl, `banner_${cropTarget}_${Date.now()}.png`);
      const asset = await uploadMediaAsset(file, { folder: 'banners' });
      if (cropTarget === 'mobile') {
        setDraft((current) => ({ ...current, mobileImage: asset.publicUrl }));
      } else {
        updateGalleryImage(previewIndex, asset.publicUrl);
      }
      setMessage({ success: true, text: 'Đã cắt và tải ảnh banner lên lưu trữ thành công.' });
    } catch (err) {
      setMessage({
        success: false,
        text: err instanceof Error ? err.message : 'Tải ảnh banner lên lưu trữ thất bại.',
      });
    } finally {
      setIsUploadingImage(false);
      setCropModalOpen(false);
      setPendingCropImage('');
    }
  };

  const save = async () => {
    setIsSaving(true);
    setMessage(null);

    // Kiểm tra không được lưu Base64 Data URL
    const hasDataUrl =
      (draft.mobileImage && draft.mobileImage.startsWith('data:')) ||
      gallery.some((url) => url.startsWith('data:'));
    if (hasDataUrl) {
      setMessage({
        success: false,
        text: 'Ảnh chưa được tải lên hệ thống lưu trữ (vẫn ở định dạng tạm thời). Vui lòng đợi upload hoàn tất hoặc chọn lại ảnh.',
      });
      setIsSaving(false);
      return;
    }

    const normalizedGallery = gallery.map((url) => url.trim()).filter(Boolean);
    const payload = { ...draft, image: normalizedGallery[0] || '', gallery: normalizedGallery, placement, publicationStatus };
    const result = isNew
      ? await addBanner((({ id: _id, ...fields }) => fields)(payload))
      : await updateBanner(banner.id, payload);
    setMessage({ success: result.success, text: result.message });
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
      onDone?.();
    }
  };

  const archive = async () => {
    if (!window.confirm(`Lưu trữ banner “${banner.title}”?`)) return;
    const result = await archiveBanner(banner.id);
    setMessage({ success: result.success, text: result.message });
    if (result.success) onDone?.();
  };

  return (
    <article className="bg-white border border-gray-200 rounded-[16px] shadow-card overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative w-full sm:w-56 h-28 flex-none rounded-xl bg-gray-100 border border-gray-200 overflow-hidden">
          {previewImage ? (
            <img src={previewImage} alt={`Xem trước ${draft.title}`} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-6 h-6" />
              <span className="text-[10px] mt-1">Chưa có ảnh</span>
            </div>
          )}
          <span className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/65 text-white text-[9px] font-bold">
            Ảnh {Math.min(previewIndex + 1, gallery.length)}/{gallery.length}
          </span>
          <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-white/90 text-gray-700 text-[9px] font-bold">
            {imageSpec.ratio}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-gray-900 truncate">{draft.title || (isNew ? 'Thêm ảnh banner mới' : 'Banner chưa có tiêu đề')}</h3>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${bannerPublicationStyles[publicationStatus]}`}>
              {bannerPublicationLabels[publicationStatus]}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{draft.subtitle || 'Chưa có nội dung phụ'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-[#0E7A32]" /> {bannerPlacementLabels[placement]}</span>
            <span className="inline-flex items-center gap-1.5"><FileImage className="w-3.5 h-3.5 text-[#0E7A32]" /> Đề xuất {imageSpec.size}</span>
            <span className="inline-flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-[#0E7A32]" /> {gallery.filter(Boolean).length} ảnh trong banner</span>
            <span className="inline-flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 text-[#0E7A32]" /> {draft.ctaLink || 'Chưa có liên kết'}</span>
          </div>
          {message ? (
            <p role="status" className={`text-[11px] font-semibold mt-2 ${message.success ? 'text-emerald-700' : 'text-rose-700'}`}>
              {message.text}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setIsEditing((current) => !current)}
          className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 flex-none"
        >
          {isEditing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {isEditing ? 'Thu gọn' : isNew ? 'Nhập nội dung' : 'Chỉnh sửa'}
        </button>
      </div>

      {isEditing ? (
        <div className="border-t border-gray-100 bg-gray-50/60 p-4 sm:p-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-[11px] text-blue-800 mb-4 flex items-start gap-2">
            <ImageIcon className="w-4 h-4 flex-none mt-0.5" />
            <span>Vị trí đang chọn phù hợp ảnh <strong>{imageSpec.size}</strong> (tỷ lệ {imageSpec.ratio}). Hỗ trợ tải trực tiếp từ máy hoặc dán link URL. Đặt chủ thể chính bên phải để không bị phần chữ che.</span>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="text-xs font-bold text-gray-700">Vị trí hiển thị
              <div className="mt-1 w-full min-h-10 border border-gray-200 rounded-xl px-3 bg-gray-50 font-normal flex items-center">{bannerPlacementLabels[placement]}</div>
            </div>
            <label className="text-xs font-bold text-gray-700">Trạng thái
              <select value={publicationStatus} onChange={(event) => setDraft((current) => ({ ...current, publicationStatus: event.target.value as Banner['publicationStatus'], active: ['published', 'scheduled'].includes(event.target.value) }))} className="mt-1 w-full h-10 border border-gray-200 rounded-xl px-3 bg-white font-normal">
                <option value="draft">Bản nháp</option><option value="scheduled">Đã lên lịch</option><option value="published">Đang hiển thị</option><option value="archived">Lưu trữ</option>
              </select>
            </label>
            <label className="text-xs font-bold text-gray-700">Màu nội dung
              <select value={draft.colorScheme || 'green'} onChange={(event) => setDraft((current) => ({ ...current, colorScheme: event.target.value as Banner['colorScheme'] }))} className="mt-1 w-full h-10 border border-gray-200 rounded-xl px-3 bg-white font-normal">
                <option value="green">Xanh lá</option><option value="orange">Cam</option><option value="red">Đỏ</option>
              </select>
            </label>

            {/* Khu vực upload ảnh desktop của banner (Giống thiết kế trang Quản lý sản phẩm) */}
            <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs font-black text-gray-800">
                    Bộ ảnh banner desktop (Ảnh {previewIndex + 1}/{gallery.length})
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Chuẩn {imageSpec.size} (Tỷ lệ {imageSpec.ratio}) · Tối đa 10 ảnh
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addGalleryImage}
                  disabled={gallery.length >= 10}
                  className="h-8 px-3 rounded-xl bg-emerald-50 disabled:opacity-50 text-[#0E7A32] text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm ảnh mới
                </button>
              </div>

              {/* Input file ẩn cho ảnh desktop */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0], 'desktop');
                  }
                }}
              />

              <div className="grid lg:grid-cols-12 gap-5 items-start">
                {/* Cột trái: Khung xem trước / upload kéo thả giống ProductFormModal */}
                <div className="lg:col-span-7 flex flex-col">
                  {previewImage ? (
                    <div className="relative border-2 border-gray-200 rounded-2xl p-3 bg-gray-50/50 flex flex-col">
                      <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-gray-900/5 border border-gray-200 flex items-center justify-center">
                        <img
                          src={previewImage}
                          alt={`Ảnh banner ${previewIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {gallery.length > 1 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewIndex((current) => current === 0 ? gallery.length - 1 : current - 1)}
                              aria-label="Ảnh trước"
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition"
                            >
                              <ChevronLeft className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewIndex((current) => (current + 1) % gallery.length)}
                              aria-label="Ảnh tiếp theo"
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition"
                            >
                              <ChevronRight className="w-4 h-4 text-gray-700" />
                            </button>
                          </>
                        ) : null}
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                          Ảnh {previewIndex + 1}/{gallery.length}
                        </span>
                      </div>

                      {/* Các nút thao tác ảnh giống trang sản phẩm: Cắt ảnh - Đổi ảnh - Xóa ảnh */}
                      <div className="flex items-center gap-2 mt-3 w-full">
                        <button
                          type="button"
                          onClick={() => setMediaPickerTarget('desktop')}
                          className="flex-1 py-1.5 px-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#0E7A32] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition"
                          title="Chọn từ thư viện hình ảnh"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Thư viện</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenCropOnCurrent('desktop')}
                          className="flex-1 py-1.5 px-2 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition"
                          title="Mở công cụ cắt ảnh"
                        >
                          <Crop className="w-3.5 h-3.5 text-blue-500" />
                          <span>Cắt ảnh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-1.5 px-2 bg-white border border-gray-200 hover:border-gray-400 text-gray-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition"
                          title="Chọn ảnh khác từ máy tính"
                        >
                          <Upload className="w-3.5 h-3.5 text-gray-500" />
                          <span>Đổi ảnh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateGalleryImage(previewIndex, '')}
                          className="p-1.5 bg-white border border-gray-200 hover:border-red-400 hover:text-red-600 text-gray-500 rounded-lg shadow-xs transition"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileSelect(e.dataTransfer.files[0], 'desktop');
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all duration-200 ${
                        isDraggingFile
                          ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                          : 'border-gray-200 hover:border-blue-400 bg-gray-50/60 hover:bg-blue-50/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3 shadow-xs">
                        <Upload className="w-6 h-6 stroke-[2]" />
                      </div>
                      <p className="text-xs font-semibold text-gray-700">
                        Tải ảnh lên hoặc kéo thả vào đây
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        JPG, PNG, WEBP (Tối đa 3MB)
                      </p>
                      <span className="inline-block mt-3 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-medium px-2 py-0.5 rounded-full">
                        Chuẩn {imageSpec.size} (Sẽ mở khung cắt nếu vượt quá)
                      </span>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMediaPickerTarget('desktop');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#0E7A32] text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Hoặc chọn từ thư viện</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Toggle nhập URL linh hoạt */}
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] text-gray-500 hover:text-[#0E7A32] underline"
                    >
                      {showUrlInput ? 'Ẩn nhập link ảnh' : 'Hoặc nhập link URL ảnh'}
                    </button>
                    {showUrlInput && (
                      <input
                        type="text"
                        value={gallery[previewIndex] || ''}
                        onChange={(e) => updateGalleryImage(previewIndex, e.target.value)}
                        placeholder="https://..."
                        className="mt-1.5 w-full text-xs p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E7A32]"
                      />
                    )}
                  </div>
                </div>

                {/* Cột phải: Danh sách ảnh thumbnail trong banner & thứ tự */}
                <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-3 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-2">
                      Danh sách ảnh ({gallery.length}/10):
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                      {gallery.map((url, index) => (
                        <button
                          key={`${index}-${url}`}
                          type="button"
                          onClick={() => setPreviewIndex(index)}
                          aria-label={`Chọn ảnh ${index + 1}`}
                          className={`relative aspect-[16/10] rounded-lg overflow-hidden border-2 bg-gray-100 transition ${
                            index === previewIndex
                              ? 'border-[#0E7A32] ring-2 ring-emerald-200 shadow-xs'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {url ? (
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex flex-col items-center justify-center text-[9px] text-gray-400">
                              <ImageIcon className="w-3.5 h-3.5 mb-0.5 opacity-60" />
                              Ảnh {index + 1}
                            </span>
                          )}
                          {index === 0 && (
                            <span className="absolute left-0 right-0 bottom-0 bg-[#0E7A32] text-white text-[8px] font-bold text-center leading-tight py-0.5">
                              Ảnh 1
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 flex flex-wrap gap-1.5 text-[11px]">
                    {previewIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => makeCoverImage(previewIndex)}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold transition"
                      >
                        Đặt làm Ảnh 1
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={previewIndex === 0}
                      onClick={() => moveGalleryImage(previewIndex, -1)}
                      className="px-2 py-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg font-medium disabled:opacity-30 transition"
                    >
                      Dịch trái
                    </button>
                    <button
                      type="button"
                      disabled={previewIndex === gallery.length - 1}
                      onClick={() => moveGalleryImage(previewIndex, 1)}
                      className="px-2 py-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg font-medium disabled:opacity-30 transition"
                    >
                      Dịch phải
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(previewIndex)}
                      className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-bold ml-auto transition"
                    >
                      Xóa khỏi bộ ảnh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Khu vực upload ảnh mobile */}
            <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-gray-700">
                    Ảnh banner mobile <span className="text-gray-400 font-normal">(Tùy chọn, tối ưu cho giao diện điện thoại)</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Chuẩn {mobileImageSpec.size} (Tỷ lệ {mobileImageSpec.ratio})
                  </p>
                </div>
              </div>

              <input
                ref={mobileFileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0], 'mobile');
                  }
                }}
              />

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {draft.mobileImage ? (
                  <div className="relative border-2 border-gray-200 rounded-2xl p-2.5 bg-gray-50/50 flex flex-col items-center w-full sm:w-48 flex-none">
                    <div className="w-full aspect-[5/6] max-h-[160px] rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center">
                      <img
                        src={draft.mobileImage}
                        alt="Ảnh banner mobile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 w-full">
                      <button
                        type="button"
                        onClick={() => setMediaPickerTarget('mobile')}
                        className="flex-1 py-1 px-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#0E7A32] text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs transition"
                        title="Chọn từ thư viện"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>Thư viện</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCropOnCurrent('mobile')}
                        className="flex-1 py-1 px-1.5 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-700 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 shadow-xs transition"
                        title="Cắt ảnh mobile"
                      >
                        <Crop className="w-3 h-3 text-blue-500" />
                        <span>Cắt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => mobileFileInputRef.current?.click()}
                        className="flex-1 py-1 px-1.5 bg-white border border-gray-200 hover:border-gray-400 text-gray-700 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 shadow-xs transition"
                        title="Đổi ảnh mobile"
                      >
                        <Upload className="w-3 h-3 text-gray-500" />
                        <span>Đổi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, mobileImage: '' }))}
                        className="p-1 bg-white border border-gray-200 hover:border-red-400 hover:text-red-600 text-gray-500 rounded-lg shadow-xs transition"
                        title="Xóa ảnh mobile"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingMobileFile(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingMobileFile(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingMobileFile(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileSelect(e.dataTransfer.files[0], 'mobile');
                      }
                    }}
                    onClick={() => mobileFileInputRef.current?.click()}
                    className={`w-full sm:w-48 h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition flex-none ${
                      isDraggingMobileFile
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-gray-200 hover:border-blue-400 bg-gray-50/60 hover:bg-blue-50/20'
                    }`}
                  >
                    <Upload className="w-5 h-5 text-blue-500 mb-1" />
                    <p className="text-[11px] font-semibold text-gray-700">Tải ảnh mobile</p>
                    <p className="text-[10px] text-gray-400">750 × 900 px</p>
                  </div>
                )}

                <div className="flex-1 w-full flex flex-col justify-center">
                  <div className="text-right sm:text-left">
                    <button
                      type="button"
                      onClick={() => setShowMobileUrlInput(!showMobileUrlInput)}
                      className="text-[11px] text-gray-500 hover:text-[#0E7A32] underline"
                    >
                      {showMobileUrlInput ? 'Ẩn nhập link ảnh mobile' : 'Hoặc nhập link URL ảnh mobile'}
                    </button>
                    {showMobileUrlInput && (
                      <input
                        type="text"
                        value={draft.mobileImage || ''}
                        onChange={(e) => setDraft((current) => ({ ...current, mobileImage: e.target.value }))}
                        placeholder="https://..."
                        className="mt-1.5 w-full text-xs p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E7A32]"
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                    Nếu không tải ảnh mobile riêng, website sẽ tự động dùng bộ ảnh desktop cho mọi kích thước màn hình.
                  </p>
                </div>
              </div>
            </div>

            <label className="text-xs font-bold text-gray-700">Tiêu đề
              <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full h-10 border border-gray-200 rounded-xl px-3 bg-white font-normal" />
            </label>
            <label className="text-xs font-bold text-gray-700 sm:col-span-2">Nội dung phụ
              <input value={draft.subtitle} onChange={(event) => setDraft((current) => ({ ...current, subtitle: event.target.value }))} className="mt-1 w-full h-10 border border-gray-200 rounded-xl px-3 bg-white font-normal" />
            </label>

            <label className="text-xs font-bold text-gray-700">Nhãn nhỏ
              <input value={draft.badge || ''} onChange={(event) => setDraft((current) => ({ ...current, badge: event.target.value }))} placeholder="Ví dụ: Tươi ngon mỗi ngày" className="mt-1 w-full h-10 border border-gray-200 rounded-xl px-3 bg-white font-normal" />
            </label>
            <label className="text-xs font-bold text-gray-700">Nội dung nút
              <input value={draft.ctaText} onChange={(event) => setDraft((current) => ({ ...current, ctaText: event.target.value }))} placeholder="Mua ngay" className="mt-1 w-full h-10 border border-gray-200 rounded-xl px-3 bg-white font-normal" />
            </label>
            <label className="text-xs font-bold text-gray-700">Liên kết của nút
              <input value={draft.ctaLink} onChange={(event) => setDraft((current) => ({ ...current, ctaLink: event.target.value }))} placeholder="/products" className="mt-1 w-full h-10 border border-gray-200 rounded-xl px-3 bg-white font-normal" />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              {!isNew ? <button type="button" onClick={() => void archive()} className="h-10 px-4 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2"><Trash2 className="w-4 h-4" /> Lưu trữ</button> : null}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setDraft(banner); setPreviewIndex(0); setMessage(null); setIsEditing(false); onDone?.(); }} className="h-10 px-4 border border-gray-200 bg-white text-gray-600 rounded-xl text-xs font-bold">Hủy</button>
              <button type="button" disabled={isSaving || isUploadingImage} onClick={() => void save()} className="h-10 px-4 bg-[#0E7A32] text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Đang lưu...' : 'Lưu banner'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal cắt ảnh sản phẩm / banner đồng bộ */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={pendingCropImage}
        title={cropTarget === 'mobile' ? 'Cắt ảnh banner mobile' : `Cắt ảnh ${bannerPlacementLabels[placement]}`}
        aspectRatioLabel={cropTarget === 'mobile' ? mobileImageSpec.ratio : imageSpec.ratio}
        targetWidth={cropTarget === 'mobile' ? mobileImageSpec.width : imageSpec.width}
        targetHeight={cropTarget === 'mobile' ? mobileImageSpec.height : imageSpec.height}
        onClose={() => {
          setCropModalOpen(false);
          setPendingCropImage('');
        }}
        onComplete={handleCropComplete}
      />

      <MediaPickerModal
        isOpen={Boolean(mediaPickerTarget)}
        onClose={() => setMediaPickerTarget(null)}
        onSelect={(asset) => {
          if (mediaPickerTarget === 'mobile') {
            setDraft((current) => ({ ...current, mobileImage: asset.publicUrl }));
          } else {
            updateGalleryImage(previewIndex, asset.publicUrl);
          }
          setMessage({ success: true, text: 'Đã chọn ảnh từ thư viện.' });
        }}
        title={mediaPickerTarget === 'mobile' ? 'Chọn ảnh banner mobile từ thư viện' : 'Chọn ảnh banner desktop từ thư viện'}
        allowedFolder="banners"
      />
    </article>
  );
};

export const BannersSection: React.FC = () => {
  const { banners } = useAdmin();
  const [addingPlacement, setAddingPlacement] = useState<Banner['placement'] | null>(null);
  const publishedCount = banners.filter((banner) => banner.active && banner.publicationStatus !== 'draft' && banner.publicationStatus !== 'archived').length;
  const activeBanners = banners.filter((banner) => banner.publicationStatus !== 'archived');
  const totalImages = activeBanners.reduce((sum, banner) => sum + (banner.gallery?.length || (banner.image ? 1 : 0)), 0);
  const createBlankBanner = (placement: Banner['placement']): Banner => ({
    id: 'new-banner',
    title: '',
    subtitle: '',
    image: '',
    ctaText: 'Xem ngay',
    ctaLink: '/products',
    colorScheme: 'green',
    gallery: [''],
    placement,
    sortOrder: 0,
    publicationStatus: 'draft',
    active: false,
  });

  return (
    <div className="space-y-5">
      <section className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="max-w-lg">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0E7A32] flex items-center justify-center"><ImageIcon className="w-5 h-5" /></div>
              <div><h2 className="font-black text-gray-900">Kích thước ảnh đề xuất</h2><p className="text-xs text-gray-500 mt-0.5">Giữ ảnh sắc nét và tải nhanh trên mọi thiết bị.</p></div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mt-4">Nên dùng định dạng <strong>WebP hoặc JPG</strong>, hệ màu RGB và dung lượng tối đa <strong>1,5 MB</strong>. Không đặt chữ trực tiếp sát mép ảnh để tránh bị cắt trên màn hình nhỏ.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-3xl">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3"><Monitor className="w-5 h-5 text-emerald-700" /><p className="text-xs font-black text-gray-900 mt-2">Banner chính</p><p className="text-[11px] text-gray-500 mt-1">1600 × 700 px · 16:7</p></div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3"><Monitor className="w-5 h-5 text-[#88171C]" /><p className="text-xs font-black text-gray-900 mt-2">Banner chân trang</p><p className="text-[11px] text-gray-500 mt-1">1600 × 600 px · 8:3</p></div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3"><Smartphone className="w-5 h-5 text-blue-700" /><p className="text-xs font-black text-gray-900 mt-2">Ảnh mobile</p><p className="text-[11px] text-gray-500 mt-1">750 × 900 px · 5:6</p></div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3"><FileImage className="w-5 h-5 text-amber-700" /><p className="text-xs font-black text-gray-900 mt-2">Dung lượng</p><p className="text-[11px] text-gray-500 mt-1">WebP/JPG · ≤ 1,5 MB</p></div>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h2 className="font-black text-gray-900">Danh sách khu vực banner</h2><p className="text-xs text-gray-500 mt-1">{activeBanners.length} khu vực · {totalImages} ảnh · {publishedCount} khu vực đang hiển thị</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2"><CheckCircle2 className="w-4 h-4" /> Mỗi khu vực có một bộ ảnh tự động luân phiên</div>
        </div>
      </div>

      {[
        { placement: 'home_hero' as Banner['placement'], label: 'Banner chính trang chủ' },
        { placement: 'about_hero' as Banner['placement'], label: 'Banner trang Về chúng tôi (Đầu trang)' },
        { placement: 'about_digital' as Banner['placement'], label: 'Ảnh món ăn trang Về chúng tôi (Mục DAICHI SUISAN ONLINE)' },
        { placement: 'home_secondary' as Banner['placement'], label: 'Banner chân trang (Toàn màn hình)' },
        { placement: 'category' as Banner['placement'], label: 'Banner trang danh mục' },
        { placement: 'checkout' as Banner['placement'], label: 'Banner trang thanh toán' },
      ].map(({ placement, label }) => {
        const placementBanners = activeBanners.filter((banner) => {
          if (placement === 'home_secondary') {
            return banner.placement === 'home_secondary' || banner.placement === 'home_footer';
          }
          return (banner.placement || 'home_hero') === placement;
        });
        const placementImageCount = placementBanners.reduce((sum, banner) => sum + (banner.gallery?.length || (banner.image ? 1 : 0)), 0);
        return (
          <section key={placement} className="space-y-3">
            <div className="flex items-center gap-2"><h3 className="text-sm font-black text-gray-800">{label}</h3><span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">{placementImageCount} ảnh</span></div>
            {placementBanners.length > 0
              ? placementBanners.map((banner) => <BannerEditor key={banner.id} banner={banner} />)
              : addingPlacement === placement
                ? <BannerEditor banner={createBlankBanner(placement as Banner['placement'])} isNew initiallyOpen onDone={() => setAddingPlacement(null)} />
                : <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><p className="text-xs text-gray-400">Khu vực này chưa được thiết lập.</p><button type="button" onClick={() => setAddingPlacement(placement as Banner['placement'])} className="h-9 px-3 rounded-xl bg-emerald-50 text-[#0E7A32] text-xs font-bold flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Thiết lập khu vực</button></div>}
          </section>
        );
      })}
    </div>
  );
};

export const PromotionsSection: React.FC = () => {
  const { promotions, addPromotion } = useAdmin();
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(30000);
  const [minOrder, setMinOrder] = useState(300000);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await addPromotion({ title, code, discountAmount, minOrder, startDate, endDate, status: 'active', discountType: 'fixed', stackable: false });
    setMessage(result.message);
    if (result.success) { setTitle(''); setCode(''); }
  };

  return (
    <div className="grid xl:grid-cols-12 gap-6 items-start">
      <form onSubmit={submit} className="xl:col-span-4 bg-white rounded-[12px] border border-gray-200 p-5 shadow-card space-y-4">
        <div><h2 className="font-bold text-gray-900 flex items-center gap-2"><Tag className="w-4 h-4 text-orange-500" /> Tạo khuyến mại</h2><p className="text-xs text-gray-500 mt-1">Mức giảm sẽ được xác minh lại trên server khi đặt hàng.</p></div>
        <label className="block text-xs font-bold text-gray-700">Tên chương trình<input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal" /></label>
        <label className="block text-xs font-bold text-gray-700">Mã khuyến mại<input required value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal uppercase" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-gray-700">Giảm (VNĐ)<input type="number" min="0" required value={discountAmount} onChange={(event) => setDiscountAmount(Number(event.target.value))} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal" /></label><label className="text-xs font-bold text-gray-700">Đơn tối thiểu<input type="number" min="0" required value={minOrder} onChange={(event) => setMinOrder(Number(event.target.value))} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal" /></label></div>
        <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-gray-700">Bắt đầu<input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal" /></label><label className="text-xs font-bold text-gray-700">Kết thúc<input type="date" required min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal" /></label></div>
        <button className="w-full h-10 bg-[#0E7A32] text-white rounded-xl text-xs font-bold">Tạo chương trình</button>
        {message && <p role="status" className="text-xs text-center font-semibold text-emerald-700">{message}</p>}
      </form>
      <div className="xl:col-span-8 bg-white rounded-[12px] border border-gray-200 shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-gray-900">Chương trình hiện có</h2></div>
        <div className="divide-y divide-gray-100">
          {promotions.map((promotion: Promotion) => (
            <div key={promotion.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div><div className="flex items-center gap-2"><span className="font-black text-[#0E7A32]">{promotion.code}</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">{promotion.status}</span></div><h3 className="text-sm font-bold text-gray-900 mt-1">{promotion.title}</h3><p className="text-xs text-gray-500 mt-1">Đơn từ {formatPrice(promotion.minOrder)} · Giảm {formatPrice(promotion.discountAmount || 0)}</p></div>
              <div className="text-xs text-gray-500 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> {promotion.startDate} → {promotion.endDate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AdminPlaceholderSection: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-white rounded-[12px] border border-gray-200 p-10 text-center shadow-card">
    <PauseCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
    <h2 className="font-bold text-gray-900">{title}</h2>
    <p className="text-sm text-gray-500 mt-2">Module này sẽ được nối sau khi sản phẩm, tồn kho, banner và khuyến mại ổn định.</p>
  </div>
);

export const AdminDataNotice: React.FC = () => {
  const { dataSource, lastError, isLoading } = useAdmin();
  if (isLoading) return <div className="mb-5 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs font-semibold text-blue-800">Đang đồng bộ dữ liệu quản trị...</div>;
  if (lastError) return <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex gap-2"><AlertTriangle className="w-4 h-4 flex-none" /><span>{lastError} Hệ thống đang hiển thị dữ liệu cục bộ để không gián đoạn giao diện.</span></div>;
  return <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-900">Nguồn dữ liệu: <strong>{dataSource === 'supabase' ? 'Supabase đã đồng bộ' : 'Chế độ demo cục bộ'}</strong>.</div>;
};

