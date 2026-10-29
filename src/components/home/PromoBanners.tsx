import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { CartoucheButton } from '../common/CartoucheButton';
import { Banner } from '../../types';

const isVisible = (banner: Banner) => {
  if (!banner.active || !['scheduled', 'published'].includes(banner.publicationStatus || '')) return false;
  const now = Date.now();
  const startsAt = banner.startsAt ? new Date(banner.startsAt).getTime() : null;
  const endsAt = banner.endsAt ? new Date(banner.endsAt).getTime() : null;
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
};

export const PromoBanners: React.FC = () => {
  const { banners } = useAdmin();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const secondaryBanners = useMemo(() => {
    return banners
      .filter((b) => (b.placement === 'home_secondary' || b.placement === 'home_footer') && isVisible(b))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [banners]);

  // Banner dự phòng dùng tài nguyên nội bộ để luôn hiển thị ổn định.
  const fallbackBanner: Banner = {
    id: 'default-promo',
    title: 'Sashimi & Sushi Ưu Đãi Đến 20%',
    subtitle: 'Cá hồi Na Uy, Bụng cá ngừ Otoro, Cồi sò điệp Hotate tươi ngọt',
    badge: 'GIẢM ĐẾN 20%',
    image: '/images/daichi-hero-seafood.png',
    ctaText: 'Mua ngay',
    ctaLink: '/category/sashimi-sushi',
    placement: 'home_secondary',
    active: true,
  };

  const activeBanners = secondaryBanners.length > 0 ? secondaryBanners : [fallbackBanner];

  useEffect(() => {
    if (activeBanners.length < 2 || isPaused) return undefined;
    const interval = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isPaused, activeBanners.length]);

  const banner = activeBanners[currentSlide] || activeBanners[0];

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <section
      className="relative flex min-h-[540px] w-full select-none items-center overflow-hidden border-y-[3px] border-[#C99B49] bg-[#6B0D12] sm:min-h-[580px] lg:min-h-[600px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Khuyến mại chân trang"
    >
      {/* Ảnh banner thực tế phủ toàn bộ section, tương tự banner chính đầu trang. */}
      <img
        src={banner.image || fallbackBanner.image}
        alt=""
        aria-hidden="true"
        data-footer-banner-image
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700"
      />

      {/* Lớp phủ giúp nội dung rõ trên mọi ảnh do quản trị viên tải lên. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#5F0B11]/95 via-[#6B0D12]/82 to-[#6B0D12]/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

      <div className="relative z-10 w-full px-5 py-14 sm:px-8 sm:py-16 lg:px-[5vw] lg:py-20">
        <div className="flex max-w-[760px] flex-col justify-center">
          {banner.badge && (
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#C99B49] bg-[#102F49]/95 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#FCEBC2] shadow-lg sm:px-5 sm:text-sm">
              <Sparkles className="h-4 w-4 text-[#C99B49]" />
              <span>{banner.badge}</span>
            </div>
          )}

          <h2 className="whitespace-pre-line font-header text-[36px] font-black leading-[1.08] tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] sm:text-[46px] md:text-[54px] lg:text-[62px] xl:text-[68px]">
            {banner.title}
          </h2>

          <div className="my-5 flex items-center gap-3 sm:my-6">
            <span className="h-[3px] w-20 bg-[#C99B49] sm:w-28" />
            <span className="h-3 w-3 rotate-45 border border-white/30 bg-[#C99B49]" />
            <span className="h-[2px] w-10 bg-[#C99B49] sm:w-14" />
          </div>

          {banner.subtitle && (
            <p className="mb-9 max-w-2xl text-base font-medium leading-relaxed text-[#FCEBC2] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-lg lg:text-[20px]">
              {banner.subtitle}
            </p>
          )}

          <CartoucheButton
            to={banner.ctaLink || '/category/sashimi-sushi'}
            variant="crimson"
            className="h-[52px] w-fit px-9 text-[18px] font-bold text-white shadow-2xl transition hover:brightness-110 active:scale-95 sm:h-[58px] sm:px-12"
          >
            <span>{banner.ctaText || 'Mua ngay'}</span>
            <ArrowRight className="h-5 w-5 text-[#FCEBC2]" />
          </CartoucheButton>
        </div>

        <div className="absolute bottom-5 right-5 hidden items-center gap-2 rounded-full border border-[#C99B49] bg-[#102F49]/90 px-4 py-2 text-sm font-bold text-[#FCEBC2] shadow-xl backdrop-blur-sm sm:flex lg:bottom-7 lg:right-[5vw]">
          <span>★ Tươi Mới Mỗi Ngày</span>
        </div>

        {/* Carousel Navigation Buttons if multiple banners */}
        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Banner trước"
              className="absolute -left-4 sm:left-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#102F49]/90 text-[#FCEBC2] border border-[#C99B49] shadow-xl flex items-center justify-center hover:bg-[#102F49] transition z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Banner tiếp theo"
              className="absolute -right-4 sm:right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#102F49]/90 text-[#FCEBC2] border border-[#C99B49] shadow-xl flex items-center justify-center hover:bg-[#102F49] transition z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Chuyển tới slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentSlide ? 'w-8 bg-[#C99B49]' : 'w-2.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
