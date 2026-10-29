import React, { useMemo, useState, useRef } from 'react';
import {
  BadgePercent,
  ChevronDown,
  ChevronUp,
  Crop,
  Edit3,
  FolderOpen,
  FolderTree,
  GripVertical,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Category } from '../../types';
import { isDiscountedProduct, PROMOTION_CATEGORY_SLUG } from '../../lib/catalog';
import { ImageCropModal } from './ImageCropModal';
import { MediaPickerModal } from './MediaPickerModal';
import { dataUrlToFile, uploadMediaAsset } from '../../lib/mediaApi';

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const emptyDraft: Omit<Category, 'id' | 'count'> = {
  name: '',
  slug: '',
  image: '',
  description: '',
  sortOrder: 0,
  active: true,
};

export const CategoriesSection: React.FC = () => {
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    reorderCategories,
    archiveCategory,
  } = useAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Image upload & crop state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage({ success: false, text: 'Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP).' });
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
            const asset = await uploadMediaAsset(file, { folder: 'categories' });
            setDraft((current) => ({ ...current, image: asset.publicUrl }));
            setMessage({ success: true, text: 'Đã tải ảnh danh mục thành công.' });
          } catch (err) {
            setMessage({ success: false, text: err instanceof Error ? err.message : 'Tải ảnh danh mục thất bại.' });
          } finally {
            setIsUploadingImage(false);
          }
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleOpenCropOnCurrent = () => {
    if (!draft.image) return;
    setPendingCropImage(draft.image);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setIsUploadingImage(true);
    try {
      const file = dataUrlToFile(croppedDataUrl, `cat_${Date.now()}.png`);
      const asset = await uploadMediaAsset(file, { folder: 'categories' });
      setDraft((current) => ({ ...current, image: asset.publicUrl }));
      setMessage({ success: true, text: 'Đã cắt và tải ảnh danh mục lên bộ nhớ thành công.' });
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : 'Tải ảnh đã cắt lên lưu trữ thất bại.' });
    } finally {
      setIsUploadingImage(false);
      setCropModalOpen(false);
      setPendingCropImage('');
    }
  };

  const productCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      if (product.publicationStatus === 'archived') return;
      counts.set(product.category, (counts.get(product.category) || 0) + 1);
    });
    return counts;
  }, [products]);

  const discountedCount = useMemo(() => {
    return products.filter((p) => isDiscountedProduct(p) && p.publicationStatus !== 'archived').length;
  }, [products]);

  const resetForm = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowUrlInput(false);
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setDraft({
      name: category.name,
      slug: category.slug,
      image: category.image,
      description: category.description || '',
      parentId: category.parentId,
      sortOrder: category.sortOrder ?? 0,
      active: category.active ?? true,
    });
    setMessage(null);
    setShowUrlInput(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    const isPromo = editingId && categories.find((c) => c.id === editingId)?.slug === PROMOTION_CATEGORY_SLUG;
    const normalizedDraft = {
      ...draft,
      slug: isPromo ? PROMOTION_CATEGORY_SLUG : slugify(draft.slug),
    };
    if (!normalizedDraft.slug) {
      setMessage({ success: false, text: 'Slug phải có ít nhất một chữ cái hoặc chữ số.' });
      setIsSaving(false);
      return;
    }
    const result = editingId
      ? await updateCategory(editingId, normalizedDraft)
      : await addCategory(normalizedDraft);
    setMessage({ success: result.success, text: result.message });
    setIsSaving(false);
    if (result.success) resetForm();
  };

  const archive = async (category: Category) => {
    if (category.slug === PROMOTION_CATEGORY_SLUG) {
      setMessage({
        success: false,
        text: 'Danh mục Khuyến mại là danh mục mặc định của hệ thống. Hãy dùng công tắc Tắt (Deactive) để ẩn trên website.',
      });
      return;
    }
    const confirmed = window.confirm(`Lưu trữ danh mục “${category.name}”?`);
    if (!confirmed) return;
    const result = await archiveCategory(category.id);
    setMessage({ success: result.success, text: result.message });
    if (result.success && editingId === category.id) resetForm();
  };

  const toggleCategory = async (category: Category) => {
    setTogglingId(category.id);
    const nextActive = category.active === false;
    const result = await updateCategory(category.id, { active: nextActive });
    setTogglingId(null);
    setMessage({
      success: result.success,
      text: result.success
        ? `Đã ${nextActive ? 'bật (Active)' : 'tắt (Deactive)'} danh mục “${category.name}”.`
        : result.message,
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...categories];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);

    const result = await reorderCategories(updated.map((c) => c.id));
    setMessage({ success: result.success, text: result.message });
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const result = await reorderCategories(updated.map((c) => c.id));
    setMessage({ success: result.success, text: result.message });
  };

  const isEditingPromotion = editingId
    ? categories.find((c) => c.id === editingId)?.slug === PROMOTION_CATEGORY_SLUG
    : false;

  return (
    <div className="grid xl:grid-cols-12 gap-6 items-start">
      {/* Form Thêm / Sửa Danh mục */}
      <form
        onSubmit={submit}
        className="xl:col-span-4 bg-white rounded-[12px] border border-gray-300 p-5 shadow-card space-y-4"
      >
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#0E7A32]" />
            {editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isEditingPromotion
              ? 'Mục Khuyến mại là danh mục hệ thống hiển thị các sản phẩm giảm giá.'
              : 'Slug là đường dẫn dùng trên cửa hàng và phải là duy nhất.'}
          </p>
        </div>

        <label className="block text-xs font-bold text-gray-700">
          Tên danh mục
          <input
            required
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value,
                slug: editingId ? current.slug : slugify(event.target.value),
              }))
            }
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal focus:ring-2 focus:ring-[#0E7A32]"
          />
        </label>

        <label className="block text-xs font-bold text-gray-700">
          Slug
          <input
            required
            disabled={isEditingPromotion}
            value={draft.slug}
            onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
            className={`mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal focus:ring-2 focus:ring-[#0E7A32] ${
              isEditingPromotion ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
            }`}
          />
        </label>

        {!isEditingPromotion && (
          <label className="block text-xs font-bold text-gray-700">
            Danh mục cha
            <select
              value={draft.parentId || ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  parentId: event.target.value || undefined,
                }))
              }
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal bg-white focus:ring-2 focus:ring-[#0E7A32]"
            >
              <option value="">Không có</option>
              {categories
                .filter(
                  (category) =>
                    category.id !== editingId &&
                    category.active !== false &&
                    category.slug !== PROMOTION_CATEGORY_SLUG,
                )
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
        )}

        {/* Khu vực upload ảnh danh mục chuẩn giao diện quản lý sản phẩm (ảnh 2) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
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

          {draft.image ? (
            <div className="relative border-2 border-gray-200 rounded-2xl p-3 bg-gray-50/50 flex flex-col items-center">
              <div className="w-full aspect-square max-h-[220px] rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center shadow-xs">
                <img
                  src={draft.image}
                  alt={draft.name || 'Ảnh danh mục'}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-3 w-full">
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="flex-1 py-1.5 px-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#0E7A32] text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs transition"
                  title="Chọn từ thư viện hình ảnh"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Thư viện</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCropOnCurrent}
                  className="flex-1 py-1.5 px-2 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1 shadow-xs transition"
                  title="Mở công cụ cắt ảnh"
                >
                  <Crop className="w-3.5 h-3.5 text-blue-500" />
                  <span>Cắt ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-1.5 px-2 bg-white border border-gray-200 hover:border-gray-400 text-gray-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1 shadow-xs transition"
                  title="Chọn ảnh khác từ máy tính"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-500" />
                  <span>Đổi ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, image: '' }))}
                  className="p-1.5 bg-white border border-gray-200 hover:border-red-400 hover:text-red-600 text-gray-500 rounded-lg shadow-xs transition"
                  title="Xóa ảnh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleFileDragOver}
              onDragLeave={handleFileDragLeave}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all duration-200 ${
                isDraggingFile
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                  : 'border-gray-200 hover:border-blue-400 bg-gray-50/60 hover:bg-blue-50/20'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2.5 shadow-xs">
                <Upload className="w-5 h-5 stroke-[2]" />
              </div>
              <p className="text-xs font-semibold text-gray-700">
                Tải ảnh lên hoặc kéo thả vào đây
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                JPG, PNG, WEBP (Tối đa 2MB)
              </p>
              <span className="inline-block mt-2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-medium px-2 py-0.5 rounded-full">
                Chuẩn 800x800px (Sẽ mở khung cắt nếu vượt quá)
              </span>
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMediaPickerOpen(true);
                  }}
                  className="px-3 py-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#0E7A32] text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Chọn từ thư viện</span>
                </button>
              </div>
            </div>
          )}

          {isUploadingImage && (
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-blue-600 font-semibold bg-blue-50 p-2 rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tải ảnh lên lưu trữ đám mây...</span>
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
                value={draft.image}
                onChange={(e) => setDraft((current) => ({ ...current, image: e.target.value }))}
                placeholder="https://..."
                className="mt-1.5 w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E7A32] font-normal"
              />
            )}
          </div>
        </div>

        <label className="block text-xs font-bold text-gray-700">
          Mô tả
          <textarea
            rows={3}
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal resize-none focus:ring-2 focus:ring-[#0E7A32]"
          />
        </label>

        <div className="grid grid-cols-2 gap-3 items-end">
          <label className="text-xs font-bold text-gray-700">
            Thứ tự sắp xếp
            <input
              type="number"
              min="0"
              value={draft.sortOrder}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value),
                }))
              }
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl font-normal focus:ring-2 focus:ring-[#0E7A32]"
            />
          </label>
          <label className="h-10 px-3 flex items-center gap-2 rounded-xl bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer border border-gray-200">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))}
              className="accent-[#0E7A32] w-4 h-4 rounded cursor-pointer"
            />
            Hiển thị (Active)
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 h-10 bg-[#0E7A32] disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#0A5C25] transition shadow-xs"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu danh mục'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              aria-label="Hủy chỉnh sửa"
              className="h-10 w-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {message ? (
          <p
            role="status"
            className={`text-xs font-semibold p-2.5 rounded-lg border ${
              message.success
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-rose-700 bg-rose-50 border-rose-200'
            }`}
          >
            {message.text}
          </p>
        ) : null}
      </form>

      {/* Bảng Danh mục hiện có có chức năng kéo thả */}
      <section className="xl:col-span-8 bg-white rounded-[12px] border border-gray-300 shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-300 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
              Danh mục hiện có
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                Kéo thả hàng để đổi thứ tự
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Thứ tự trong bảng quyết định trực tiếp vị trí hiển thị danh mục trên menu và thanh danh mục.
            </p>
          </div>
          <span className="text-xs font-bold text-[#0E7A32] bg-[#EAF7EE] px-2.5 py-1 rounded-full">
            {categories.length} danh mục
          </span>
        </div>

        <div className="overflow-x-auto px-4 pt-3 pb-4">
          <table className="w-full border-separate border-spacing-0 text-left text-xs">
            <thead className="text-gray-700 font-bold tracking-wide text-[11px]">
              <tr>
                <th className="w-16 rounded-l-[12px] bg-[#EAF7EE] py-3 px-2 text-center" title="Kéo thả / Điều hướng">
                  Vị trí
                </th>
                <th className="w-12 bg-[#EAF7EE] py-3 px-2 text-center">STT</th>
                <th className="w-36 bg-[#EAF7EE] py-3 px-3">Mã nhóm</th>
                <th className="bg-[#EAF7EE] py-3 px-4">Tên nhóm</th>
                <th className="rounded-r-[12px] bg-[#EAF7EE] py-3 px-4 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="[&_tr_td]:border-b [&_tr_td]:border-gray-300">
              {categories.map((category, index) => {
                const isActive = category.active !== false;
                const isPromo = category.slug === PROMOTION_CATEGORY_SLUG;
                const count = isPromo ? discountedCount : productCounts.get(category.slug) || 0;
                const isDragging = draggedIndex === index;
                const isOver = dragOverIndex === index;

                return (
                  <tr
                    key={category.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => {
                      e.preventDefault();
                      void handleDrop(index);
                    }}
                    className={`transition-all duration-150 select-none ${
                      isDragging
                        ? 'opacity-40 bg-emerald-50 scale-[0.99] border-2 border-dashed border-[#0E7A32]'
                        : isOver
                        ? 'border-t-2 border-[#0E7A32] bg-emerald-50/60'
                        : 'hover:bg-gray-50/80'
                    }`}
                  >
                    {/* Drag Handle & Quick Reorder Controls */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <div
                          className="cursor-grab active:cursor-grabbing p-1.5 rounded text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Kéo thả để sắp xếp thứ tự hiển thị"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => void moveCategory(index, 'up')}
                            className="p-0.5 text-gray-400 hover:text-[#0E7A32] disabled:opacity-20 disabled:hover:text-gray-400 rounded"
                            title="Di chuyển lên trên"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === categories.length - 1}
                            onClick={() => void moveCategory(index, 'down')}
                            className="p-0.5 text-gray-400 hover:text-[#0E7A32] disabled:opacity-20 disabled:hover:text-gray-400 rounded"
                            title="Di chuyển xuống dưới"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* STT */}
                    <td className="py-3.5 px-2 text-center font-semibold text-gray-600">
                      {index + 1}
                    </td>

                    {/* Mã nhóm */}
                    <td className="py-3.5 px-3 font-bold text-gray-800 tracking-wide">
                      {isPromo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-[#D03E45] border border-rose-200 text-[11px] font-bold">
                          <BadgePercent className="w-3 h-3 flex-shrink-0" />
                          KHUYẾN MÃI
                        </span>
                      ) : (
                        <span className="truncate block font-mono text-[11px]">{category.slug.toUpperCase()}</span>
                      )}
                    </td>

                    {/* Tên nhóm + ảnh */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0 shadow-2xs"
                          />
                        ) : null}
                        <div>
                          <div className="font-bold text-gray-900 text-[13px] flex items-center gap-1.5 flex-wrap">
                            {category.name}
                            {isPromo && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium border border-amber-200">
                                Mục hệ thống
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 font-normal">
                            /{category.slug} ·{' '}
                            {isPromo ? `${count} sản phẩm giảm giá` : `${count} sản phẩm`} · Thứ tự{' '}
                            {category.sortOrder ?? 0}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* Switch pill Active / Deactive */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isActive}
                          disabled={togglingId === category.id}
                          onClick={() => void toggleCategory(category)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition shadow-2xs ${
                            isActive
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50/40 hover:bg-emerald-50'
                              : 'border-rose-400 text-rose-600 bg-rose-50/40 hover:bg-rose-50'
                          }`}
                          title={isActive ? 'Nhấn để TẮT hiển thị (Deactive)' : 'Nhấn để BẬT hiển thị (Active)'}
                        >
                          {!isActive && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                          <span>{isActive ? 'Active' : 'Deactive'}</span>
                          {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                        </button>

                        {/* Nút Sửa */}
                        <button
                          type="button"
                          onClick={() => startEditing(category)}
                          title={`Sửa danh mục ${category.name}`}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Nút Xóa / Lưu trữ */}
                        <button
                          type="button"
                          disabled={isPromo}
                          onClick={() => void archive(category)}
                          title={
                            isPromo
                              ? 'Danh mục Khuyến mại là danh mục hệ thống. Bạn có thể Tắt (Deactive) để ẩn.'
                              : `Lưu trữ danh mục ${category.name}`
                          }
                          className={`p-1.5 rounded-lg transition ${
                            isPromo
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-sky-600 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Image Crop Modal (Chuẩn 1:1 tỉ lệ vuông cho danh mục) */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={pendingCropImage}
        title="Cắt ảnh danh mục"
        aspectRatioLabel="1:1 Vuông"
        targetWidth={800}
        targetHeight={800}
        onClose={() => {
          setCropModalOpen(false);
          setPendingCropImage('');
        }}
        onComplete={handleCropComplete}
      />

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(asset) => {
          setDraft((current) => ({ ...current, image: asset.publicUrl }));
          setMessage({ success: true, text: 'Đã chọn ảnh từ thư viện.' });
        }}
        title="Chọn ảnh danh mục từ thư viện"
        allowedFolder="categories"
      />
    </div>
  );
};
