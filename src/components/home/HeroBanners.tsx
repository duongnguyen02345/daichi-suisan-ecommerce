import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { createBannerSlides } from '../../lib/banners';
import { CartoucheButton } from '../common/CartoucheButton';

export const HeroBanners: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { banners } = useAdmin();

  const liveBanners = banners.filter((banner) =>
    banner.active && banner.publicationStatus !== 'draft' && banner.publicationStatus !== 'archived',
  );
  const mainBanners = liveBanners.filter((banner, index) =>
    banner.placement === 'home_hero' || (!banner.placement && index === 0),
  );
  const slides = createBannerSlides(mainBanners.length ? mainBanners : liveBanners.slice(0, 1));

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const slide = slides[currentSlide] || slides[0];
  const banner = slide?.banner;

  useEffect(() => {
    setCurrentSlide((current) => current >= slides.length ? 0 : current);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || isPaused) return undefined;
    const interval = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, [isPaused, slides.length]);

  if (!slide || !banner) return null;

  const hasTitle = Boolean(banner.title && banner.title.trim().length > 0);
  const hasSubtitle = Boolean(banner.subtitle && banner.subtitle.trim().length > 0);
  const hasBadge = Boolean(banner.badge && banner.badge.trim().length > 0);
  const heroImage = slide.image || '/images/daichi-hero-seafood.png';

  return (
    <div 
      onMouseEnter={() => setIsPaused(true)} 
      onMouseLeave={() => setIsPaused(false)} 
      className="relative flex w-full select-none items-center overflow-hidden bg-[#600D13] shadow-md h-[460px] sm:h-[490px] md:h-[520px] lg:h-[540px] xl:h-[560px]" 
      aria-roledescription="carousel" 
      aria-label="Banner chính trang chủ"
    >
      {/* 1. FULL-SCREEN BACKGROUND IMAGE (Toàn màn hình ẩm thực Nhật Bản thượng hạng) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((item, index) => {
          const itemImg = item.image || '/images/daichi-hero-seafood.png';
          const isActive = index === currentSlide;
          return (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img 
                src={itemImg}
                alt={item.banner.title || 'DAICHI SUISAN Banner'}
                className="w-full h-full object-cover object-center md:object-right filter brightness-95 saturate-110 scale-100"
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            </div>
          );
        })}

        {/* 2. JAPANESE LACQUER GRADIENT OVERLAY (Mờ nhẹ bên trái để chữ nổi bật, bên phải ngắm trọn hình ảnh) */}
        <div 
          className="absolute inset-0 z-15 bg-gradient-to-r from-[#4E0A0E]/92 via-[#6B0F15]/75 via-40% md:via-52% to-black/25 pointer-events-none" 
          aria-hidden="true" 
        />
        <div 
          className="absolute inset-0 z-15 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" 
          aria-hidden="true" 
        />

        {/* 3. JAPANESE WATERMARKS (Họa tiết mây vàng, hoa anh đào, núi Phú Sĩ) */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute left-0 bottom-0 w-full lg:w-[60%] h-[260px] opacity-15 bg-contain bg-bottom bg-no-repeat z-15"
          style={{ backgroundImage: `url('/assets/japanese-ui/sun-fuji.svg')` }}
        />
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute left-8 top-10 w-48 h-20 opacity-30 bg-contain bg-no-repeat z-15"
          style={{ backgroundImage: `url('/assets/japanese-ui/japanese-clouds.svg')` }}
        />
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute -top-4 -left-4 w-48 sm:w-60 h-48 sm:h-60 opacity-85 bg-contain bg-no-repeat z-15"
          style={{ backgroundImage: `url('/assets/japanese-ui/sakura-branch.svg')` }}
        />
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 opacity-25 bg-repeat-x bg-bottom z-15"
          style={{ backgroundImage: `url('/assets/japanese-ui/seigaiha-pattern.svg')`, backgroundSize: '120px 60px' }}
        />
      </div>

      {/* 4. CONTENT ON TOP OF FULLSCREEN BANNER */}
      <div className="relative z-20 mx-auto w-full max-w-[1280px] px-4 md:px-5 lg:px-6 h-full flex items-center py-6 sm:py-8">
        <div className="max-w-[720px] text-white">
          
          {/* Badge thương hiệu */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C99B49]/70 bg-[#102F49]/85 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#FCEBC2] shadow-md backdrop-blur-md sm:text-[12px] mb-3 w-fit font-label">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E0B96C]" />
            <span>{hasBadge ? banner.badge : 'DAICHI SUISAN • Chuẩn Vị Nhật Bản'}</span>
          </div>

          {/* Tiêu đề chính phong cách báo chí editorial */}
          <h1 className="mb-3 whitespace-pre-line font-header text-[28px] sm:text-[38px] lg:text-[46px] xl:text-[50px] font-black leading-[1.14] tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.8)]">
            {hasTitle ? banner.title : 'Trọn Vẹn Tinh Hoa Hải Sản & Thực Phẩm Nhật Bản'}
          </h1>

          {/* Gạch vàng phong cách ẩm thực */}
          <div className="flex items-center gap-2.5 my-3">
            <span className="w-12 h-[2px] bg-[#C99B49]" />
            <span className="w-2.5 h-2.5 rotate-45 bg-[#C99B49] border border-white/40" />
            <span className="w-6 h-[1px] bg-[#C99B49]" />
          </div>

          {/* Phụ đề */}
          <p className="mb-6 max-w-2xl whitespace-pre-line text-[15px] sm:text-[16px] lg:text-[17px] font-medium leading-relaxed text-[#FFF8E8] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
            {hasSubtitle
              ? banner.subtitle
              : 'DAICHI SUISAN - Chất lượng từ nguyên liệu, trọn vẹn trong từng bữa ăn. Nguồn hải sản tươi sống nhập khẩu chính ngạch từ các ngư trường trù phú nhất xứ Phù Tang.'}
          </p>

          {/* Cặp nút "Mua ngay" và "Về chúng tôi" hình bao thẻ bài */}
          <div className="flex items-center gap-3.5 sm:gap-4 flex-wrap">
            <CartoucheButton
              to={banner.ctaLink || '/products'}
              variant="crimson"
              className="h-[46px] px-6 text-[16px] sm:text-[17px] font-bold text-white shadow-xl lg:h-[50px] lg:px-8"
            >
              <span>{banner.ctaText || 'Mua ngay'}</span>
              <ArrowRight className="w-4 h-4 text-[#FCEBC2]" />
            </CartoucheButton>

            <CartoucheButton
              href="#about-us"
              variant="gold"
              className="h-[46px] px-6 text-[16px] sm:text-[17px] font-bold text-[#102F49] shadow-lg lg:h-[50px] lg:px-8"
            >
              <span>Về chúng tôi</span>
            </CartoucheButton>
          </div>

        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 ? (
        <>
          <button 
            onClick={handlePrev} 
            className="absolute left-3 sm:left-5 lg:left-7 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-[#9F1D24] text-white flex items-center justify-center backdrop-blur-sm border border-[#C99B49]/60 transition-all opacity-0 group-hover:opacity-100 shadow-xl active:scale-95 cursor-pointer" 
            aria-label="Ảnh banner trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleNext} 
            className="absolute right-3 sm:right-5 lg:right-7 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-[#9F1D24] text-white flex items-center justify-center backdrop-blur-sm border border-[#C99B49]/60 transition-all opacity-0 group-hover:opacity-100 shadow-xl active:scale-95 cursor-pointer" 
            aria-label="Ảnh banner tiếp theo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Indicators đặt sát dưới hàng nút */}
          <div className="absolute bottom-4 sm:bottom-6 left-4 md:left-6 lg:left-8 z-30 flex items-center gap-2">
            {slides.map((item, idx) => (
              <button 
                key={item.id} 
                type="button" 
                aria-label={`Chuyển đến ảnh ${idx + 1}`} 
                onClick={() => setCurrentSlide(idx)} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx 
                    ? 'w-8 bg-[#C99B49] shadow-[0_0_10px_#C99B49]' 
                    : 'w-2 bg-white/40 hover:bg-white/80 border border-white/50'
                }`} 
              />
            ))}
          </div>
        </>
      ) : null}

      {/* Scroll Down Indicator (Khám phá) góc dưới bên phải - phong cách Madame Lân */}
      <a
        href="#about-us"
        className="absolute bottom-4 sm:bottom-6 right-4 md:right-6 lg:right-8 z-30 hidden md:flex items-center gap-2 text-[#172E3D] hover:text-[#9F1D24] bg-[#FFF9EB]/95 hover:bg-[#FFF9EB] backdrop-blur-sm px-4 py-2 rounded-full border border-[#C99B49] shadow-xl text-[12px] font-bold tracking-wider uppercase transition-all hover:scale-105 group"
        aria-label="Cuộn xuống mục Về chúng tôi"
      >
        <span>Khám phá</span>
        <ChevronDown className="w-4 h-4 animate-bounce text-[#9F1D24] group-hover:translate-y-0.5 transition-transform" />
      </a>
    </div>
  );
};
