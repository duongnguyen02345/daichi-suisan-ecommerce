import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  Minus, 
  Plus, 
  ShoppingCart, 
  Zap, 
  ShieldCheck, 
  Truck, 
  Flame,
  Check,
  Leaf
} from 'lucide-react';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';
import { useCart } from '../../context/CartContext';

interface ProductInfoProps {
  product: Product;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedAnim, setAddedAnim] = useState(false);
  const isUnavailable = product.stock <= 0 || Boolean(product.temporarilyUnavailable);

  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity((q) => Math.min(product.stock, q + 1));

  const handleAddToCart = () => {
    if (isUnavailable) return;
    const success = addItem(product, quantity);
    if (success) {
      setAddedAnim(true);
      setTimeout(() => setAddedAnim(false), 1500);
    }
  };

  const handleBuyNow = () => {
    if (isUnavailable) return;
    const success = addItem(product, quantity);
    if (success) {
      navigate('/cart');
    }
  };

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Top Details & Action Buttons block - height aligns with main image */}
      <div className="flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3 sm:space-y-3.5">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#EBF5EE] text-[#0E7A32] text-xs sm:text-[13px] font-semibold px-3 py-1 rounded-full">
              {product.categoryName}
            </span>
            {product.isBestSeller && (
              <span className="bg-[#FFF3E0] text-[#E65100] text-xs sm:text-[13px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span>Bán chạy</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[26px] sm:text-[28px] lg:text-[30px] font-bold text-[#111827] leading-tight tracking-tight">
            {product.name}
          </h1>

          {/* Ratings & Sold */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px]">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="font-bold text-[#111827] ml-2 text-sm">{product.rating}</span>
              <span className="text-[#6B7280] ml-1 text-xs sm:text-sm">({product.reviewCount} đánh giá)</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-[#6B7280] font-medium text-xs sm:text-sm">Đã bán {product.soldCount || '2.4k+'}</span>
          </div>

          {/* Price row */}
          <div className="flex items-baseline gap-3 pt-0.5">
            <span className="text-[28px] sm:text-[32px] lg:text-[34px] font-bold text-[#E53935] leading-none">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-base sm:text-lg text-[#9CA3AF] line-through leading-none">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {product.discountPercent && (
              <span className="bg-[#EF4444] text-white text-xs sm:text-[13px] font-bold px-2.5 py-1 rounded-[6px] shadow-2xs leading-none">
                -{product.discountPercent}%
              </span>
            )}
          </div>

          {/* Short Description */}
          <p className="text-[13px] sm:text-[14px] text-[#4B5563] leading-relaxed">
            {product.description}
          </p>

          {/* Quantity Stepper & Stock status */}
          <div className="pt-0.5">
            <div className="text-sm font-bold text-[#111827] mb-2">Số lượng</div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center border border-[#E5E7EB] rounded-[8px] bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="w-9 h-9 sm:w-10 sm:h-10 hover:bg-gray-100 text-gray-700 transition flex items-center justify-center font-bold cursor-pointer"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-[#111827]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  className="w-9 h-9 sm:w-10 sm:h-10 hover:bg-gray-100 text-gray-700 transition flex items-center justify-center font-bold cursor-pointer"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className={`w-5 h-5 rounded-full text-white flex items-center justify-center flex-shrink-0 shadow-2xs ${isUnavailable ? 'bg-rose-600' : 'bg-[#0E7A32]'}`}>
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className={`font-semibold ${isUnavailable ? 'text-rose-700' : 'text-[#0E7A32]'}`}>
                  {product.temporarilyUnavailable ? 'Tạm ngừng bán' : product.stock <= 0 ? 'Hết hàng' : 'Còn hàng'}
                </span>
                {!isUnavailable && <span className="text-[#6B7280]">({product.stock} sản phẩm)</span>}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons - Aligned with the bottom of the main image frame */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isUnavailable}
            className={`h-[46px] px-4 rounded-[10px] font-bold text-sm flex items-center justify-center gap-2 border-2 transition duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
              addedAnim
                ? 'border-[#0E7A32] bg-emerald-50 text-[#0E7A32]'
                : 'border-[#0E7A32] text-[#0E7A32] bg-white hover:bg-emerald-50'
            }`}
          >
            {addedAnim ? (
              <>
                <Check className="w-4 h-4" /> Đã thêm vào giỏ
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ hàng
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isUnavailable}
            className="h-[46px] px-4 rounded-[10px] bg-[#0E7A32] hover:bg-[#0A5C25] text-white font-bold text-sm flex items-center justify-center gap-2 transition duration-200 shadow-xs cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4 fill-white" /> Mua ngay
          </button>
        </div>
      </div>

      {/* 3 Commitment Circles - Same row as thumbnails, diameter equals thumbnail height */}
      <div className="mt-4 h-[60px] sm:h-[68px] lg:h-[72px] flex items-center justify-around gap-2 flex-shrink-0">
        {/* Circle 1: Cam kết tươi ngon */}
        <div
          className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] lg:w-[72px] lg:h-[72px] rounded-full bg-[#EBF5EE] border border-emerald-200 flex flex-col items-center justify-center p-1 text-center shadow-2xs hover:scale-105 hover:border-[#0E7A32] transition-all duration-200 cursor-default select-none group flex-shrink-0"
          title="Cam kết tươi ngon"
        >
          <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0E7A32] flex-shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-[9.5px] sm:text-[10px] lg:text-[10.5px] font-bold text-[#111827] leading-[1.2] mt-0.5">
            Cam kết<br />tươi ngon
          </span>
        </div>

        {/* Circle 2: Giao hàng nhanh */}
        <div
          className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] lg:w-[72px] lg:h-[72px] rounded-full bg-[#EBF5EE] border border-emerald-200 flex flex-col items-center justify-center p-1 text-center shadow-2xs hover:scale-105 hover:border-[#0E7A32] transition-all duration-200 cursor-default select-none group flex-shrink-0"
          title="Giao hàng nhanh"
        >
          <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0E7A32] flex-shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-[9.5px] sm:text-[10px] lg:text-[10.5px] font-bold text-[#111827] leading-[1.2] mt-0.5">
            Giao hàng<br />nhanh
          </span>
        </div>

        {/* Circle 3: Thanh toán an toàn */}
        <div
          className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] lg:w-[72px] lg:h-[72px] rounded-full bg-[#EBF5EE] border border-emerald-200 flex flex-col items-center justify-center p-1 text-center shadow-2xs hover:scale-105 hover:border-[#0E7A32] transition-all duration-200 cursor-default select-none group flex-shrink-0"
          title="Thanh toán an toàn"
        >
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0E7A32] flex-shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-[9.5px] sm:text-[10px] lg:text-[10.5px] font-bold text-[#111827] leading-[1.2] mt-0.5">
            Thanh toán<br />an toàn
          </span>
        </div>
      </div>
    </div>
  );
};
