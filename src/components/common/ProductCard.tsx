import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  size?: 'large' | 'medium' | 'small';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode = 'grid',
  size = 'large',
}) => {
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [addedAnim, setAddedAnim] = useState(false);

  const favorited = isFavorite(product.id);
  const isUnavailable = product.stock <= 0 || Boolean(product.temporarilyUnavailable);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUnavailable) return;
    const success = addItem(product, 1);
    if (success) {
      setAddedAnim(true);
      setTimeout(() => setAddedAnim(false), 1500);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  if (viewMode === 'list') {
    if (size === 'small') {
      return (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-[250ms] flex items-center gap-2.5 group">
          <Link
            to={`/product/${product.slug}`}
            className="relative w-20 h-20 sm:w-22 sm:h-22 flex-shrink-0 bg-[#FBFBFB] rounded-[10px] p-1.5 flex items-center justify-center"
          >
            {product.discountPercent && (
              <div className="absolute top-1 left-1 z-10 px-1.5 h-[20px] rounded-[10px] bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center shadow-2xs font-label">
                -{product.discountPercent}%
              </div>
            )}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </Link>

          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
            <div>
              <div className="flex items-start justify-between gap-1">
                <Link to={`/product/${product.slug}`} className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-semibold text-[#111827] line-clamp-2 leading-tight group-hover:text-[#0E7A32] transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <button
                  onClick={handleToggleFavorite}
                  className={`p-1 -mr-1 -mt-1 rounded-full flex-shrink-0 transition-colors ${
                    favorited ? 'text-rose-500' : 'text-[#9CA3AF] hover:text-rose-500'
                  }`}
                  aria-label="Yêu thích"
                >
                  <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-[14px] font-bold text-[#E53935] leading-none">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-[11px] text-[#9CA3AF] line-through leading-none">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isUnavailable}
              title={isUnavailable ? 'Sản phẩm hiện đã hết hàng hoặc tạm ngừng bán' : undefined}
              className={`w-full h-[30px] rounded-[10px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-transform duration-[250ms] hover:scale-[1.02] active:scale-[0.98] text-white mt-1 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                addedAnim ? 'bg-emerald-700' : isUnavailable ? 'bg-gray-500' : 'bg-[#0E7A32]'
              }`}
            >
              {addedAnim ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Đã thêm
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" /> Thêm giỏ
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    if (size === 'medium') {
      return (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-[250ms] flex flex-col sm:flex-row items-center gap-3.5 group">
          <Link
            to={`/product/${product.slug}`}
            className="relative w-28 h-28 flex-shrink-0 bg-[#FBFBFB] rounded-[12px] p-2 flex items-center justify-center"
          >
            {product.discountPercent && (
              <div className="absolute top-1.5 left-1.5 z-10 w-[46px] h-[24px] rounded-[12px] bg-[#EF4444] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                -{product.discountPercent}%
              </div>
            )}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <Link to={`/product/${product.slug}`}>
              <h3 className="text-[14px] font-semibold text-[#111827] line-clamp-2 leading-snug group-hover:text-[#0E7A32] transition-colors">
                {product.name}
              </h3>
            </Link>

            <p className="text-[12px] text-[#6B7280] line-clamp-1 my-1">{product.description}</p>

            <div className="flex items-center gap-1 text-[11px] text-amber-500">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[#6B7280] ml-1">({product.reviewCount})</span>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between self-stretch sm:pl-3 border-t sm:border-t-0 sm:border-l border-[#E5E7EB] pt-2 sm:pt-0">
            <button
              onClick={handleToggleFavorite}
              className={`min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-colors ${
                favorited ? 'text-rose-500' : 'text-[#6B7280] hover:text-rose-500'
              }`}
              aria-label="Yêu thích"
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500' : ''}`} />
            </button>

            <div className="text-right my-1.5">
              <div className="text-[16px] font-bold text-[#E53935] leading-none">
                {formatPrice(product.price)}
              </div>
              {product.originalPrice > product.price && (
                <div className="text-[12px] text-[#9CA3AF] line-through mt-0.5 leading-none">
                  {formatPrice(product.originalPrice)}
                </div>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isUnavailable}
              title={isUnavailable ? 'Sản phẩm hiện đã hết hàng hoặc tạm ngừng bán' : undefined}
              className={`w-full sm:w-auto h-[36px] px-3.5 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-transform duration-[250ms] hover:scale-[1.02] active:scale-[0.98] text-white shadow-xs ${
                addedAnim ? 'bg-emerald-700' : 'bg-[#0E7A32]'
              }`}
            >
              {addedAnim ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Đã thêm
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" /> Thêm giỏ
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    // size === 'large' (default list card)
    return (
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-3 lg:p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-[250ms] flex flex-col sm:flex-row items-center gap-4 group">
        <Link to={`/product/${product.slug}`} className="relative w-36 h-36 flex-shrink-0 bg-[#FBFBFB] rounded-[12px] p-2 flex items-center justify-center">
          {product.discountPercent && (
            <div className="absolute top-2 left-2 z-10 w-[52px] h-[28px] rounded-[14px] bg-[#EF4444] text-white text-[12px] font-bold flex items-center justify-center">
              -{product.discountPercent}%
            </div>
          )}
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-contain"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/product/${product.slug}`}>
            <h3 className="text-[14px] lg:text-[16px] font-semibold text-[#111827] line-clamp-2 group-hover:text-[#0E7A32] transition-colors">
              {product.name}
            </h3>
          </Link>

          <p className="text-[14px] text-[#6B7280] line-clamp-2 my-1">{product.description}</p>

          <div className="flex items-center gap-1 mt-1 text-[12px] text-amber-500">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[#6B7280] ml-1">({product.reviewCount})</span>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between self-stretch sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#E5E7EB] pt-3 sm:pt-0">
          <button
            onClick={handleToggleFavorite}
            className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors ${
              favorited ? 'text-rose-500' : 'text-[#6B7280] hover:text-rose-500'
            }`}
            aria-label="Yêu thích"
          >
            <Heart className={`w-5 h-5 ${favorited ? 'fill-rose-500' : ''}`} />
          </button>

          <div className="text-right my-2">
            <div className="text-[16px] lg:text-[20px] font-bold text-[#E53935]">
              {formatPrice(product.price)}
            </div>
            {product.originalPrice > product.price && (
              <div className="text-[14px] text-[#9CA3AF] line-through">
                {formatPrice(product.originalPrice)}
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isUnavailable}
            title={isUnavailable ? 'Sản phẩm hiện đã hết hàng hoặc tạm ngừng bán' : undefined}
            className={`w-full sm:w-auto h-[38px] lg:h-[42px] px-5 rounded-[12px] text-[14px] font-semibold flex items-center justify-center gap-2 transition-transform duration-[250ms] hover:scale-[1.02] active:scale-[0.98] text-white ${
              addedAnim ? 'bg-emerald-700' : 'bg-[#0E7A32]'
            }`}
          >
            {addedAnim ? (
              <>
                <Check className="w-4 h-4" /> Đã thêm
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Grid View
  const isSmall = size === 'small';
  const isMedium = size === 'medium';

  return (
    <div
      className={`bg-[#FFFDF7] border border-[#E8D7B0] hover:border-[#C99B49] rounded-[16px] shadow-[0_4px_16px_rgba(45,25,10,0.06)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(45,25,10,0.12)] transition-all duration-[250ms] flex flex-col justify-between w-full mx-auto relative group ${
        isSmall
          ? 'p-2 lg:p-2.5 h-[260px] md:h-[270px] lg:h-[265px]'
          : isMedium
          ? 'p-2.5 lg:p-3 h-[285px] md:h-[300px] lg:h-[305px]'
          : 'p-3 lg:p-3.5 h-[295px] md:h-[315px] lg:h-[325px] max-w-[286px]'
      }`}
    >
      {/* 1. Discount badge in traditional cartouche tag */}
      {product.discountPercent && (
        <div
          className={`absolute top-2.5 left-2.5 z-10 bg-[#9F1D24] text-[#FFF8E8] border border-[#FCEBC2]/60 font-bold flex items-center justify-center shadow-xs font-label ${
            isSmall
              ? 'px-1.5 h-[22px] rounded-[6px] text-[10px]'
              : isMedium
              ? 'w-[46px] h-[25px] rounded-[8px] text-[11px]'
              : 'w-[52px] h-[28px] rounded-[8px] text-[12px]'
          }`}
        >
          -{product.discountPercent}%
        </div>
      )}

      {/* 3. Favorite button */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-1.5 right-1.5 z-10 min-w-[36px] min-h-[36px] lg:min-w-[40px] lg:min-h-[40px] rounded-full flex items-center justify-center transition-transform duration-[250ms] hover:scale-110 ${
          favorited ? 'text-rose-500' : 'text-[#6B7280] hover:text-rose-500'
        }`}
        aria-label="Yêu thích"
      >
        <div
          className={`rounded-full bg-white/90 shadow-xs flex items-center justify-center ${
            isSmall ? 'w-7 h-7' : 'w-8 h-8'
          }`}
        >
          <Heart
            className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
              favorited ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </div>
      </button>

      {/* 2. Product image */}
      <Link
        to={`/product/${product.slug}`}
        className={`w-full flex items-center justify-center overflow-hidden rounded-[10px] bg-[#FBFBFB] p-2 ${
          isSmall
            ? 'h-[110px] md:h-[120px] lg:h-[115px]'
            : isMedium
            ? 'h-[130px] md:h-[140px] lg:h-[145px]'
            : 'h-[135px] md:h-[150px] lg:h-[165px]'
        }`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-[250ms] group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      {/* Card Info Details */}
      <div className="flex-1 flex flex-col justify-start mt-2">
        <div className="flex flex-col gap-1">
          {/* Product name */}
          <Link to={`/product/${product.slug}`} className="block">
            <h3
              className={`font-semibold text-[#111827] line-clamp-2 leading-tight group-hover:text-[#0E7A32] transition-colors ${
                isSmall
                  ? 'text-[12px] lg:text-[13px]'
                  : isMedium
                  ? 'text-[13px] lg:text-[14px]'
                  : 'text-[14px] lg:text-[16px]'
              }`}
            >
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div
            className={`flex items-center gap-1 text-amber-500 ${
              isSmall ? 'text-[11px]' : 'text-[12px]'
            }`}
          >
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`fill-amber-400 text-amber-400 ${
                    isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'
                  }`}
                />
              ))}
            </div>
            <span className="text-[#6B7280]">({product.reviewCount})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 pt-0.5 font-label">
            <span
              className={`font-black text-[#9F1D24] leading-none ${
                isSmall
                  ? 'text-[14px] lg:text-[15px]'
                  : isMedium
                  ? 'text-[15px] lg:text-[17px]'
                  : 'text-[16px] lg:text-[20px]'
              }`}
            >
              {formatPrice(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span
                className={`text-[#8A8477] line-through leading-none ${
                  isSmall
                    ? 'text-[11px]'
                    : isMedium
                    ? 'text-[11px] lg:text-[12px]'
                    : 'text-[12px] lg:text-[14px]'
                }`}
              >
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add to cart button */}
      <button
        onClick={handleAddToCart}
        disabled={isUnavailable}
        title={isUnavailable ? 'Sản phẩm hiện đã hết hàng hoặc tạm ngừng bán' : undefined}
        className={`w-full rounded-[10px] font-bold flex items-center justify-center gap-1.5 transition-transform duration-[250ms] hover:scale-[1.02] active:scale-[0.98] text-[#FFF8E8] shadow-xs mt-2.5 border border-[#C99B49]/40 ${
          isSmall
            ? 'h-[32px] lg:h-[34px] text-[12px] px-1'
            : isMedium
            ? 'h-[36px] lg:h-[38px] text-[13px]'
            : 'h-[38px] lg:h-[40px] text-[14px]'
        } ${addedAnim ? 'bg-[#0E7A32]' : isUnavailable ? 'bg-gray-500 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-[#07583F] to-[#0A6C4E] hover:from-[#064A36] hover:to-[#085C42]'}`}
      >
        {addedAnim ? (
          <>
            <Check className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} /> Đã thêm
          </>
        ) : (
          <>
            <ShoppingCart className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            <span className={isSmall ? 'truncate' : ''}>Thêm vào giỏ</span>
          </>
        )}
      </button>
    </div>
  );
};
