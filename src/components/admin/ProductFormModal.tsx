import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, Crop, Trash2, HelpCircle, FolderOpen, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { formatPrice } from '../../lib/utils';
import { getVatBreakdown, VatCalculation } from '../../lib/vat';
import { ImageCropModal } from './ImageCropModal';
import { MediaPickerModal } from './MediaPickerModal';
import { dataUrlToFile, uploadMediaAsset } from '../../lib/mediaApi';

interface ProductFormModalProps {
  product: Product | null; // null if adding new
  isOpen: boolean;
  onClose: () => void;
}

const createProductSlug = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[đĐ]/g, 'd')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const computeSellingPrice = (
  basePrice: number,
  active: boolean,
  type: 'percent' | 'amount',
  val: number
) => {
  if (!active || val <= 0) return basePrice;
  if (type === 'percent') {
    const clampedPercent = Math.min(100, Math.max(0, val));
    const discountAmount = Math.round(basePrice * (clampedPercent / 100));
    return Math.max(0, basePrice - discountAmount);
  } else {
    const clampedAmount = Math.min(basePrice, Math.max(0, val));
    return Math.max(0, basePrice - clampedAmount);
  }
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addProduct, updateProduct, categories } = useAdmin();

  // Basic Information
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('rau-cu-qua');
  const [origin, setOrigin] = useState('Đà Lạt');
  const [unit, setUnit] = useState('500g');
  const [stock, setStock] = useState(50);

  // Pricing & Discount State
  const [originalPrice, setOriginalPrice] = useState(30000);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(10);
  const [price, setPrice] = useState(27000);

  // Status & Flags (Hàng 5)
  const [publicationStatus, setPublicationStatus] = useState<Product['publicationStatus']>('published');
  const [isBestSeller, setIsBestSeller] = useState(false);

  // VAT
  const [vatRate, setVatRate] = useState(0);
  const [vatCalculation, setVatCalculation] = useState<VatCalculation>('inclusive');

  // Specs & Settings
  const [storage, setStorage] = useState('Ngăn mát tủ lạnh');
  const [expiry, setExpiry] = useState('7 ngày');
  const [image, setImage] = useState('');
  const [isOrganic] = useState(false);
  const [description, setDescription] = useState('');
  const [lowStockThreshold] = useState(10);
  const [temporarilyUnavailable, setTemporarilyUnavailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  // Image upload & crop state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setCategory(product.category);
      setOrigin(product.origin || 'Đà Lạt');
      setUnit(product.unit || '500g');
      setStock(product.stock);

      const origPrice = product.originalPrice || product.price;
      const currentPrice = product.price;
      setOriginalPrice(origPrice);

      if (origPrice > currentPrice) {
        setHasDiscount(true);
        if (product.discountPercent && product.discountPercent > 0) {
          setDiscountType('percent');
          setDiscountValue(product.discountPercent);
        } else {
          setDiscountType('amount');
          setDiscountValue(origPrice - currentPrice);
        }
        setPrice(currentPrice);
      } else {
        setHasDiscount(false);
        setDiscountType('percent');
        setDiscountValue(10);
        setPrice(origPrice);
      }

      setPublicationStatus(product.publicationStatus || 'published');
      setIsBestSeller(!!product.isBestSeller);
      setTemporarilyUnavailable(Boolean(product.temporarilyUnavailable));

      setVatRate(product.vatRate ?? 0);
      setVatCalculation(product.vatCalculation || 'inclusive');
      setStorage(product.storage);
      setExpiry(product.expiry);
      setImage(product.image);
      setDescription(product.description || '');
    } else {
      setName('');
      setSku(`SP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`);
      setCategory('rau-cu-qua');
      setOrigin('Đà Lạt');
      setUnit('500g');
      setStock(50);

      const defaultOrig = 30000;
      setOriginalPrice(defaultOrig);
      setHasDiscount(false);
      setDiscountType('percent');
      setDiscountValue(10);
      setPrice(defaultOrig);

      setPublicationStatus('published');
      setIsBestSeller(false);
      setTemporarilyUnavailable(false);

      setVatRate(0);
      setVatCalculation('inclusive');
      setStorage('Ngăn mát tủ lạnh');
      setExpiry('7 ngày');
      setImage('https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80');
      setDescription('');
    }
    setFormMessage('');
    setShowUrlInput(false);
    setCropModalOpen(false);
    setPendingCropImage('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  // Handlers for Pricing & Discounts
  const handleOriginalPriceChange = (newOrig: number) => {
    const val = Math.max(0, newOrig);
    setOriginalPrice(val);
    setPrice(computeSellingPrice(val, hasDiscount, discountType, discountValue));
  };

  const handleToggleDiscount = () => {
    const nextState = !hasDiscount;
    setHasDiscount(nextState);
    if (nextState && discountValue <= 0) {
      const defaultVal = discountType === 'percent' ? 10 : Math.round(originalPrice * 0.1);
      setDiscountValue(defaultVal);
      setPrice(computeSellingPrice(originalPrice, true, discountType, defaultVal));
    } else {
      setPrice(computeSellingPrice(originalPrice, nextState, discountType, discountValue));
    }
  };

  const handleDiscountValueChange = (val: number) => {
    const safeVal = Math.max(0, val);
    setDiscountValue(safeVal);
    setPrice(computeSellingPrice(originalPrice, hasDiscount, discountType, safeVal));
  };

  const handleSwitchDiscountType = (newType: 'percent' | 'amount') => {
    if (newType === discountType) return;
    if (discountType === 'percent' && newType === 'amount') {
      const convertedAmount = Math.round(originalPrice * (discountValue / 100));
      setDiscountType('amount');
      setDiscountValue(convertedAmount);
      setPrice(computeSellingPrice(originalPrice, hasDiscount, 'amount', convertedAmount));
    } else {
      const convertedPercent = originalPrice > 0
        ? Math.min(100, Math.round((discountValue / originalPrice) * 100))
        : 0;
      setDiscountType('percent');
      setDiscountValue(convertedPercent);
      setPrice(computeSellingPrice(originalPrice, hasDiscount, 'percent', convertedPercent));
    }
  };

  // Image Upload & Crop
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormMessage('Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP).');
      return;
    }

    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const isOverSize = file.size > MAX_FILE_SIZE;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = async () => {
        const { naturalWidth, naturalHeight } = img;
        const exceedsDimension = naturalWidth > 800 || naturalHeight > 800;
        const isNotSquare = Math.abs(naturalWidth - naturalHeight) > 10;

        if (isOverSize || exceedsDimension || isNotSquare) {
          setPendingCropImage(dataUrl);
          setCropModalOpen(true);
        } else {
          setIsUploadingImage(true);
          try {
            const asset = await uploadMediaAsset(file, { folder: 'products' });
            setImage(asset.publicUrl);
          } catch (err) {
            setFormMessage(err instanceof Error ? err.message : 'Tải ảnh sản phẩm thất bại.');
          } finally {
            setIsUploadingImage(false);
          }
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleOpenCropOnCurrent = () => {
    if (!image) return;
    setPendingCropImage(image);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setIsUploadingImage(true);
    try {
      const file = dataUrlToFile(croppedDataUrl, `prod_${Date.now()}.png`);
      const asset = await uploadMediaAsset(file, { folder: 'products' });
      setImage(asset.publicUrl);
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Tải ảnh đã cắt lên lưu trữ thất bại.');
    } finally {
      setIsUploadingImage(false);
      setCropModalOpen(false);
      setPendingCropImage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage('');
    const normalizedName = name.trim();
    const normalizedSku = sku.trim().toUpperCase();

    if (!normalizedName || !normalizedSku) {
      setFormMessage('Vui lòng nhập tên sản phẩm và mã SKU.');
      return;
    }
    if (price < 0 || originalPrice < price) {
      setFormMessage('Giá gốc phải lớn hơn hoặc bằng giá bán.');
      return;
    }
    if (stock < 0) {
      setFormMessage('Số lượng tồn kho không được âm.');
      return;
    }
    if (vatRate < 0 || vatRate > 100) {
      setFormMessage('Thuế suất VAT phải nằm trong khoảng từ 0% đến 100%.');
      return;
    }

    setIsSubmitting(true);
    const catObj = categories.find((c) => c.slug === category);
    const categoryName = catObj ? catObj.name : 'Rau củ quả';

    let status: Product['status'] = 'in_stock';
    if (publicationStatus === 'draft' || temporarilyUnavailable) {
      status = 'temporarily_unavailable';
    } else if (stock <= 0) {
      status = 'out_of_stock';
    } else if (stock <= lowStockThreshold) {
      status = 'low_stock';
    }

    const discountPercent =
      hasDiscount && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined;

    const result = product
      ? await updateProduct(product.id, {
        name: normalizedName,
        sku: normalizedSku,
        category,
        categoryName,
        price,
        originalPrice,
        vatRate,
        vatCalculation,
        discountPercent,
        stock,
        status,
        unit,
        origin,
        storage,
        expiry,
        image,
        isOrganic,
        isBestSeller,
        description,
        publicationStatus,
        lowStockThreshold,
        temporarilyUnavailable: publicationStatus === 'draft',
      })
      : await addProduct({
        sku: normalizedSku,
        name: normalizedName,
        slug: createProductSlug(normalizedName),
        price,
        originalPrice,
        vatRate,
        vatCalculation,
        discountPercent,
        rating: 5.0,
        reviewCount: 1,
        soldCount: '10+',
        image,
        gallery: [image],
        category,
        categoryName,
        unit,
        origin,
        storage,
        expiry,
        stock,
        status,
        isOrganic,
        isBestSeller,
        isFeatured: false,
        tags: [categoryName],
        description,
        publicationStatus,
        lowStockThreshold,
        temporarilyUnavailable: publicationStatus === 'draft',
        benefits: ['Tươi ngon an toàn', 'Nguồn gốc xuất xứ rõ ràng'],
      });

    setIsSubmitting(false);
    setFormMessage(result.message);
    if (result.success) onClose();
  };

  const isPublished = publicationStatus === 'published';

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
        <div
          className="bg-white rounded-[28px] max-w-5xl w-full overflow-hidden shadow-modal border border-[#E5E7EB] relative animate-fadeSlideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
            <h3 className="font-bold text-gray-900 text-base">
              {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
            {/* Khu vực thông tin sản phẩm (5 HÀNG x 2 CỘT) + Khu vực Upload ảnh (Cùng hàng đỉnh) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 5 HÀNG & 2 CỘT */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* HÀNG 1: Tên sản phẩm - Mã SKU */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Vd: Ba Chỉ Bò Mỹ"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32] focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mã SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Vd: SP-C18C2334"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32] focus:border-transparent transition uppercase"
                  />
                </div>

                {/* HÀNG 2: Danh mục - Xuất xứ */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32] focus:border-transparent transition bg-white"
                  >
                    {categories.filter((item) => item.active !== false).map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Xuất xứ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Đà Lạt / Mỹ / Nhật Bản"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32] focus:border-transparent transition"
                  />
                </div>

                {/* HÀNG 3: Đơn vị tính - Tồn kho */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Đơn vị tính <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="1kg / 500g / Khay"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32] focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tồn kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32] focus:border-transparent transition"
                  />
                </div>

                {/* HÀNG 4: Giá sản phẩm (Giá gốc ở vị trí Giá bán; Ưu đãi ở vị trí Giá gốc) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Giá gốc (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={originalPrice}
                    onChange={(e) => handleOriginalPriceChange(Number(e.target.value))}
                    placeholder="300000"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32] focus:border-transparent transition"
                  />
                  <span className="block text-[11px] text-gray-400 mt-1">Giá niêm yết ban đầu</span>
                </div>

                <div>
                  {/* Header Ưu đãi với switch-button on-off */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <label className="block text-xs font-bold text-gray-700">Ưu đãi</label>
                      <span title="Bật ưu đãi để áp dụng giảm giá theo phần trăm hoặc số tiền" className="cursor-help text-gray-400 hover:text-gray-600">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hasDiscount}
                      onClick={handleToggleDiscount}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        hasDiscount ? 'bg-[#0E7A32]' : 'bg-gray-300'
                      }`}
                      title={hasDiscount ? 'Đang bật ưu đãi (Click để tắt)' : 'Đang tắt ưu đãi (Click để bật)'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          hasDiscount ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Input Ưu đãi với bộ chọn [ đ | % ] như ảnh 2 */}
                  {hasDiscount ? (
                    <div>
                      <div className="relative flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-[#0E7A32] focus-within:border-transparent transition overflow-hidden">
                        <input
                          type="number"
                          min="0"
                          max={discountType === 'percent' ? 100 : originalPrice}
                          value={discountValue}
                          onChange={(e) => handleDiscountValueChange(Number(e.target.value))}
                          placeholder={discountType === 'percent' ? '10' : '50000'}
                          className="w-full text-xs p-2.5 outline-none bg-transparent font-medium"
                        />
                        <div className="flex items-center p-0.5 bg-gray-100 rounded-lg mr-1.5 border border-gray-200 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSwitchDiscountType('amount')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                              discountType === 'amount'
                                ? 'bg-gray-800 text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            title="Giảm theo số tiền (VNĐ)"
                          >
                            đ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchDiscountType('percent')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                              discountType === 'percent'
                                ? 'bg-gray-800 text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            title="Giảm theo phần trăm (%)"
                          >
                            %
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1 text-gray-500">
                        <span>Giá bán sau ưu đãi:</span>
                        <span className="font-bold text-[#0E7A32]">{formatPrice(price)}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        onClick={handleToggleDiscount}
                        className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-2 text-xs text-gray-400 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition h-[38px]"
                      >
                        <span>Tắt ưu đãi (Click để bật)</span>
                        <span className="text-[11px] font-semibold text-gray-600">{formatPrice(originalPrice)}</span>
                      </div>
                      <span className="block text-[11px] text-gray-400 mt-1">Khách sẽ mua với giá gốc</span>
                    </div>
                  )}
                </div>

                {/* HÀNG 5: Trạng thái & Sản phẩm bán chạy (Cả 2 có switch-button On/Off) */}
                <div className="rounded-xl border border-gray-200 bg-white p-2.5 flex items-center justify-between shadow-xs">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Trạng thái</label>
                    <span className={`text-[11px] font-medium ${isPublished ? 'text-[#0E7A32]' : 'text-gray-400'}`}>
                      {isPublished ? 'Đang hiển thị' : 'Đang ẩn'}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublished}
                    onClick={() => {
                      const next = isPublished ? 'draft' : 'published';
                      setPublicationStatus(next);
                      setTemporarilyUnavailable(next === 'draft');
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPublished ? 'bg-[#0E7A32]' : 'bg-gray-300'
                    }`}
                    title={isPublished ? 'Đang hiển thị (Click để ẩn)' : 'Đang ẩn (Click để hiển thị)'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isPublished ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-2.5 flex items-center justify-between shadow-xs">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Sản phẩm bán chạy</label>
                    <span className={`text-[11px] font-medium ${isBestSeller ? 'text-amber-600' : 'text-gray-400'}`}>
                      {isBestSeller ? 'Huy hiệu Nổi bật' : 'Bình thường'}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isBestSeller}
                    onClick={() => setIsBestSeller(!isBestSeller)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isBestSeller ? 'bg-[#0E7A32]' : 'bg-gray-300'
                    }`}
                    title={isBestSeller ? 'Đang bật Bán chạy (Click để tắt)' : 'Đang tắt Bán chạy (Click để bật)'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isBestSeller ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Cột phải: Khu vực upload ảnh sản phẩm (Căn chuẩn vị trí đỉnh với hàng Tên sản phẩm - Mã SKU) */}
              <div className="lg:col-span-4 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Thêm hình ảnh
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Tối đa 800x800px
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {image ? (
                  <div className="relative border-2 border-gray-200 rounded-2xl p-3 bg-gray-50/50 flex flex-col items-center">
                    <div className="w-full aspect-square max-h-[250px] rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center shadow-xs">
                      <img
                        src={image}
                        alt="Ảnh sản phẩm"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-3 w-full">
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="flex-1 py-1.5 px-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#0E7A32] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition"
                        title="Chọn từ thư viện hình ảnh"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Thư viện</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenCropOnCurrent}
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
                        onClick={() => setImage('')}
                        className="p-1.5 bg-white border border-gray-200 hover:border-red-400 hover:text-red-600 text-gray-500 rounded-lg shadow-xs transition"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] transition-all duration-200 ${
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
                      JPG, PNG (Tối đa 2MB)
                    </p>
                    <span className="inline-block mt-3 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-medium px-2 py-0.5 rounded-full">
                      Chuẩn 800x800px (Sẽ mở khung cắt nếu vượt quá)
                    </span>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMediaPickerOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#0E7A32] text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Chọn từ thư viện</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-gray-500 hover:text-[#0E7A32] underline"
                  >
                    {showUrlInput ? 'Ẩn nhập URL' : 'Hoặc nhập link URL ảnh'}
                  </button>
                  {showUrlInput && (
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="mt-1.5 w-full text-xs p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E7A32]"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Khối Cách tính VAT (Đã loại bỏ các chú thích dài, tính mẫu thu về 1 hàng) */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Cách tính VAT</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs font-bold text-gray-700">
                  Thuế suất VAT (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={vatRate}
                    onChange={(event) => setVatRate(Number(event.target.value))}
                    className="mt-1 w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#0E7A32]"
                  />
                </label>
                <label className={`sm:col-span-1 rounded-xl border p-2.5 cursor-pointer flex items-center transition ${vatCalculation === 'exclusive' ? 'border-[#0E7A32] bg-white ring-1 ring-[#0E7A32]' : 'border-gray-200 bg-white/70'}`}>
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    <input type="radio" name="vatCalculation" checked={vatCalculation === 'exclusive'} onChange={() => setVatCalculation('exclusive')} className="accent-[#0E7A32]" />
                    Xuôi – giá chưa VAT
                  </span>
                </label>
                <label className={`sm:col-span-1 rounded-xl border p-2.5 cursor-pointer flex items-center transition ${vatCalculation === 'inclusive' ? 'border-[#0E7A32] bg-white ring-1 ring-[#0E7A32]' : 'border-gray-200 bg-white/70'}`}>
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    <input type="radio" name="vatCalculation" checked={vatCalculation === 'inclusive'} onChange={() => setVatCalculation('inclusive')} className="accent-[#0E7A32]" />
                    Ngược – giá đã VAT
                  </span>
                </label>
              </div>

              {/* Tính mẫu VAT trên 1 hàng duy nhất */}
              {(() => {
                const preview = getVatBreakdown(price, vatRate, vatCalculation);
                return (
                  <div className="rounded-xl bg-white/90 border border-emerald-100/60 p-2.5 flex flex-wrap items-center justify-around gap-4 text-xs">
                    <span className="text-gray-600">
                      Trước VAT: <strong className="text-gray-900 font-bold">{formatPrice(preview.netPrice)}</strong>
                    </span>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <span className="text-gray-600">
                      Tiền VAT: <strong className="text-gray-900 font-bold">{formatPrice(preview.vatAmount)}</strong>
                    </span>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <span className="text-gray-600">
                      Khách trả: <strong className="text-[#0E7A32] font-bold">{formatPrice(preview.grossPrice)}</strong>
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Mô tả sản phẩm */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả sản phẩm</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chất lượng, hương vị và chứng nhận thực phẩm..."
                className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32]"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              {formMessage && <p role="status" className="mr-auto text-xs font-semibold text-rose-600">{formMessage}</p>}
              <button
                type="button"
                onClick={onClose}
                className="px-5 h-[42px] border border-gray-200 text-gray-600 rounded-[12px] text-xs font-semibold hover:bg-gray-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 h-[42px] bg-[#0E7A32] text-white rounded-[12px] text-xs font-semibold hover:bg-[#0A5C25] transition duration-200 hover:scale-[1.02] shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang lưu...' : product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Cắt ảnh sản phẩm (ảnh 3) */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={pendingCropImage}
        onClose={() => {
          setCropModalOpen(false);
          setPendingCropImage('');
        }}
        onComplete={handleCropComplete}
        targetWidth={800}
        targetHeight={800}
      />

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(asset) => {
          setImage(asset.publicUrl);
          setFormMessage('');
        }}
        title="Chọn ảnh sản phẩm từ thư viện"
        allowedFolder="products"
      />
    </>
  );
};
