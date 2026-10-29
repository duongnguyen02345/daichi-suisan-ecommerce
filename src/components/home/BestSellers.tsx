import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { CartoucheButton } from '../common/CartoucheButton';
import { useAdmin } from '../../context/AdminContext';
import { isDiscountedProduct, PROMOTION_CATEGORY_SLUG } from '../../lib/catalog';

export const BestSellers: React.FC = () => {
  const [isPaused] = useState(false);
  const { products } = useAdmin();

  const bestSellerList = products
    .filter(isDiscountedProduct)
    .sort((left, right) => (right.discountPercent || 0) - (left.discountPercent || 0))
    .slice(0, 8);

  // Condition: More than 4 products triggers the infinite loop
  const isLooped = bestSellerList.length > 4;

  return (
    <section className="relative">
      {/* Header: Plaque kích thước bằng với "DANH MỤC TIÊU BIỂU" & Nút "Xem thêm" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 sm:mb-4.5 gap-3.5">
        <CartoucheButton
          variant="crimson"
          className="text-[#FCEBC2] text-sm sm:text-base lg:text-lg xl:text-xl font-black uppercase tracking-[0.2em] h-[54px] sm:h-[62px] lg:h-[70px] px-8 sm:px-12 lg:px-16 drop-shadow-md cursor-default pointer-events-none self-start"
        >
          <span>SẢN PHẨM BÁN CHẠY</span>
        </CartoucheButton>

        <Link 
          to={`/category/${PROMOTION_CATEGORY_SLUG}`}
          className="text-[13px] sm:text-[14px] font-bold text-[#9F1D24] hover:text-[#74151B] flex items-center gap-1.5 transition-colors group px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#FAF1DC] border border-[#E5CF9E] shadow-xs self-start sm:self-auto shrink-0"
        >
          <span>Xem thêm</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Product Display: Single row layout */}
      {isLooped ? (
        <div className="relative overflow-hidden py-3">
          {/* Subtle gradient side edge fades for smooth entrance/exit */}
          <div 
            aria-hidden="true" 
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#F8F9F5] to-transparent z-10" 
          />
          <div 
            aria-hidden="true" 
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#F8F9F5] to-transparent z-10" 
          />

          {/* Marquee Track: Moving from right to left (marqueeRightToLeft) */}
          <div className={`animate-marquee-rtl marquee-track ${isPaused ? 'is-paused' : ''}`}>
            {/* Batch 1: Original items */}
            {bestSellerList.map((product, idx) => (
              <div 
                key={`orig-${product.id}-${idx}`} 
                className="w-[240px] sm:w-[260px] lg:w-[306px] flex-shrink-0 pr-3 sm:pr-4 lg:pr-5"
              >
                <ProductCard product={product} />
              </div>
            ))}

            {/* Batch 2: Duplicate items for seamless continuous loop */}
            {bestSellerList.map((product, idx) => (
              <div 
                key={`dup-${product.id}-${idx}`} 
                className="w-[240px] sm:w-[260px] lg:w-[306px] flex-shrink-0 pr-3 sm:pr-4 lg:pr-5"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Static single row if 4 or fewer products */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          {bestSellerList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};
