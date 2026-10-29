import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loadNavigationItems } from '../../lib/navigationApi';
import { loadPageSections } from '../../lib/pageSectionsApi';
import { SiteNavigationItem } from '../../types';
import { 
  Search, 
  PhoneCall, 
  User as UserIcon, 
  Heart, 
  ShoppingCart, 
  Menu, 
  ChevronDown, 
  Gift, 
  MapPin, 
  Bell, 
  LogOut,
  SlidersHorizontal,
  ArrowLeft,
  BadgePercent,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useAdmin } from '../../context/AdminContext';
import { useSiteProfile } from '../../context/SiteProfileContext';
import { isDiscountedProduct, isPublishedProduct, normalizeCatalogText, productMatchesSearch, PROMOTION_CATEGORY_SLUG } from '../../lib/catalog';
import { SearchCategorySuggestion, SearchSuggestions } from './SearchSuggestions';
import { CartoucheButton } from './CartoucheButton';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  const { totalItemsCount } = useCart();
  const { favorites } = useFavorites();
  const { categories, products } = useAdmin();
  const { profile } = useSiteProfile();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLFormElement>(null);
  const mobileSearchRef = useRef<HTMLFormElement>(null);
  const isCartPage = location.pathname === '/cart';

  const visibleCategories = useMemo(
    () => categories
      .filter((category) => category.active !== false)
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)),
    [categories],
  );
  const promotionCount = useMemo(
    () => products.filter(isDiscountedProduct).length,
    [products],
  );
  const publishedProductCount = useMemo(
    () => products.filter(isPublishedProduct).length,
    [products],
  );
  const trimmedSearchQuery = searchQuery.trim();
  const suggestedProducts = useMemo(
    () => trimmedSearchQuery
      ? products
          .filter(isPublishedProduct)
          .filter((product) => productMatchesSearch(product, trimmedSearchQuery))
          .slice(0, 6)
      : [],
    [products, trimmedSearchQuery],
  );
  const suggestedCategories = useMemo<SearchCategorySuggestion[]>(() => {
    if (!trimmedSearchQuery) return [];
    const normalizedQuery = normalizeCatalogText(trimmedSearchQuery);
    const publishedProducts = products.filter(isPublishedProduct);
    const matches: SearchCategorySuggestion[] = visibleCategories
      .filter((category) => normalizeCatalogText(category.name).includes(normalizedQuery))
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image,
        count: publishedProducts.filter((product) => product.category === category.slug).length,
      }));

    const isPromotionActive = visibleCategories.some((c) => c.slug === PROMOTION_CATEGORY_SLUG);
    if (isPromotionActive && normalizeCatalogText('Khuyến mại').includes(normalizedQuery) && promotionCount > 0) {
      matches.unshift({
        id: 'promotion-products',
        name: 'Khuyến mại',
        slug: PROMOTION_CATEGORY_SLUG,
        image: products.find(isDiscountedProduct)?.image,
        count: promotionCount,
        isPromotion: true,
      });
    }
    return matches.slice(0, 4);
  }, [products, promotionCount, trimmedSearchQuery, visibleCategories]);
  const showSearchSuggestions = isSearchOpen && trimmedSearchQuery.length > 0;

  useEffect(() => {
    const isCatalogRoute = location.pathname === '/products' || location.pathname.startsWith('/category/');
    setSearchQuery(isCatalogRoute ? new URLSearchParams(location.search).get('search') || '' : '');
    setIsSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const closeSuggestions = (event: PointerEvent) => {
      const target = event.target as Node;
      if (desktopSearchRef.current?.contains(target) || mobileSearchRef.current?.contains(target)) return;
      setIsSearchOpen(false);
    };
    document.addEventListener('pointerdown', closeSuggestions);
    return () => document.removeEventListener('pointerdown', closeSuggestions);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setIsSearchOpen(false);
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
  };

  const [dynamicNav, setDynamicNav] = useState<SiteNavigationItem[]>([]);
  const [headerNotice, setHeaderNotice] = useState<string>('');

  useEffect(() => {
    void loadNavigationItems('header').then(setDynamicNav).catch(() => {});
    void loadPageSections('common').then((secs) => {
      const notice = secs.find((s) => s.sectionKey === 'header_notice');
      if (notice && notice.isVisible && notice.subtitle) {
        setHeaderNotice(notice.subtitle);
      }
    }).catch(() => {});
  }, []);

  const navLinks = dynamicNav.length > 0
    ? dynamicNav.map((item) => ({ name: item.label, path: item.url, openInNewTab: item.openInNewTab, isExternal: item.isExternal }))
    : [
        { name: 'Trang chủ', path: '/', openInNewTab: false, isExternal: false },
        { name: 'Về chúng tôi', path: '/about', openInNewTab: false, isExternal: false },
        { name: 'Sản phẩm', path: '/products', openInNewTab: false, isExternal: false },
        { name: 'Tin tức', path: '/news', openInNewTab: false, isExternal: false },
        { name: 'Liên hệ', path: '/contact', openInNewTab: false, isExternal: false },
      ];

  return (
    <header className="bg-[#FFF9EB] border-b border-[#EAD7AD] sticky top-0 z-40 shadow-xs">
      {headerNotice && (
        <div className="bg-[#9F1D24] text-white text-[11px] font-semibold text-center py-1.5 px-4 tracking-wide shadow-xs">
          <span>{headerNotice}</span>
        </div>
      )}
      {/* Top Header conforming to Section 12:
          Desktop: Height 72px, Logo 160x48px, Search 520x44px
          Mobile: Height 64px, Logo 120px */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 h-[64px] lg:h-[72px] flex items-center justify-between gap-4">
        
        {/* Back button on mobile when on Cart page */}
        {isCartPage && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center text-gray-700 hover:text-black rounded-full hover:bg-amber-100/50 transition"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Logo DAICHI SUISAN with Japanese seal aesthetic */}
        <Link to="/" className={`flex items-center gap-2.5 ${isCartPage ? 'mx-auto md:mx-0' : ''} flex-shrink-0 group`}>
          {profile.logoUrl ? (
            <img src={profile.logoUrl} alt={`Logo ${profile.brandName}`} className="h-10 max-w-[210px] object-contain object-left lg:h-11" />
          ) : (
            <>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-[12px] bg-gradient-to-br from-[#9F1D24] to-[#74151B] flex items-center justify-center text-[#FCEBC2] shadow-xs border border-[#C99B49]/40 flex-shrink-0">
                <span className="font-label font-black text-sm lg:text-base">大一</span>
              </div>
              <div className="overflow-hidden">
                <span className="text-[17px] lg:text-[20px] font-black tracking-tight text-[#9F1D24] block leading-none font-header">{profile.brandName}</span>
                <span className="text-[9px] lg:text-[10px] text-[#A67C2E] font-bold tracking-wider uppercase block mt-0.5 font-label">{profile.tagline}</span>
              </div>
            </>
          )}
        </Link>

        {/* Search Bar (Desktop: Width 520px, Height 44px) */}
        <form ref={desktopSearchRef} onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-[520px] h-[44px] relative mx-4">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(Boolean(e.target.value.trim()));
            }}
            onFocus={() => setIsSearchOpen(Boolean(trimmedSearchQuery))}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setSearchQuery('');
                setIsSearchOpen(false);
              }
            }}
            aria-expanded={showSearchSuggestions}
            aria-controls="desktop-search-suggestions"
            aria-label="Tìm kiếm sản phẩm"
            placeholder="Tìm kiếm sản phẩm, danh mục, thương hiệu..."
            className="w-full h-full bg-white/95 border border-[#E5D2A6] rounded-full pl-5 pr-20 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#9F1D24] text-[#172E3D] placeholder-[#8A8477]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-10 top-1.5 w-8 h-8 text-[#8A8477] hover:text-[#111827] flex items-center justify-center"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <button 
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 w-8 h-8 bg-[#9F1D24] text-white rounded-full flex items-center justify-center hover:bg-[#74151B] transition-colors"
            aria-label="Tìm kiếm"
          >
            <Search className="w-4 h-4" />
          </button>
          {showSearchSuggestions ? (
            <SearchSuggestions
              listId="desktop-search-suggestions"
              query={trimmedSearchQuery}
              products={suggestedProducts}
              categories={suggestedCategories}
              onClose={() => setIsSearchOpen(false)}
            />
          ) : null}
        </form>

        {/* Right Action Icons (Desktop) */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 flex-shrink-0">
          {/* Hotline */}
          <a href={`tel:${profile.hotline.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-full bg-[#FAF1DC] text-[#9F1D24] border border-[#E5CF9E] flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-[#172E3D] text-[14px]">{profile.hotline}</div>
              <div className="text-[#8A8477] text-[11px]">{profile.supportLabel}</div>
            </div>
          </a>

          {/* Account */}
          <div className="relative">
            {isLoggedIn ? (
              <div>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex flex-col items-center text-[#111827] hover:text-[#0E7A32] transition-colors group min-w-[44px]"
                >
                  <UserIcon className="w-5 h-5 text-[#6B7280] group-hover:text-[#0E7A32] mb-0.5" />
                  <span className="text-[12px] font-medium truncate max-w-[80px]">
                    {user?.name.split(' ').slice(-1)[0] || 'Tài khoản'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-52 bg-white rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E5E7EB] py-2 z-50 text-[14px]"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-[#E5E7EB]">
                      <div className="font-semibold text-[#111827]">{user?.name}</div>
                      <div className="text-[12px] text-[#6B7280]">{user?.email}</div>
                    </div>
                    <Link 
                      to="/account" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-[#111827]"
                    >
                      <UserIcon className="w-4 h-4 text-[#6B7280]" />
                      Tài khoản của tôi
                    </Link>
                    {user?.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-50 text-emerald-700 font-semibold"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        Trang Quản trị Admin
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-left border-t border-[#E5E7EB] mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="flex flex-col items-center text-[#111827] hover:text-[#0E7A32] transition-colors min-w-[44px]">
                <UserIcon className="w-5 h-5 text-[#6B7280] mb-0.5" />
                <span className="text-[12px] font-medium">Tài khoản</span>
              </Link>
            )}
          </div>

          {/* Favorites */}
          <Link to="/account?tab=favorites" className="flex flex-col items-center text-[#111827] hover:text-[#0E7A32] transition-colors relative min-w-[44px]">
            <div className="relative">
              <Heart className="w-5 h-5 text-[#6B7280] mb-0.5" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-label">
                  {favorites.length}
                </span>
              )}
            </div>
            <span className="text-[12px] font-medium">Yêu thích</span>
          </Link>

          {/* Cart */}
          <Link to="/cart" className="flex flex-col items-center text-[#111827] hover:text-[#0E7A32] transition-colors relative group min-w-[44px]">
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-[#111827] group-hover:text-[#0E7A32] mb-0.5" />
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white font-label">
                {totalItemsCount || 3}
              </span>
            </div>
            <span className="text-[12px] font-medium">Giỏ hàng</span>
          </Link>
        </div>

        {/* Mobile Header Right Icons (Min 44x44px tap target) */}
        {isCartPage ? (
          <div className="flex md:hidden items-center gap-0.5">
            <Link 
              to="/products" 
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#111827]"
              aria-label="Tìm kiếm"
            >
              <Search className="w-5 h-5 text-[#111827]" />
            </Link>
            <Link 
              to="/cart" 
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#111827] relative"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="w-5 h-5 text-[#111827]" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-1 ring-white font-label">
                {totalItemsCount || 4}
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex md:hidden items-center gap-1">
            <Link to="/account" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#111827] relative">
              <Bell className="w-6 h-6 text-[#6B7280]" />
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </Link>
            <Link to="/cart" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#111827] relative">
              <ShoppingCart className="w-6 h-6 text-[#111827]" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItemsCount || 3}
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Search Bar conforming to Section 12 (Height 42px) - Hidden on Cart Page */}
      {!isCartPage && (
        <div className="md:hidden px-4 pb-2.5">
          <form ref={mobileSearchRef} onSubmit={handleSearch} className="h-[42px] relative flex items-center">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(Boolean(e.target.value.trim()));
              }}
              onFocus={() => setIsSearchOpen(Boolean(trimmedSearchQuery))}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }
              }}
              aria-expanded={showSearchSuggestions}
              aria-controls="mobile-search-suggestions"
              aria-label="Tìm kiếm sản phẩm"
              placeholder="Tìm kiếm sản phẩm, danh mục..."
              className="w-full h-full bg-[#F8F9F5] border border-[#E5E7EB] rounded-full pl-9 pr-12 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
            />
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-3.5" />
            <button type="submit" className="absolute right-2 top-1 w-9 h-9 rounded-full text-white bg-[#0E7A32] flex items-center justify-center" aria-label="Tìm kiếm">
              <Search className="w-4 h-4" />
            </button>
            {showSearchSuggestions ? (
              <SearchSuggestions
                listId="mobile-search-suggestions"
                query={trimmedSearchQuery}
                products={suggestedProducts}
                categories={suggestedCategories}
                onClose={() => setIsSearchOpen(false)}
              />
            ) : null}
          </form>
        </div>
      )}

      {/* Desktop Navigation Sub-bar conforming to Section 12 (Height 56px) */}
      <div className="hidden md:block bg-[#FFF9EB] border-t border-[#EAD7AD] h-[56px]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 h-full flex items-center justify-between gap-2 lg:gap-4">
          
          {/* Category Dropdown Button (Họa tiết thẻ bài sơn mài theo Ảnh 1) */}
          <div className="relative flex-shrink-0">
            <CartoucheButton 
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              variant="crimson"
              className="h-[44px] flex-shrink-0 whitespace-nowrap text-[18px] font-bold text-white"
              ariaLabel="Mở danh mục sản phẩm"
            >
              <Menu className="w-4 h-4 flex-shrink-0 text-[#FCEBC2]" />
              <span className="whitespace-nowrap tracking-wide">Danh mục sản phẩm</span>
              <ChevronDown className={`w-4 h-4 ml-0.5 flex-shrink-0 text-[#FCEBC2] transition-transform duration-300 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
            </CartoucheButton>

            {/* Mega Category Dropdown */}
            {isCategoryMenuOpen && (
              <div 
                className="absolute left-0 top-full mt-2 w-64 bg-white rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E5E7EB] py-2 z-50 animate-modal"
                onMouseLeave={() => setIsCategoryMenuOpen(false)}
              >
                <Link
                  to="/products"
                  onClick={() => setIsCategoryMenuOpen(false)}
                  className="mx-2 mb-1 flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold text-[#183A64] transition hover:bg-emerald-50 hover:text-[#0E7A32]"
                >
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-[#0E7A32] flex items-center justify-center">
                    <Menu className="w-4 h-4" />
                  </span>
                  <span className="flex-1">Tất cả sản phẩm</span>
                  <span className="min-w-6 h-6 px-1.5 rounded-full bg-emerald-50 text-[#0E7A32] flex items-center justify-center text-[11px]">{publishedProductCount}</span>
                </Link>
                {visibleCategories.map((cat) => {
                  if (cat.slug === PROMOTION_CATEGORY_SLUG) {
                    return (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="promotion-highlight mx-2 mb-2 flex items-center gap-3 rounded-[10px] bg-[#D03E45] px-3 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#B83239]"
                      >
                        <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ring-1 ring-white/30">
                          <BadgePercent className="w-4 h-4" />
                        </span>
                        <span className="flex-1">{cat.name}</span>
                        <span className="min-w-6 h-6 px-1.5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">{promotionCount}</span>
                      </Link>
                    );
                  }
                  return (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setIsCategoryMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-[#183A64] hover:bg-emerald-50 hover:text-[#0E7A32] transition-colors group whitespace-nowrap"
                    >
                      <img 
                        src={cat.image} 
                        alt={cat.name} 
                        className="w-7 h-7 rounded-full object-cover group-hover:scale-110 transition-transform flex-shrink-0"
                      />
                      <span className="truncate whitespace-nowrap">{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Links - Single line layout */}
          <nav className="flex flex-shrink-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-[18px] font-semibold text-[#172E3D] no-scrollbar md:gap-1.5 lg:gap-2 xl:gap-3">
            {navLinks.map((link) => {
              const isProductSection = link.path === '/products' && (
                location.pathname === '/products' || location.pathname.startsWith('/category/')
              );
              const isAboutLink = link.path === '/about';
              const isActive = isAboutLink
                ? location.pathname === '/about' || location.hash === '#about-us'
                : isProductSection || (location.pathname === link.path && !location.search && !location.hash);
              return link.isExternal ? (
                <a
                  key={link.name}
                  href={link.path}
                  target={link.openInNewTab ? '_blank' : undefined}
                  rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="px-2 lg:px-2.5 py-1.5 transition-colors relative whitespace-nowrap flex-shrink-0 hover:text-[#9F1D24] text-[#172E3D]"
                >
                  <span className="whitespace-nowrap">{link.name}</span>
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  target={link.openInNewTab ? '_blank' : undefined}
                  rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                  className={`px-2 lg:px-2.5 py-1.5 transition-colors relative whitespace-nowrap flex-shrink-0 ${
                    isActive 
                      ? 'text-[#9F1D24] font-bold' 
                      : 'hover:text-[#9F1D24] text-[#172E3D]'
                  }`}
                >
                  <span className="whitespace-nowrap">{link.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#9F1D24] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right badges conforming to Japanese theme */}
          <div className="hidden lg:flex items-center gap-2 text-[12px] font-semibold flex-shrink-0 whitespace-nowrap">
            <div className="flex items-center gap-1.5 bg-[#FAF1DC] text-[#8C6219] px-3 py-1.5 rounded-full border border-[#E5CF9E] shadow-2xs whitespace-nowrap flex-shrink-0">
              <Gift className="w-3.5 h-3.5 text-[#B88A3B] flex-shrink-0" />
              <span className="whitespace-nowrap">Ưu đãi thành viên</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#E2F1E6] text-[#07583F] px-3 py-1.5 rounded-full border border-[#ACD0B6] shadow-2xs whitespace-nowrap flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#0E7A32] flex-shrink-0" />
              <span className="whitespace-nowrap">Cửa hàng gần bạn</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
