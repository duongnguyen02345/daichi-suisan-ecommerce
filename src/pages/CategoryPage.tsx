import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { BadgePercent, ChevronRight, ChevronLeft, ChevronDown, Frown, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { ProductFilterSidebar } from '../components/product/ProductFilterSidebar';
import { ProductSortBar } from '../components/product/ProductSortBar';
import { ProductCard } from '../components/common/ProductCard';
import { PlacementBannerCarousel } from '../components/common/PlacementBannerCarousel';
import { FilterState } from '../types';
import { useAdmin } from '../context/AdminContext';
import { isDiscountedProduct, isPublishedProduct, productMatchesSearch, PROMOTION_CATEGORY_SLUG } from '../lib/catalog';

export const CategoryPage: React.FC = () => {
  const { products, categories } = useAdmin();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const currentSlug = slug || 'tat-ca';
  const searchTerm = (searchParams.get('search') || '').trim();
  const isPromotionCategory = currentSlug === PROMOTION_CATEGORY_SLUG || searchParams.get('deals') === 'true';
  const isAllCategories = !isPromotionCategory && (currentSlug === 'tat-ca' || currentSlug === 'all');

  const category = isPromotionCategory
    ? {
        id: 'promotion-products',
        name: 'Khuyến mại',
        slug: PROMOTION_CATEGORY_SLUG,
        description: 'Các sản phẩm đang có giá bán thấp hơn giá gốc.',
        image: '',
      }
    : isAllCategories
    ? {
        id: 'tat-ca',
        name: 'Sản phẩm',
        slug: 'tat-ca',
        description: '',
        image: '',
      }
    : categories.find((c) => c.slug === currentSlug) || categories[0] || {
        id: 'unknown-category',
        name: 'Danh mục',
        slug: currentSlug,
        description: '',
        image: '',
      };

  const initialFilters = useMemo<FilterState>(() => ({
    category: currentSlug,
    priceRange: 'all',
    brands: [],
    certifications: [],
    deals: isPromotionCategory ? ['discount'] : [],
    rating: 0,
    search: searchTerm,
    sortBy: 'popular',
    viewMode: 'grid',
    cardSize: 'small',
  }), [currentSlug, isPromotionCategory, searchTerm]);

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      category: currentSlug,
      deals: isPromotionCategory ? ['discount'] : [],
      search: searchTerm,
    }));
  }, [currentSlug, isPromotionCategory, searchTerm]);

  const toggleCategoryCollapse = (catSlug: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catSlug]: !prev[catSlug],
    }));
  };


  const resetFilters = () => {
    setFilters(initialFilters);
  };

  // Category navigation scroll state
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const activeCategoryChipRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (activeCategoryChipRef.current && categoryScrollRef.current) {
      activeCategoryChipRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentSlug, isPromotionCategory]);

  const handleScrollCategory = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 320;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Sticky state for horizontal category bar
  const [isCategoryBarSticky, setIsCategoryBarSticky] = useState(false);
  const categoryBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!categoryBarRef.current) return;
      const headerOffset = window.innerWidth >= 1024 ? 128 : window.innerWidth >= 768 ? 120 : 116;
      const rect = categoryBarRef.current.getBoundingClientRect();
      setIsCategoryBarSticky(rect.top <= headerOffset + 2);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Active products and category counts
  const activeProducts = useMemo(() => {
    return products.filter(isPublishedProduct);
  }, [products]);

  const totalProductsCount = activeProducts.length;
  const promotionProductsCount = useMemo(
    () => activeProducts.filter(isDiscountedProduct).length,
    [activeProducts],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [activeProducts]);

  // Filter products logic
  const filteredProducts = useMemo(() => {
    let result = activeProducts.filter((p) => {
      // Category match
      if (isPromotionCategory && !isDiscountedProduct(p)) {
        return false;
      }
      if (!isPromotionCategory && currentSlug && currentSlug !== 'tat-ca' && currentSlug !== 'all' && p.category !== currentSlug) {
        return false;
      }

      if (!productMatchesSearch(p, filters.search)) return false;

      // Price range
      if (filters.priceRange === 'under_20k' && p.price >= 20000) return false;
      if (filters.priceRange === '20k_50k' && (p.price < 20000 || p.price > 50000)) return false;
      if (filters.priceRange === '50k_100k' && (p.price < 50000 || p.price > 100000)) return false;
      if (filters.priceRange === '100k_200k' && (p.price < 100000 || p.price > 200000)) return false;
      if (filters.priceRange === 'above_200k' && p.price <= 200000) return false;

      // Brands
      if (filters.brands.length > 0 && (!p.brand || !filters.brands.includes(p.brand))) {
        return false;
      }

      // Certifications
      if (filters.certifications.includes('organic') && !p.isOrganic) {
        return false;
      }

      // Deals
      if (filters.deals.includes('discount') && !isDiscountedProduct(p)) {
        return false;
      }

      // Rating
      if (filters.rating > 0 && p.rating < filters.rating) {
        return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'price_asc') return a.price - b.price;
      if (filters.sortBy === 'price_desc') return b.price - a.price;
      if (filters.sortBy === 'rating_desc') return b.rating - a.rating;
      if (filters.sortBy === 'newest') return b.id.localeCompare(a.id);
      return (b.discountPercent || 0) - (a.discountPercent || 0); // popular
    });

    return result;
  }, [activeProducts, currentSlug, filters, isPromotionCategory]);

  // Visible categories sorted by sortOrder
  const visibleCategories = useMemo(() => {
    return categories
      .filter((cat) => cat.active !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categories]);

  // Group products by category when isAllCategories is true
  const categoriesWithProducts = useMemo(() => {
    const knownCategorySlugs = new Set(categories.map((cat) => cat.slug));
    const groupedCategories = categories
      .filter((cat) => cat.active !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((cat) => {
        const prods = cat.slug === PROMOTION_CATEGORY_SLUG
          ? filteredProducts.filter(isDiscountedProduct)
          : filteredProducts.filter((p) => p.category === cat.slug);
        return {
          ...cat,
          products: prods,
        };
      })
      .filter((cat) => cat.products.length > 0);

    const uncategorizedProducts = filteredProducts.filter(
      (product) => !knownCategorySlugs.has(product.category),
    );

    if (uncategorizedProducts.length > 0) {
      groupedCategories.push({
        id: 'uncategorized-products',
        name: 'Khác',
        slug: 'khac',
        description: 'Sản phẩm chưa được gán vào danh mục đang hoạt động.',
        image: '',
        count: uncategorizedProducts.length,
        products: uncategorizedProducts,
      });
    }

    return groupedCategories;
  }, [categories, filteredProducts]);

  const getProductContainerClass = () => {
    if (filters.viewMode === 'list') {
      if (filters.cardSize === 'medium') return 'grid grid-cols-1 lg:grid-cols-2 gap-4';
      if (filters.cardSize === 'small') return 'grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-3.5';
      return 'grid grid-cols-1 gap-4';
    }
    // grid view
    if (filters.cardSize === 'medium') {
      return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4';
    }
    if (filters.cardSize === 'small') {
      return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3';
    }
    return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5';
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 py-4 sm:py-6 animate-fadeIn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[14px] text-[#64748B] mb-4">
        <Link to="/" className="hover:text-[#0E7A32] transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
        {isAllCategories && !searchTerm ? (
          <span className="font-semibold text-[#183A64]">Sản phẩm</span>
        ) : (
          <>
            <Link to="/products" className="hover:text-[#0E7A32] transition-colors">Sản phẩm</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="font-semibold text-[#183A64]">
              {searchTerm ? `Tìm kiếm: ${searchTerm}` : category.name}
            </span>
          </>
        )}
      </nav>

      <PlacementBannerCarousel placement="category" className="mb-5 sm:mb-6" />

      {/* Horizontal Category Bar (Below Breadcrumb, Above Filter & Title - Sticky on scroll) */}
      <div
        ref={categoryBarRef}
        className={`sticky top-[116px] md:top-[120px] lg:top-[128px] z-30 py-2 sm:py-2.5 mb-5 sm:mb-6 -mx-4 md:-mx-5 lg:-mx-6 px-4 md:px-5 lg:px-6 transition-all duration-200 ${
          isCategoryBarSticky
            ? 'bg-[#F8F9F5]/95 backdrop-blur-md shadow-xs border-b border-[#E5E7EB]'
            : 'bg-[#F8F9F5] border-b border-transparent'
        }`}
      >
        <div className="relative flex items-center">
          {/* Left Arrow Button (Green circle on Desktop) */}
          <button
            type="button"
            onClick={() => handleScrollCategory('left')}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-[#0E7A32] hover:bg-[#0A5F26] text-white shadow-xs flex-shrink-0 mr-2.5 transition-all cursor-pointer z-10 active:scale-95 border border-[#0E7A32]"
            aria-label="Cuộn sang trái"
            title="Cuộn sang trái"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>

          {/* Scrollable Categories List (No scrollbar visible) */}
          <div
            ref={categoryScrollRef}
            className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 flex-1 select-none scroll-smooth"
          >
            {/* "Tất cả" chip */}
            <Link
              to="/products"
              ref={isAllCategories ? activeCategoryChipRef : undefined}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[13px] sm:text-[14px] whitespace-nowrap transition-all duration-200 flex-shrink-0 cursor-pointer ${
                isAllCategories
                  ? 'bg-[#0E7A32] text-white font-bold shadow-xs border border-[#0E7A32]'
                  : 'bg-white hover:bg-[#F0FDF4] text-[#183A64] hover:text-[#0E7A32] border border-[#E5E7EB] hover:border-[#0E7A32]/40 font-semibold shadow-2xs'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isAllCategories ? 'bg-white' : 'bg-[#0E7A32]'}`} />
              <span>Tất cả</span>
              <span
                className={`w-5 h-5 min-w-[20px] rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isAllCategories ? 'bg-white/20 text-white' : 'bg-[#EBF5EE] text-[#0E7A32]'
                }`}
              >
                {totalProductsCount}
              </span>
            </Link>

            {/* Each Category chip from visibleCategories (sorted by sortOrder) */}
            {visibleCategories.map((cat) => {
              if (cat.slug === PROMOTION_CATEGORY_SLUG) {
                return (
                  <Link
                    key={cat.id}
                    to={`/category/${PROMOTION_CATEGORY_SLUG}`}
                    ref={isPromotionCategory ? activeCategoryChipRef : undefined}
                    className={`promotion-highlight flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[13px] sm:text-[14px] whitespace-nowrap transition-all duration-200 flex-shrink-0 cursor-pointer border font-bold ${
                      isPromotionCategory
                        ? 'bg-[#D03E45] text-white border-[#D03E45] shadow-md'
                        : 'bg-[#FFF1F2] text-[#D03E45] border-[#D03E45]/35 hover:bg-[#D03E45] hover:text-white'
                    }`}
                  >
                    <BadgePercent className="w-4 h-4 animate-pulse" />
                    <span>{cat.name}</span>
                    <span className={`min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isPromotionCategory ? 'bg-white/20 text-white' : 'bg-[#D03E45]/10 text-[#D03E45]'
                    }`}>
                      {promotionProductsCount}
                    </span>
                  </Link>
                );
              }

              const isActive = !isAllCategories && currentSlug === cat.slug;
              const count = categoryCounts[cat.slug] ?? cat.count ?? 0;

              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  ref={isActive ? activeCategoryChipRef : undefined}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[13px] sm:text-[14px] whitespace-nowrap transition-all duration-200 flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0E7A32] text-white font-bold shadow-xs border border-[#0E7A32]'
                      : 'bg-white hover:bg-[#F0FDF4] text-[#183A64] hover:text-[#0E7A32] border border-[#E5E7EB] hover:border-[#0E7A32]/40 font-semibold shadow-2xs'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : 'bg-[#0E7A32]'}`} />
                  <span>{cat.name}</span>
                  <span
                    className={`w-5 h-5 min-w-[20px] rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#EBF5EE] text-[#0E7A32]'
                    }`}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right Arrow Button (Green circle on Desktop) */}
          <button
            type="button"
            onClick={() => handleScrollCategory('right')}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-[#0E7A32] hover:bg-[#0A5F26] text-white shadow-xs flex-shrink-0 ml-2.5 transition-all cursor-pointer z-10 active:scale-95 border border-[#0E7A32]"
            aria-label="Cuộn sang phải"
            title="Cuộn sang phải"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Mobile Filter & View Mode Bar */}
      <div className="lg:hidden mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center gap-2 bg-white border border-[#E5E7EB] px-4 min-h-[44px] rounded-[12px] text-[14px] font-semibold text-[#183A64] shadow-xs hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#0E7A32]" />
          <span>Bộ lọc & Sắp xếp</span>
        </button>

        {/* View Mode Switcher (Grid & List) on the same row */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-[12px] border border-[#E5E7EB] shadow-xs">
          <button
            onClick={() => setFilters((p) => ({ ...p, viewMode: 'grid' }))}
            className={`p-2 rounded-[8px] transition cursor-pointer ${
              filters.viewMode === 'grid'
                ? 'bg-[#0E7A32] text-white shadow-xs'
                : 'bg-transparent text-gray-500 hover:text-gray-900'
            }`}
            aria-label="Lưới"
            title="Lưới"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFilters((p) => ({ ...p, viewMode: 'list' }))}
            className={`p-2 rounded-[8px] transition cursor-pointer ${
              filters.viewMode === 'list'
                ? 'bg-[#0E7A32] text-white shadow-xs'
                : 'bg-transparent text-gray-500 hover:text-gray-900'
            }`}
            aria-label="Danh sách"
            title="Danh sách"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Sidebar 260px + Product Grid */}
      <div id="product-list" className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Desktop Sidebar (Width 260px) */}
        <div className="hidden lg:block">
          <ProductFilterSidebar
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
            selectedCategorySlug={currentSlug}
          />
        </div>

        {/* Right Product Grid Area */}
        <div className="flex-1 min-w-0 w-full">
          {/* Header Title & Controls (Size + View Mode) */}
          <div className="flex items-center justify-between pb-3 mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              {isAllCategories ? (
                <h2 className="text-[20px] lg:text-[24px] font-bold text-[#183A64]">
                  {searchTerm ? `Kết quả tìm kiếm “${searchTerm}”` : 'Sản phẩm'}
                </h2>
              ) : isPromotionCategory ? (
                <div className="promotion-highlight inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D03E45] text-white shadow-md">
                  <BadgePercent className="w-5 h-5 animate-pulse" />
                  <h2 className="text-[18px] lg:text-[20px] font-bold text-white leading-none">
                    Khuyến mại
                  </h2>
                </div>
              ) : (
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#0E7A32] text-white shadow-xs">
                  <h2 className="text-[18px] lg:text-[20px] font-bold text-white leading-none">
                    {category.name}
                  </h2>
                </div>
              )}
              <span className={`text-[12px] sm:text-[13px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                isPromotionCategory ? 'text-[#D03E45] bg-rose-50' : 'text-[#0E7A32] bg-[#EBF5EE]'
              }`}>
                {filteredProducts.length} sản phẩm
              </span>
            </div>

            {/* Desktop Size & View Mode Controls */}
            <ProductSortBar filters={filters} setFilters={setFilters} />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-[12px] p-12 text-center border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <Frown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-[18px] font-semibold text-[#183A64] mb-1">
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p className="text-[14px] text-[#64748B] mb-4">
                {searchTerm
                  ? `Không có sản phẩm nào khớp với “${searchTerm}”. Hãy thử từ khóa khác.`
                  : 'Vui lòng thử điều chỉnh lại bộ lọc giá hoặc bỏ bớt tiêu chí lọc.'}
              </p>
              <button
                onClick={() => searchTerm ? navigate('/products') : resetFilters()}
                className="bg-[#0E7A32] text-white px-5 h-[42px] rounded-[12px] text-[14px] font-semibold hover:scale-[1.02] transition-transform"
              >
                {searchTerm ? 'Xóa tìm kiếm' : 'Xóa tất cả bộ lọc'}
              </button>
            </div>
          ) : isAllCategories ? (
            /* All Products: Grouped by Category with Dropdowns / Accordions */
            <div className="space-y-4 sm:space-y-5">
              {categoriesWithProducts.map((cat) => {
                const isCollapsed = !!collapsedCategories[cat.slug];
                const isPromotionGroup = cat.slug === PROMOTION_CATEGORY_SLUG;
                return (
                  <div
                    key={cat.id}
                    className={`bg-white rounded-[12px] border p-3.5 sm:p-5 shadow-xs transition-shadow ${
                      isPromotionGroup ? 'border-[#D03E45]/30' : 'border-[#E5E7EB]'
                    }`}
                  >
                    {/* Category Dropdown Trigger (Elongated Green Rectangle enclosing title & collapse icon) */}
                    <button
                      type="button"
                      onClick={() => toggleCategoryCollapse(cat.slug)}
                      className={`w-full flex items-center justify-between text-left px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-white shadow-xs transition-all duration-200 cursor-pointer group ${
                        isPromotionGroup
                          ? 'promotion-highlight bg-[#D03E45] hover:bg-[#B83239]'
                          : 'bg-[#0E7A32] hover:bg-[#0A5F26]'
                      }`}
                      aria-expanded={!isCollapsed}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <h3 className="text-[15px] sm:text-[17px] font-bold text-white tracking-tight truncate leading-none">
                          {cat.name}
                        </h3>
                        <span className={`text-[11px] sm:text-[12px] font-bold bg-white px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-2xs ${
                          isPromotionGroup ? 'text-[#D03E45]' : 'text-[#0E7A32]'
                        }`}>
                          {cat.products.length} sản phẩm
                        </span>
                      </div>

                      {/* Dropdown Chevron */}
                      <div className="flex items-center gap-2 text-white flex-shrink-0 ml-2">
                        <span className="hidden md:inline text-[13px] font-semibold text-white/95">
                          {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                        </span>
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-2xs transition-all ${
                            isPromotionGroup ? 'text-[#D03E45]' : 'text-[#0E7A32]'
                          }`}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isCollapsed ? '' : 'rotate-180'
                            }`}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Products Grid or List inside this category dropdown */}
                    {!isCollapsed && (
                      <div className="pt-4 mt-3 border-t border-gray-100 animate-fadeIn">
                        <div className={getProductContainerClass()}>
                          {cat.products.map((p) => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              viewMode={filters.viewMode}
                              size={filters.cardSize || 'large'}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single Category Products Grid or List */
            <div className={getProductContainerClass()}>
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  viewMode={filters.viewMode}
                  size={filters.cardSize || 'large'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet Filter Drawer (Conforming to Section 17) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center lg:hidden animate-fadeIn">
          <div className="bg-white w-full max-h-[85vh] rounded-t-[28px] p-4 overflow-y-auto animate-modal shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
            <ProductFilterSidebar
              filters={filters}
              setFilters={setFilters}
              resetFilters={resetFilters}
              selectedCategorySlug={currentSlug}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setIsMobileFilterOpen(false)}
            />
            <div className="sticky bottom-0 pt-3 pb-2 bg-white border-t border-[#E5E7EB] mt-4">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full h-[44px] bg-[#0E7A32] text-white rounded-[12px] font-semibold text-[14px] flex items-center justify-center shadow-xs cursor-pointer"
              >
                Áp dụng bộ lọc & sắp xếp ({filteredProducts.length} sản phẩm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
