import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, X, LayoutGrid } from 'lucide-react';
import { mockCategories } from '../../data/mockData';
import { FilterState } from '../../types';

interface ProductFilterSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  selectedCategorySlug: string;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({
  filters,
  setFilters,
  resetFilters,
  selectedCategorySlug,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const brandsList = ['Vinamit', 'CP', 'Đà Lạt Farm', 'Ba Huân', 'TH True Milk', 'Vissan'];
  const certsList = [
    { id: 'organic', label: 'Hữu cơ (Organic)' },
    { id: 'vietgap', label: 'VietGAP' },
    { id: 'no_preservatives', label: 'Không chất bảo quản' },
    { id: 'traceable', label: 'An toàn, rõ nguồn gốc' },
  ];
  const dealsList = [
    { id: 'discount', label: 'Đang giảm giá' },
    { id: 'freeship', label: 'Freeship' },
    { id: 'new', label: 'Sản phẩm mới' },
  ];

  const priceRanges = [
    { id: 'all', label: 'Tất cả khoảng giá' },
    { id: 'under_20k', label: 'Dưới 20.000đ' },
    { id: '20k_50k', label: '20.000đ - 50.000đ' },
    { id: '50k_100k', label: '50.000đ - 100.000đ' },
    { id: '100k_200k', label: '100.000đ - 200.000đ' },
    { id: 'above_200k', label: 'Trên 200.000đ' },
  ];

  const handleBrandToggle = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handleCertToggle = (cert: string) => {
    setFilters((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const handleDealToggle = (deal: string) => {
    setFilters((prev) => ({
      ...prev,
      deals: prev.deals.includes(deal)
        ? prev.deals.filter((d) => d !== deal)
        : [...prev.deals, deal],
    }));
  };

  const sortOptions = [
    { id: 'popular', label: 'Phổ biến nhất' },
    { id: 'newest', label: 'Mới nhất' },
    { id: 'price_asc', label: 'Giá: Thấp đến cao' },
    { id: 'price_desc', label: 'Giá: Cao đến thấp' },
  ];

  return (
    <aside className="w-full lg:w-[260px] flex-shrink-0 space-y-4">
      {/* Mobile Drawer Header */}
      {isMobileDrawer && (
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-2">
          <h3 className="text-[18px] font-bold text-[#111827]">Bộ lọc & Sắp xếp</h3>
          <button
            onClick={onCloseMobileDrawer}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B7280] hover:text-[#111827] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Sắp xếp theo - Displayed in Mobile Drawer or Sidebar */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="font-semibold text-[#111827] text-[14px] mb-3 pb-2 border-b border-[#E5E7EB]">
          Sắp xếp theo
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {sortOptions.map((opt) => {
            const isActive = filters.sortBy === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilters((p) => ({ ...p, sortBy: opt.id as any }))}
                className={`px-3 py-2 rounded-[10px] text-xs font-semibold transition text-center cursor-pointer ${
                  isActive
                    ? 'bg-[#0E7A32] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Options Card */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <h3 className="font-semibold text-[#111827] text-[14px]">Bộ lọc</h3>
          <button
            onClick={resetFilters}
            className="text-[12px] text-[#0E7A32] hover:underline font-semibold min-h-[32px] flex items-center"
          >
            Xóa tất cả
          </button>
        </div>

        {/* Khoảng giá */}
        <div>
          <h4 className="text-[12px] font-bold text-[#111827] uppercase tracking-wider mb-2.5">
            Khoảng giá
          </h4>
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <label key={range.id} className="flex items-center gap-2.5 text-[13px] text-[#111827] cursor-pointer hover:text-[#0E7A32]">
                <input
                  type="radio"
                  name="priceRange"
                  checked={filters.priceRange === range.id}
                  onChange={() => setFilters((p) => ({ ...p, priceRange: range.id }))}
                  className="w-4 h-4 text-[#0E7A32] focus:ring-[#0E7A32] accent-[#0E7A32]"
                />
                <span>{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Thương hiệu */}
        <div className="pt-4 border-t border-[#E5E7EB]">
          <h4 className="text-[12px] font-bold text-[#111827] uppercase tracking-wider mb-2.5">
            Thương hiệu
          </h4>
          <div className="space-y-2">
            {brandsList.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-[13px] text-[#111827] cursor-pointer hover:text-[#0E7A32]">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                  className="w-4 h-4 rounded-[4px] text-[#0E7A32] focus:ring-[#0E7A32] accent-[#0E7A32]"
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Chứng nhận */}
        <div className="pt-4 border-t border-[#E5E7EB]">
          <h4 className="text-[12px] font-bold text-[#111827] uppercase tracking-wider mb-2.5">
            Chứng nhận
          </h4>
          <div className="space-y-2">
            {certsList.map((cert) => (
              <label key={cert.id} className="flex items-center gap-2 text-[13px] text-[#111827] cursor-pointer hover:text-[#0E7A32]">
                <input
                  type="checkbox"
                  checked={filters.certifications.includes(cert.id)}
                  onChange={() => handleCertToggle(cert.id)}
                  className="w-4 h-4 rounded-[4px] text-[#0E7A32] focus:ring-[#0E7A32] accent-[#0E7A32]"
                />
                <span>{cert.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ưu đãi */}
        <div className="pt-4 border-t border-[#E5E7EB]">
          <h4 className="text-[12px] font-bold text-[#111827] uppercase tracking-wider mb-2.5">
            Ưu đãi
          </h4>
          <div className="space-y-2">
            {dealsList.map((deal) => (
              <label key={deal.id} className="flex items-center gap-2 text-[13px] text-[#111827] cursor-pointer hover:text-[#0E7A32]">
                <input
                  type="checkbox"
                  checked={filters.deals.includes(deal.id)}
                  onChange={() => handleDealToggle(deal.id)}
                  className="w-4 h-4 rounded-[4px] text-[#0E7A32] focus:ring-[#0E7A32] accent-[#0E7A32]"
                />
                <span>{deal.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Đánh giá */}
        <div className="pt-4 border-t border-[#E5E7EB]">
          <h4 className="text-[12px] font-bold text-[#111827] uppercase tracking-wider mb-2.5">
            Đánh giá
          </h4>
          <div className="space-y-2">
            {[4, 3, 2].map((stars) => (
              <label key={stars} className="flex items-center gap-2 text-[13px] text-[#111827] cursor-pointer hover:text-[#0E7A32]">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.rating === stars}
                  onChange={() => setFilters((p) => ({ ...p, rating: stars }))}
                  className="w-4 h-4 text-[#0E7A32] focus:ring-[#0E7A32] accent-[#0E7A32]"
                />
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[#6B7280]">Từ {stars} sao</span>
                </div>
              </label>
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
};
