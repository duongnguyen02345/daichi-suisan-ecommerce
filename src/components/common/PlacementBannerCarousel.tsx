import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { createBannerSlides } from '../../lib/banners';
import { Banner } from '../../types';

type BannerPlacement = Exclude<NonNullable<Banner['placement']>, 'home_hero'>;

interface PlacementBannerCarouselProps {
  placement: BannerPlacement;
  className?: string;
}

const themeStyles = {
  green: 'from-[#DDF3E4] via-[#EDF8F0] to-[#CBEBD5] text-[#0E7A32]',
  orange: 'from-[#FFF0D6] via-[#FFF8EB] to-[#FFE3B3] text-amber-900',
  red: 'from-[#FCE5E5] via-[#FFF3F3] to-[#F8CCCC] text-rose-900',
};

const isVisible = (banner: Banner) => {
  if (!banner.active || !['scheduled', 'published'].includes(banner.publicationStatus || '')) return false;
  const now = Date.now();
  const startsAt = banner.startsAt ? new Date(banner.startsAt).getTime() : null;
  const endsAt = banner.endsAt ? new Date(banner.endsAt).getTime() : null;
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
};

export const PlacementBannerCarousel: React.FC<PlacementBannerCarouselProps> = ({ placement, className = '' }) => {
  const { banners } = useAdmin();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slides = useMemo(() => createBannerSlides(banners
    .filter((banner) => banner.placement === placement && isVisible(banner))
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))), [banners, placement]);

  useEffect(() => {
    setCurrentSlide((current) => current >= slides.length ? 0 : current);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || isPaused) return undefined;
    const interval = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isPaused, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[currentSlide] || slides[0];
  const banner = slide.banner;
  const theme = themeStyles[banner.colorScheme || 'green'];

  const previous = () => setCurrentSlide((current) => current === 0 ? slides.length - 1 : current - 1);
  const next = () => setCurrentSlide((current) => (current + 1) % slides.length);

  return (
    <section
      className={`relative h-[180px] sm:h-[220px] rounded-[16px] overflow-hidden bg-gradient-to-r ${theme} border border-white/70 shadow-card group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Banner khuyến mại"
    >
      <picture className="absolute inset-y-0 right-0 w-full sm:w-[58%]">
        {slide.imageIndex === 0 && banner.mobileImage ? <source media="(max-width: 639px)" srcSet={banner.mobileImage} /> : null}
        <img src={slide.image} alt="" className="w-full h-full object-cover" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent sm:block hidden" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent sm:hidden" />

      <div className="relative z-10 h-full max-w-[72%] sm:max-w-[54%] p-5 sm:p-7 flex flex-col justify-center">
        {banner.badge ? <span className="w-fit px-2.5 py-1 rounded-full bg-white/85 text-[10px] font-black mb-2">{banner.badge}</span> : null}
        <h2 className="text-xl sm:text-2xl font-black leading-tight whitespace-pre-line text-white sm:text-current">{banner.title}</h2>
        <p className="text-xs sm:text-sm mt-2 text-white/85 sm:text-gray-600 line-clamp-2">{banner.subtitle}</p>
        <Link to={banner.ctaLink || '/products'} className="mt-4 w-fit h-9 px-4 rounded-xl bg-[#0E7A32] text-white text-xs font-bold inline-flex items-center gap-2 hover:bg-[#0A5C25]">
          {banner.ctaText || 'Xem ngay'} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {slides.length > 1 ? (
        <>
          <button type="button" onClick={previous} aria-label="Ảnh banner trước" className="absolute z-20 left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-gray-700 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"><ChevronLeft className="w-4 h-4" /></button>
          <button type="button" onClick={next} aria-label="Ảnh banner tiếp theo" className="absolute z-20 right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-gray-700 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"><ChevronRight className="w-4 h-4" /></button>
          <div className="absolute z-20 bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((item, index) => <button key={item.id} type="button" onClick={() => setCurrentSlide(index)} aria-label={`Chuyển đến banner ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === currentSlide ? 'w-5 bg-[#0E7A32]' : 'w-1.5 bg-white/80'}`} />)}
          </div>
        </>
      ) : null}
    </section>
  );
};
