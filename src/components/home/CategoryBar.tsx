import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgePercent, Package, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { CartoucheButton } from '../common/CartoucheButton';
import { useAdmin } from '../../context/AdminContext';
import { isDiscountedProduct, isPublishedProduct, PROMOTION_CATEGORY_SLUG } from '../../lib/catalog';

const getMosaicSpanClass = (index: number, total: number) => {
  if (total <= 5) {
    return index < 3
      ? 'col-span-6 md:col-span-4 lg:col-span-4'
      : 'col-span-6 md:col-span-6 lg:col-span-6';
  }
  if (total === 6) return 'col-span-6 md:col-span-4 lg:col-span-4';
  return index % 7 < 4
    ? 'col-span-6 md:col-span-3 lg:col-span-3'
    : 'col-span-6 md:col-span-4 lg:col-span-4';
};

export const CategoryBar: React.FC = () => {
  const navigate = useNavigate();
  const { categories: adminCategories, products } = useAdmin();
  const categories = useMemo(() => {
    const publishedProducts = products.filter(isPublishedProduct);
    const promotionProducts = publishedProducts.filter(isDiscountedProduct);

    return adminCategories
      .filter((category) => category.active !== false)
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
      .map((category) => {
        const isPromotion = category.slug === PROMOTION_CATEGORY_SLUG;
        return {
          ...category,
          count: isPromotion
            ? promotionProducts.length
            : publishedProducts.filter((product) => product.category === category.slug).length,
          image: isPromotion && (!category.image || category.image.includes('unsplash.com/photo-1607082348824'))
            ? (promotionProducts[0]?.image || category.image)
            : category.image,
          isPromotion,
        };
      });
  }, [adminCategories, products]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'mosaic'>('list');
  const containerRef = useRef<HTMLDivElement>(null);

  // Continuous infinite loop: 0 -> 1 -> ... -> 9 -> 0 (does NOT auto-scroll the container)
  useEffect(() => {
    if (isPaused || viewMode !== 'list') return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % categories.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, categories.length, viewMode]);

  const handleCardClick = (catSlug: string, index: number) => {
    if (activeIndex === index) {
      navigate(`/category/${catSlug}`);
    } else {
      setActiveIndex(index);
    }
  };

  const handleScrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-transparent relative overflow-hidden py-1 sm:py-2">
      {/* 1. Header Centered Plaque matching Image 3 */}
      <div className="relative z-10 flex justify-center text-center mb-3 sm:mb-4">
        <CartoucheButton
          variant="crimson"
          className="text-[#FCEBC2] text-sm sm:text-base lg:text-lg xl:text-xl font-black uppercase tracking-[0.2em] h-[54px] sm:h-[62px] lg:h-[70px] px-8 sm:px-12 lg:px-16 drop-shadow-md cursor-default pointer-events-none"
        >
          <span>DANH MỤC TIÊU BIỂU</span>
        </CartoucheButton>
      </div>

      {/* 2. Tiêu đề căn trái & Chức năng Hiển thị + Xem tất cả ở cùng dòng */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        {/* Chữ "Thực phẩm sạch cho mọi gia đình" căn lề trái */}
        <h2 className="text-[22px] sm:text-[28px] lg:text-[34px] xl:text-[38px] font-black text-[#172E3D] leading-tight font-header tracking-tight text-left">
          Thực phẩm sạch cho mọi gia đình
        </h2>

        {/* Chức năng Hiển thị, Mũi tên cuộn và Xem tất cả cùng dòng */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline text-[12px] font-semibold text-[#65716C]">Hiển thị:</span>
            <div className="flex items-center gap-1 rounded-[10px] bg-[#FAF1DC] p-1 border border-[#E5CF9E] shadow-2xs" role="group" aria-label="Chọn dạng hiển thị danh mục">
              <button
                type="button"
                onClick={() => setViewMode('mosaic')}
                aria-pressed={viewMode === 'mosaic'}
                aria-label="Hiển thị dạng lưới xen kẽ"
                title="Dạng lưới xen kẽ"
                className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition ${
                  viewMode === 'mosaic'
                    ? 'bg-[#9F1D24] text-white shadow-xs'
                    : 'text-[#65716C] hover:bg-white/50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                aria-label="Hiển thị dạng danh sách"
                title="Dạng danh sách"
                className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition ${
                  viewMode === 'list'
                    ? 'bg-[#9F1D24] text-white shadow-xs'
                    : 'text-[#65716C] hover:bg-white/50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scroll Navigation Arrows */}
          <div className={`${viewMode === 'list' ? 'hidden sm:flex' : 'hidden'} items-center gap-1.5`}>
            <button
              type="button"
              onClick={handleScrollLeft}
              className="w-9 h-9 rounded-full bg-[#FAF1DC] hover:bg-[#F2E4C2] active:scale-95 text-[#9F1D24] flex items-center justify-center border border-[#E5CF9E] transition shadow-xs cursor-pointer"
              aria-label="Cuộn sang trái"
              title="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleScrollRight}
              className="w-9 h-9 rounded-full bg-[#FAF1DC] hover:bg-[#F2E4C2] active:scale-95 text-[#9F1D24] flex items-center justify-center border border-[#E5CF9E] transition shadow-xs cursor-pointer"
              aria-label="Cuộn sang phải"
              title="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link 
            to="/products"
            className="text-[13px] sm:text-[14px] font-bold text-[#9F1D24] hover:text-[#74151B] flex items-center gap-1.5 transition-colors group px-4 py-2 rounded-full bg-[#FAF1DC] border border-[#E5CF9E] shadow-xs"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* List view keeps the original expanding horizontal category experience. */}
      {viewMode === 'list' ? (
        <div 
          ref={containerRef}
          className="relative z-10 flex gap-2.5 sm:gap-3.5 h-[300px] sm:h-[340px] lg:h-[370px] overflow-x-auto category-dark-scrollbar pb-3 pt-1 select-none animate-fadeIn"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {categories.map((cat, index) => {
          const isActive = activeIndex === index;
          const formattedIndex = String(index + 1).padStart(2, '0');

          return (
            <div
              key={cat.id}
              onMouseEnter={() => {
                setActiveIndex(index);
                setIsPaused(true);
              }}
              onClick={() => handleCardClick(cat.slug, index)}
              className={`relative rounded-[20px] overflow-hidden cursor-pointer transition-all duration-500 ease-in-out border-2 shadow-md hover:shadow-xl flex-shrink-0 ${
                cat.isPromotion 
                  ? 'border-[#9F1D24] ring-2 ring-[#9F1D24]/30' 
                  : 'border-[#C99B49] hover:border-[#9F1D24]'
              } ${
                isActive
                  ? 'w-[280px] sm:w-[380px] lg:w-[480px]'
                  : 'w-[75px] sm:w-[92px] lg:w-[110px]'
              }`}
            >
              {/* Card Photo Background - Bright, vivid & natural */}
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              {cat.isPromotion ? (
                <div className="absolute inset-0 bg-gradient-to-br from-[#9F1D24]/35 via-transparent to-[#C99B49]/30 pointer-events-none" />
              ) : null}

              {/* Gradient ONLY at bottom behind text for readability */}
              <div 
                className={`absolute inset-x-0 bottom-0 pointer-events-none transition-all duration-500 ${
                  isActive
                    ? 'h-[68%] bg-gradient-to-t from-[#102F49]/95 via-[#102F49]/60 to-transparent'
                    : 'h-[50%] bg-gradient-to-t from-[#102F49]/90 via-[#102F49]/40 to-transparent'
                }`}
              />

              {/* Number Badge at Top Left */}
              <div className="absolute top-3 left-3 z-20">
                <div 
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-sm ${
                    isActive
                      ? 'bg-[#9F1D24] text-white border-2 border-[#C99B49] scale-105'
                      : 'bg-[#102F49]/80 backdrop-blur-md text-[#FCEBC2] border border-[#C99B49]/60'
                  }`}
                >
                  {formattedIndex}
                </div>
              </div>

              {/* Collapsed State: Vertical Text Running Upwards at Bottom with Navy Plaque */}
              <div
                className={`absolute inset-x-0 bottom-3 flex items-center justify-center transition-opacity duration-300 z-10 ${
                  isActive ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                }`}
              >
                <div className="bg-[#102F49]/90 backdrop-blur-xs py-3 px-2 rounded-[10px] border border-[#C99B49]/50 shadow-md">
                  <div className="[writing-mode:vertical-rl] rotate-180 text-[#FCEBC2] font-black text-xs sm:text-sm lg:text-[14px] tracking-wider whitespace-nowrap drop-shadow-sm font-label">
                    {cat.name}
                  </div>
                </div>
              </div>

              {/* Expanded State: Horizontal Name, Description, Count, CTA */}
              <div
                className={`absolute inset-0 p-5 sm:p-6 lg:p-8 flex flex-col justify-end transition-opacity duration-500 z-10 ${
                  isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Product Count Badge */}
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#102F49]/80 backdrop-blur-md text-[#FCEBC2] text-xs font-semibold shadow-xs border border-[#C99B49]/50 font-label">
                    <Package className="w-3.5 h-3.5 text-[#C99B49]" />
                    <span>{cat.count} sản phẩm tươi ngon</span>
                  </span>
                </div>

                {/* Horizontal Name */}
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-header">
                  <span className="inline-flex items-center gap-2">
                    {cat.isPromotion ? <BadgePercent className="w-6 h-6 text-[#FCEBC2] animate-pulse" /> : null}
                    {cat.name}
                  </span>
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#F0E6D2] line-clamp-2 max-w-lg mb-4 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {cat.description}
                </p>

                {/* Explore Button */}
                <div>
                  <CartoucheButton
                    to={`/category/${cat.slug}`}
                    variant={cat.isPromotion ? 'crimson' : 'emerald'}
                    className="text-white text-xs sm:text-sm font-bold h-[38px] px-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Khám phá ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </CartoucheButton>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-12 auto-rows-[180px] sm:auto-rows-[230px] lg:auto-rows-[280px] gap-3 sm:gap-4 animate-fadeIn">
          {categories.map((cat, index) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className={`${getMosaicSpanClass(index, categories.length)} group relative overflow-hidden rounded-[20px] border-2 bg-[#102F49] shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C99B49]/60 ${
                cat.isPromotion ? 'border-[#9F1D24] ring-2 ring-[#9F1D24]/30' : 'border-[#C99B49]'
              }`}
            >
              {cat.image ? (
                <img
                  src={cat.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : null}
              <div className={`absolute inset-0 ${
                cat.isPromotion
                  ? 'bg-gradient-to-t from-[#600D13]/95 via-[#9F1D24]/20 to-transparent'
                  : 'bg-gradient-to-t from-[#102F49]/95 via-[#102F49]/20 to-transparent'
              }`} />

              <span className={`absolute left-3 top-3 min-w-8 h-8 px-2 rounded-full flex items-center justify-center text-[11px] font-bold backdrop-blur-md border ${
                cat.isPromotion ? 'bg-[#9F1D24] text-white border-[#C99B49]' : 'bg-[#102F49]/90 text-[#FCEBC2] border-[#C99B49]/60'
              }`}>
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
                <div className="mx-auto flex w-fit max-w-full items-center gap-2.5 rounded-full border border-[#C99B49]/60 bg-[#102F49]/95 px-4 py-2.5 text-[#FCEBC2] shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-[1.02]">
                  {cat.isPromotion ? (
                    <BadgePercent className="w-5 h-5 flex-shrink-0 text-[#FCA5A5]" />
                  ) : (
                    <Package className="w-5 h-5 flex-shrink-0 text-[#C99B49]" />
                  )}
                  <span className="truncate text-[13px] sm:text-[15px] font-bold font-label">{cat.name}</span>
                  <span className="hidden sm:inline text-[11px] text-[#FCEBC2]/70 font-sans">{cat.count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
