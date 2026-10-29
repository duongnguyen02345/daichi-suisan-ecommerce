import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, List, ChevronDown, Check } from 'lucide-react';
import { FilterState } from '../../types';

interface ProductSortBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const ProductSortBar: React.FC<ProductSortBarProps> = ({ filters, setFilters }) => {
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  const sizeLabels: Record<'large' | 'medium' | 'small', string> = {
    large: 'Lớn',
    medium: 'Vừa',
    small: 'Nhỏ',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
        setIsSizeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-3 sm:gap-4 shrink-0">
      {/* Desktop Card Size Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-700">Kích thước:</span>
        <div className="relative" ref={sizeDropdownRef}>
          <button
            type="button"
            onClick={() => setIsSizeDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-[#F8F9F5] hover:bg-gray-100 border border-[#E5E7EB] px-3 py-1.5 rounded-[10px] text-xs font-semibold text-[#111827] transition shadow-2xs cursor-pointer"
            aria-expanded={isSizeDropdownOpen}
            aria-haspopup="true"
          >
            <span>{sizeLabels[filters.cardSize || 'small']}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                isSizeDropdownOpen ? 'rotate-180 text-[#0E7A32]' : ''
              }`}
            />
          </button>

          {isSizeDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-28 bg-white rounded-[12px] border border-[#E5E7EB] shadow-lg py-1.5 z-30 animate-fadeIn">
              {(['large', 'medium', 'small'] as const).map((size) => {
                const isActive = (filters.cardSize || 'small') === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setFilters((p) => ({ ...p, cardSize: size }));
                      setIsSizeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-[#0E7A32] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <span>{sizeLabels[size]}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-[#0E7A32]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid / List Switcher */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-700 hidden sm:inline">
          Hiển thị:
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilters((p) => ({ ...p, viewMode: 'grid' }))}
            className={`p-2 rounded-[10px] transition cursor-pointer ${
              filters.viewMode === 'grid'
                ? 'bg-[#0E7A32] text-white shadow-xs'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            aria-label="Grid view"
            title="Lưới"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFilters((p) => ({ ...p, viewMode: 'list' }))}
            className={`p-2 rounded-[10px] transition cursor-pointer ${
              filters.viewMode === 'list'
                ? 'bg-[#0E7A32] text-white shadow-xs'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            aria-label="List view"
            title="Danh sách"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
