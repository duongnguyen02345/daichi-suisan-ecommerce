import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Product } from '../../types';
import { useFavorites } from '../../context/FavoritesContext';

interface ProductGalleryProps {
  product: Product;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ product }) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(product.id);

  // Ensure at least 6 thumbnail images for the gallery row
  let images = product.gallery && product.gallery.length > 0 ? [...product.gallery] : [product.image];
  while (images.length < 6) {
    images = images.concat(images).slice(0, 6);
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Main Image View - Frame with 12px rounded corner matching CTA buttons */}
      <div className="relative flex-1 min-h-[300px] sm:min-h-[330px] lg:min-h-[360px] bg-[#FBFBFB] rounded-[12px] overflow-hidden border border-[#E5E7EB] flex items-center justify-center p-3 sm:p-4 group">
        {/* Discount badge */}
        {product.discountPercent && (
          <span className="absolute top-3.5 left-3.5 z-10 px-2.5 h-[26px] rounded-[13px] bg-[#EF4444] text-white text-[12px] font-bold inline-flex items-center justify-center shadow-xs">
            -{product.discountPercent}%
          </span>
        )}

        {/* Favorite heart button */}
        <button
          type="button"
          onClick={() => toggleFavorite(product)}
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center transition hover:scale-110 active:scale-95 text-[#EF4444] cursor-pointer"
          aria-label="Thêm vào yêu thích"
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-[#EF4444]' : ''}`} />
        </button>

        {/* Product image */}
        <img
          src={images[selectedImageIdx] || product.image}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        />

        {/* Prev / Next Arrows on main image */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:text-black flex items-center justify-center transition hover:scale-105 cursor-pointer z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:text-black flex items-center justify-center transition hover:scale-105 cursor-pointer z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* 6 Thumbnails Row - Height matches the 3 commitment circles */}
      <div className="grid grid-cols-6 gap-2 mt-4 h-[60px] sm:h-[68px] lg:h-[72px] flex-shrink-0">
        {images.slice(0, 6).map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedImageIdx(idx)}
            className={`h-[60px] sm:h-[68px] lg:h-[72px] w-full rounded-[10px] overflow-hidden transition cursor-pointer p-0.5 bg-[#FBFBFB] ${
              selectedImageIdx === idx
                ? 'border-2 border-[#0E7A32]'
                : 'border border-gray-200 hover:border-gray-400'
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover rounded-[7px]" />
          </button>
        ))}
      </div>
    </div>
  );
};
