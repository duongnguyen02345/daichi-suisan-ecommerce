import React, { useState } from 'react';
import { Check, Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';
import { useAdmin } from '../../context/AdminContext';

interface ProductTableProps {
  onEditProduct: (product: Product) => void;
}

const RoundCheckbox: React.FC<{
  checked: boolean;
  label: string;
  onChange: () => void;
}> = ({ checked, label, onChange }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0E7A32]/30 focus:ring-offset-1 ${
      checked
        ? 'border-[#0E7A32] bg-[#0E7A32] text-white'
        : 'border-gray-300 bg-white text-transparent hover:border-[#0E7A32]'
    }`}
  >
    <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
  </button>
);

export const ProductTable: React.FC<ProductTableProps> = ({ onEditProduct }) => {
  const { products, categories, deleteProduct, updateProduct } = useAdmin();
  
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMessage, setActionMessage] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const pageSize = 8;

  const categoryTabs = [
    { id: 'all', label: 'Tất cả sản phẩm' },
    ...categories.filter((item) => item.active !== false).map((item) => ({ id: item.slug, label: item.name })),
  ];

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchCategory =
      activeTab === 'all' ||
      p.category === activeTab;

    const matchSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'in_stock' && p.status === 'in_stock') ||
      (statusFilter === 'low_stock' && p.status === 'low_stock') ||
      (statusFilter === 'out_of_stock' && p.status === 'out_of_stock');

    return matchCategory && matchSearch && matchStatus;
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentItems = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const allCurrentSelected = currentItems.length > 0 && currentItems.every((product) => selectedIds.includes(product.id));

  const toggleSelectAll = () => {
    const currentIds = new Set(currentItems.map((product) => product.id));
    if (allCurrentSelected) {
      setSelectedIds((current) => current.filter((id) => !currentIds.has(id)));
    } else {
      setSelectedIds((current) => Array.from(new Set([...current, ...currentIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleProductStatus = async (product: Product) => {
    const isOn = product.publicationStatus === 'published' && !product.temporarilyUnavailable;
    setTogglingId(product.id);
    const result = await updateProduct(product.id, {
      publicationStatus: isOn ? 'draft' : 'published',
      temporarilyUnavailable: isOn,
      status: isOn
        ? 'temporarily_unavailable'
        : product.stock <= 0
          ? 'out_of_stock'
          : product.stock <= (product.lowStockThreshold ?? 10)
            ? 'low_stock'
            : 'in_stock',
    });
    setTogglingId(null);
    setActionMessage(result.message);
  };

  const handleArchive = async (product: Product) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn ${product.publicationStatus === 'archived' ? 'xóa' : 'lưu trữ'} sản phẩm “${product.name}”?`,
    );
    if (!confirmed) return;
    const result = await deleteProduct(product.id);
    setActionMessage(result.message);
  };

  return (
    <div className="bg-white rounded-[12px] border border-gray-300 shadow-card overflow-hidden">
      {/* Category Tabs */}
      <div className="flex items-center border-b border-gray-300 overflow-x-auto no-scrollbar px-5 pt-3">
        {categoryTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`pb-3 px-3 text-xs font-bold whitespace-nowrap transition relative ${
                isActive ? 'text-[#0E7A32]' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0E7A32]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-gray-300 bg-gray-50/30">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full bg-white border border-gray-200 rounded-[12px] pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-[12px] px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="in_stock">Đang bán</option>
            <option value="low_stock">Sắp hết hàng</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>

          {/* Sort Dropdown */}
          <select className="bg-white border border-gray-200 rounded-[12px] px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0E7A32]">
            <option>Mới nhất</option>
            <option>Giá tăng dần</option>
            <option>Giá giảm dần</option>
            <option>Tồn kho nhiều nhất</option>
          </select>
        </div>
      </div>

      {actionMessage && (
        <div role="status" className="px-5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border-b border-emerald-100">
          {actionMessage}
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto px-4 pt-3">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-xs">
          <thead className="text-gray-700 font-bold tracking-wide text-[11px]">
            <tr>
              <th className="w-12 rounded-l-[12px] bg-[#EAF7EE] py-3 px-4">
                <RoundCheckbox
                  checked={allCurrentSelected}
                  onChange={toggleSelectAll}
                  label={allCurrentSelected ? 'Bỏ chọn tất cả sản phẩm trên trang' : 'Chọn tất cả sản phẩm trên trang'}
                />
              </th>
              <th className="bg-[#EAF7EE] py-3 px-4">Sản phẩm</th>
              <th className="bg-[#EAF7EE] py-3 px-4">Danh mục</th>
              <th className="bg-[#EAF7EE] py-3 px-4">Giá bán</th>
              <th className="bg-[#EAF7EE] py-3 px-4">Tồn kho</th>
              <th className="bg-[#EAF7EE] py-3 px-4">Trạng thái</th>
              <th className="rounded-r-[12px] bg-[#EAF7EE] py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="[&_tr_td]:border-b [&_tr_td]:border-gray-300">
            {currentItems.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <tr
                  key={product.id}
                  className={`hover:bg-emerald-50/20 transition ${isSelected ? 'bg-emerald-50/40' : ''}`}
                >
                  <td className="py-3 px-4">
                    <RoundCheckbox
                      checked={isSelected}
                      onChange={() => toggleSelectOne(product.id)}
                      label={`${isSelected ? 'Bỏ chọn' : 'Chọn'} sản phẩm ${product.name}`}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{product.name}</div>
                        <div className="text-[10px] text-gray-400">
                          SKU: {product.sku} · {product.publicationStatus === 'draft' ? 'Bản nháp' : product.publicationStatus === 'archived' ? 'Lưu trữ' : 'Đã xuất bản'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-600">
                    {product.categoryName}
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">
                    <div>{formatPrice(product.price)}</div>
                    <div className="text-[10px] font-medium text-gray-400">
                      VAT {product.vatRate ?? 0}% · {product.vatCalculation === 'exclusive' ? 'chưa gồm thuế' : 'đã gồm thuế'}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-800">
                    {product.stock}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={product.publicationStatus === 'published' && !product.temporarilyUnavailable}
                        aria-label={`${product.publicationStatus === 'published' && !product.temporarilyUnavailable ? 'Tắt' : 'Bật'} sản phẩm ${product.name}`}
                        disabled={togglingId === product.id || product.publicationStatus === 'archived'}
                        onClick={() => void toggleProductStatus(product)}
                        className={`relative inline-flex h-6 w-11 flex-none rounded-full transition-colors disabled:opacity-50 ${
                          product.publicationStatus === 'published' && !product.temporarilyUnavailable
                            ? 'bg-[#0E7A32]'
                            : 'bg-gray-300'
                        }`}
                      >
                        <span className={`mt-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          product.publicationStatus === 'published' && !product.temporarilyUnavailable
                            ? 'translate-x-[22px]'
                            : 'translate-x-0.5'
                        }`} />
                      </button>
                      <span className="text-[11px] font-bold text-gray-600">
                        {product.publicationStatus === 'published' && !product.temporarilyUnavailable ? 'On' : 'Off'}
                        {product.stock <= 0 ? ' · Hết hàng' : product.stock <= (product.lowStockThreshold ?? 10) ? ' · Sắp hết' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEditProduct(product)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void handleArchive(product)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Xóa sản phẩm"
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

      {/* Pagination Bar */}
      <div className="px-5 py-4 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <div>
          Hiển thị{' '}
          <span className="font-bold text-gray-900">
            {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, totalItems)}
          </span>{' '}
          trong tổng <span className="font-bold text-gray-900">{totalItems}</span> sản phẩm
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg font-bold transition ${
                  currentPage === pageNum
                    ? 'bg-[#0E7A32] text-white shadow-xs'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
