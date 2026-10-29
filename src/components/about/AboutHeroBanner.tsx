import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { createBannerSlides, BannerSlide } from '../../lib/banners';
import { CartoucheButton } from '../common/CartoucheButton';
import { Banner } from '../../types';

const isVisible = (banner: Banner) => {
  if (!banner.active || !['scheduled', 'published'].includes(banner.publicationStatus || '')) return false;
  const now = Date.now();
  const startsAt = banner.startsAt ? new Date(banner.startsAt).getTime() : null;
  const endsAt = banner.endsAt ? new Date(banner.endsAt).getTime() : null;
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
};

export const AboutHeroBanner: React.FC = () => {
  const { banners } = useAdmin();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const fallbackBanner: Banner = {
    id: 'default-about-hero',
    title: 'VỀ CHÚNG TÔI',
    subtitle: 'Lắng nghe đúng nhu cầu, cùng cộng đồng giá trị\n“DAICHI SUISAN – Chất lượng từ nguyên liệu, trọn vẹn trong từng bữa ăn.”\nVới phương châm mang tinh hoa ẩm thực Nhật Bản đến gần hơn với mọi gia đình Việt, chúng tôi không ngừng nỗ lực để phục vụ bằng sự tận tâm, uy tín và cam kết lâu dài vì một cuộc sống tốt đẹp hơn.',
    badge: 'DAICHI SUISAN',
    image: '/images/daichi-hero-seafood.png',
    gallery: ['/images/daichi-hero-seafood.png'],
    ctaText: 'Khám phá thực đơn',
    ctaLink: '/products',
    placement: 'about_hero',
    active: true,
  };

  const activeAboutBanners = useMemo(() => {
    return banners
      .filter((b) => b.placement === 'about_hero' && isVisible(b))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [banners]);

  const bannerToDisplay = activeAboutBanners.length > 0 ? activeAboutBanners[0] : fallbackBanner;
  const slides = useMemo(() => createBannerSlides([bannerToDisplay]), [bannerToDisplay]);

  useEffect(() => {
    setCurrentSlide((current) => (current >= slides.length ? 0 : current));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || isPaused) return undefined;
    const interval = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, [isPaused, slides.length]);

  const slide: BannerSlide = slides[currentSlide] || slides[0];
  const banner = slide?.banner || bannerToDisplay;

  const hasTitle = Boolean(banner.title && banner.title.trim().length > 0);
  const hasSubtitle = Boolean(banner.subtitle && banner.subtitle.trim().length > 0);
  const hasBadge = Boolean(banner.badge && banner.badge.trim().length > 0);
  const hasTextOverlay = hasTitle || hasSubtitle || hasBadge;

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const bannerImage = slide?.image || fallbackBanner.image;

  // Tách dòng subtitle thành slogan và description
  const subtitleLines = banner.subtitle ? banner.subtitle.split('\n').filter(Boolean) : [];
  const sloganLine = subtitleLines[0] || '';
  const descLines = subtitleLines.slice(1);

  return (
    <section
      className="relative flex min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] w-full select-none items-center overflow-hidden border-b-2 border-[#C99B49] bg-[#6B0D12]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Banner giới thiệu Về chúng tôi"
    >
      {/* 1. ẢNH BANNER CHÍNH - Phủ toàn bộ chiều ngang & chiều cao */}
      <img
        src={bannerImage}
        alt={banner.title || 'Banner Về chúng tôi'}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700"
      />

      {/* 2. LỚP PHỦ NGHỆ THUẬT NHẬT BẢN - Bảo đảm chữ luôn nổi bật trên mọi hình ảnh banner */}
      {hasTextOverlay && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#5F0B11]/95 via-[#6B0D12]/85 to-[#6B0D12]/20 lg:to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15" />
        </>
      )}

      {/* Bottom Seigaiha wave strip */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-x-0 bottom-0 h-4 opacity-20 bg-repeat-x z-10"
        style={{ 
          backgroundImage: `url('/assets/japanese-ui/seigaiha-pattern.svg')`,
          backgroundSize: '32px 16px' 
        }}
      />

      {/* 3. NỘI DUNG VĂN BẢN TRÊN BANNER */}
      {hasTextOverlay && (
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 py-12 sm:py-16 w-full">
          <div className="max-w-2xl text-white">
            {/* Nhãn nhỏ Cartouche */}
            {hasBadge && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#102F49]/95 border border-[#C99B49] text-[#FCEBC2] text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#C99B49]" />
                <span>{banner.badge}</span>
              </div>
            )}

            {/* Tiêu đề chính */}
            {hasTitle && (
              <h1 className="text-[32px] sm:text-[44px] lg:text-[54px] font-black text-white tracking-tight leading-[1.15] font-serif drop-shadow-md">
                {banner.title}
              </h1>
            )}

            {/* Phân cách phong cách Nhật Bản */}
            <div className="flex items-center gap-3 my-4">
              <span className="w-16 h-[2px] bg-[#C99B49]" />
              <span className="w-2.5 h-2.5 rotate-45 bg-[#C99B49] border border-white/40" />
              <span className="w-16 h-[2px] bg-[#C99B49]" />
            </div>

            {/* Slogan */}
            {sloganLine && (
              <p className="text-lg sm:text-xl lg:text-2xl text-[#FCEBC2] font-semibold italic mb-3 drop-shadow-sm font-serif">
                {sloganLine}
              </p>
            )}

            {/* Các dòng mô tả phụ */}
            {descLines.length > 0 && (
              <div className="space-y-2 mb-7 text-xs sm:text-sm text-[#FFF8E8]/90 leading-relaxed max-w-xl">
                {descLines.map((line, idx) => (
                  <p key={idx} className={idx === 0 ? 'text-white/95 font-medium italic font-serif text-sm sm:text-base' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            )}

            {/* Nút hành động (Mở rộng kích thước chuẩn như Ảnh 1, nút xám đổi thành vàng) */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
              {banner.ctaText && (
                <CartoucheButton
                  to={banner.ctaLink || '/products'}
                  variant="crimson"
                  className="h-[48px] px-6 text-[18px] font-bold text-white shadow-xl lg:h-[52px] lg:px-8"
                >
                  <span>{banner.ctaText}</span>
                  <ArrowRight className="w-4 h-4 text-[#FCEBC2]" />
                </CartoucheButton>
              )}

              <CartoucheButton
                to="/contact"
                variant="gold"
                className="h-[48px] px-6 text-[18px] font-bold text-[#102F49] shadow-lg lg:h-[52px] lg:px-8"
              >
                <span>Liên hệ tư vấn</span>
              </CartoucheButton>
            </div>
          </div>
        </div>
      )}

      {/* 4. NÚT ĐIỀU HƯỚNG CAROUSEL (Hiển thị khi banner có nhiều hơn 1 ảnh) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Ảnh trước"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-[#8E161C] border border-[#C99B49]/70 text-white flex items-center justify-center transition opacity-75 hover:opacity-100 shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Ảnh tiếp theo"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-[#8E161C] border border-[#C99B49]/70 text-white flex items-center justify-center transition opacity-75 hover:opacity-100 shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dấu chấm chỉ báo slide */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Chuyển đến ảnh ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-8 bg-[#C99B49]' : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
