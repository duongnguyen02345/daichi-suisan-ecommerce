import React from 'react';
import { HeroBanners } from '../components/home/HeroBanners';
import { AboutUsSection } from '../components/home/AboutUsSection';
import { CategoryBar } from '../components/home/CategoryBar';
import { BestSellers } from '../components/home/BestSellers';
import { PromoBanners } from '../components/home/PromoBanners';

export const HomePage: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-[#F7EEDB]">
      {/* 1. Hero thương hiệu - Chiều cao chuẩn 100vh cùng Header */}
      <HeroBanners />

      {/* 2. Khu vực hình nền nghệ thuật bắt đầu ngay sau banner chính */}
      <div className="homepage-art-background relative">
        {/* Câu chuyện thương hiệu & cam kết (Lời ngỏ) */}
        <AboutUsSection />

        {/* Khu mua sắm trên nền giấy Nhật */}
        <div className="relative pt-0 sm:pt-2 lg:pt-3 pb-2 sm:pb-3 lg:pb-4">
          <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 flex flex-col gap-8 md:gap-12 lg:gap-14 animate-fadeIn">
            <CategoryBar />

            <div className="rounded-[24px] border border-[#EAD7AD]/80 bg-[#FFF9EB]/75 pt-2.5 sm:pt-3 lg:pt-3.5 px-3.5 sm:px-5 lg:px-6 pb-6 sm:pb-8 lg:pb-9 shadow-sm backdrop-blur-sm">
              <BestSellers />
            </div>
          </div>
        </div>

      </div>

      {/* 3. Banner cuối trang là section độc lập, cùng cấp với banner chính để luôn full-width */}
      <PromoBanners />
    </div>
  );
};
