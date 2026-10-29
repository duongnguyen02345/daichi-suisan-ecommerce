import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, UserRound, ArrowRight, Sprout, Heart, Plus } from 'lucide-react';
import { CartItemList } from '../components/cart/CartItemList';
import { CartCouponAndNote } from '../components/cart/CartCouponAndNote';
import { CartSummary } from '../components/cart/CartSummary';
import { ProductCard } from '../components/common/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { mockProducts } from '../data/mockData';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';

// Compact mini product card for mobile horizontal scrolling carousel
const MiniProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const discountPercent =
    product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  return (
    <div className="w-[145px] flex-shrink-0 bg-white rounded-[14px] border border-[#E5E7EB] p-2.5 flex flex-col justify-between shadow-card relative group">
      {/* Top Image & badges */}
      <div className="relative w-full aspect-square bg-[#F8F9F5] rounded-[10px] overflow-hidden p-1.5 mb-2 flex items-center justify-center">
        {discountPercent > 0 && (
          <span className="absolute top-1.5 left-1.5 z-10 bg-[#E53935] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none shadow-xs">
            -{discountPercent}%
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product);
          }}
          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-white/90 shadow-xs flex items-center justify-center text-gray-400 hover:text-red-500 transition"
          aria-label="Yêu thích"
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isFavorite(product.id) ? 'fill-red-500 text-red-500' : ''
            }`}
          />
        </button>
        <Link to={`/product/${product.slug}`} className="w-full h-full flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition"
          />
        </Link>
      </div>

      {/* Info */}
      <div className="space-y-1 mb-2">
        <div className="text-[10px] text-gray-400 font-medium truncate">
          {product.categoryName || 'Rau củ quả'}
        </div>
        <Link to={`/product/${product.slug}`}>
          <h4 className="text-xs font-bold text-gray-900 leading-tight line-clamp-1 hover:text-[#0E7A32]">
            {product.name}
          </h4>
        </Link>
        <div className="text-[10px] text-gray-400 truncate">
          {product.unit || 'Gói 500g'}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
          <span>★</span>
          <span className="text-gray-700 font-bold">{product.rating}</span>
          <span className="text-gray-400">({product.reviewCount || 100})</span>
        </div>
      </div>

      {/* Bottom row: Price & Round Add Button */}
      <div className="flex items-end justify-between gap-1 pt-1.5 border-t border-gray-100">
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#E53935] leading-tight">
            {formatPrice(product.price)}
          </div>
          {product.originalPrice > product.price && (
            <div className="text-[10px] text-gray-400 line-through leading-tight">
              {formatPrice(product.originalPrice)}
            </div>
          )}
        </div>

        <button
          onClick={() => addItem(product, 1)}
          className="w-7 h-7 rounded-full bg-[#0E7A32] text-white flex items-center justify-center hover:bg-[#0A5C25] active:scale-90 transition shadow-xs flex-shrink-0"
          title="Thêm vào giỏ"
          aria-label="Thêm vào giỏ hàng"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const CartPage: React.FC = () => {
  const { totalItemsCount } = useCart();
  const { isLoggedIn, openAuthModal } = useAuth();

  const recommendedMini = [
    mockProducts.find((p) => p.name.includes('Cà rốt')) || mockProducts[7],
    mockProducts.find((p) => p.name.includes('Táo Fuji')) || mockProducts[0],
    mockProducts.find((p) => p.name.includes('Xà lách')) || mockProducts[4],
    mockProducts.find((p) => p.name.includes('Khoai tây')) || mockProducts[9],
  ].filter(Boolean) as Product[];

  const recommendedDesktop = mockProducts.slice(0, 4);

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 py-4 md:py-8 lg:py-10 animate-fadeIn space-y-5 md:space-y-10 lg:space-y-14">
      <div>
        {/* Breadcrumb (desktop only) */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Link to="/" className="hover:text-[#0E7A32]">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-bold text-gray-900">Giỏ hàng</span>
        </nav>

        {/* Header Title */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-[34px] lg:text-[40px] font-bold text-[#111827] leading-tight">
            Giỏ hàng{' '}
            <span className="text-gray-400 font-normal text-base md:text-2xl lg:text-3xl">
              ({totalItemsCount} sản phẩm)
            </span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">
            Kiểm tra lại sản phẩm, số lượng và tiến hành thanh toán để nhận hàng sớm nhất nhé!
          </p>
        </div>

        {/* Guest checkout notification (desktop only) */}
        {!isLoggedIn && (
          <div className="hidden md:flex bg-emerald-50 border border-emerald-200/80 rounded-[12px] p-4 sm:p-5 mb-6 flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[14px] bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <UserRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                  Bạn có thể đặt hàng mà không cần đăng ký tài khoản.
                </h4>
                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                  Khi thanh toán, vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.
                </p>
              </div>
            </div>

            <button
              onClick={() => openAuthModal('Đăng nhập là tùy chọn để tích lũy điểm và quản lý đơn hàng thuận tiện hơn.')}
              className="h-[38px] sm:h-[42px] px-4 bg-white text-[#0E7A32] border border-emerald-200 rounded-[12px] text-xs font-semibold hover:bg-emerald-100 transition shadow-xs hover:scale-[1.02] self-end sm:self-auto flex-shrink-0"
            >
              Đăng nhập để nhận ưu đãi
            </button>
          </div>
        )}

        {/* Mobile View Layout (lg:hidden) */}
        <div className="lg:hidden space-y-4">
          {/* Cart items list */}
          <CartItemList />

          {/* Coupon and Order Note */}
          <CartCouponAndNote />

          {/* Có thể bạn cũng thích (Mobile Carousel) */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-[#0E7A32]" />
                <h3 className="text-sm font-bold text-gray-900">Có thể bạn cũng thích</h3>
              </div>
              <Link
                to="/products"
                className="text-xs font-semibold text-[#0E7A32] flex items-center gap-0.5 hover:underline"
              >
                <span>Xem thêm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 snap-x">
              {recommendedMini.map((prod) => (
                <div key={prod.id} className="snap-start">
                  <MiniProductCard product={prod} />
                </div>
              ))}
            </div>
          </section>

          {/* Order Summary & Sticky Checkout Bar */}
          <CartSummary />
        </div>

        {/* Desktop View Layout (hidden lg:block) */}
        <div className="hidden lg:block space-y-12">
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Left Column (8 cols): Table items + Coupon/Notes */}
            <div className="col-span-8 space-y-6">
              <CartItemList />
              <CartCouponAndNote />
            </div>

            {/* Right Column (4 cols): Summary Card */}
            <div className="col-span-4 sticky top-24">
              <CartSummary />
            </div>
          </div>

          {/* Bottom: Có thể bạn cũng thích (Desktop Grid) */}
          <section className="border-t border-[#E5E7EB] pt-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-[#0E7A32]" />
                <h3 className="text-2xl lg:text-[28px] font-bold text-[#111827]">Có thể bạn cũng thích</h3>
              </div>
              <Link
                to="/products"
                className="text-sm font-semibold text-[#0E7A32] flex items-center gap-1 hover:underline"
              >
                <span>Xem thêm</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-5 justify-items-center">
              {recommendedDesktop.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
