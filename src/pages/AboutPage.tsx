import { AboutHeroBanner } from '../components/about/AboutHeroBanner';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Clock3, 
  ShoppingBag, 
  Truck, 
  Package, 
  Phone, 
  ArrowRight,  
} from 'lucide-react';
import { CartoucheButton } from '../components/common/CartoucheButton';
import { useAdmin } from '../context/AdminContext';
import { loadPageSections } from '../lib/pageSectionsApi';
import { PageSection } from '../types';
// PlaquePillar replaced with direct image cards as requested

const coreValues = [
  {
    id: 1,
    title: '01. Chất lượng',
    image: '/images/chat-luong.webp',
    offsetClass: 'lg:-translate-y-3.5 xl:-translate-y-4',
  },
  {
    id: 2,
    title: '02. Uy tín',
    image: '/images/uy-tin.webp',
    offsetClass: 'lg:-translate-y-3.5 xl:-translate-y-4',
  },
  {
    id: 3,
    title: '03. Tận tâm',
    image: '/images/tan-tam.webp',
    offsetClass: 'lg:-translate-y-3.5 xl:-translate-y-4',
  },
  {
    id: 4,
    title: '04. Chuyên nghiệp',
    image: '/images/chuyen-nghiep.webp',
    offsetClass: 'lg:-translate-y-3.5 xl:-translate-y-4',
  },
  {
    id: 5,
    title: '05. Bền vững',
    image: '/images/ben-vung.webp',
    offsetClass: 'lg:-translate-y-3.5 xl:-translate-y-4',
  },
];

export const AboutPage: React.FC = () => {
  const { banners } = useAdmin();
  const [sections, setSections] = useState<PageSection[]>([]);

  useEffect(() => {
    void loadPageSections('about').then(setSections).catch(() => {});
  }, []);

  const visionSec = sections.find((s) => s.sectionKey === 'vision');
  const valuesSec = sections.find((s) => s.sectionKey === 'values');

  const visionText = visionSec?.body?.vision || 'Trở thành một trong những đơn vị cung ứng thực phẩm Nhật Bản được khách hàng tin tưởng tại Việt Nam, hướng đến hệ thống phân phối chuyên nghiệp, thuận tiện và đáng tin cậy.';
  const missionText = visionSec?.body?.mission || 'Đưa các sản phẩm thực phẩm chất lượng đến gần hơn với người tiêu dùng Việt Nam, đồng thời đồng hành cùng nhà hàng, khách sạn và đối tác kinh doanh trong việc tìm kiếm nguồn nguyên liệu phù hợp và hiệu quả.';

  const digitalBanner = banners.find((b) => b.placement === 'about_digital' && b.active);
  const digitalImage = digitalBanner?.image || digitalBanner?.gallery?.[0] || '/images/sashimi-bowl.png';
  return (
    <div className="min-h-screen bg-[#F7EEDB] text-[#172E3D] selection:bg-[#9F1D24] selection:text-white">
      
      {/* 1. BREADCRUMB */}
      <div className="border-b border-[#EAD7AD] bg-[#FFF9EB]/90 backdrop-blur-xs">
        <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 py-3.5">
          <nav className="flex items-center gap-2 text-xs text-[#65716C]" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[#9F1D24] transition">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C99B49]" />
            <span className="font-semibold text-[#9F1D24]">Về chúng tôi</span>
          </nav>
        </div>
      </div>

      {/* 2. HERO BANNER - Quản lý động qua trang Admin */}
      <AboutHeroBanner />

      {/* Khu vực hình nền nghệ thuật bắt đầu ngay sau banner chính */}
      <div className="about-art-background relative">

      {/* 3. TẦM NHÌN & SỨ MỆNH */}
      {visionSec?.isVisible !== false && (
      <section className="pt-14 sm:pt-20 pb-4 sm:pb-6 max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 relative">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-block mb-3 sm:mb-4">
            <CartoucheButton
              variant="crimson"
              className="text-[#FCEBC2] text-sm sm:text-base lg:text-lg xl:text-xl font-black uppercase tracking-[0.2em] font-serif h-[54px] sm:h-[62px] lg:h-[70px] px-8 sm:px-12 lg:px-16 drop-shadow-md cursor-default pointer-events-none"
            >
              <span>ĐỊNH HƯỚNG PHÁT TRIỂN</span>
            </CartoucheButton>
          </div>
          <h2 className="text-[26px] sm:text-[34px] lg:text-[40px] font-black text-[#172E3D] font-serif">
            Tầm Nhìn &amp; Sứ Mệnh
          </h2>
          <p className="text-xs sm:text-sm text-[#65716C] mt-2 font-serif italic">
            Kim chỉ nam dẫn lối cho mọi hoạt động của DAICHI SUISAN trên hành trình phục vụ khách hàng.
          </p>
        </div>

        {/* 2 Cards Grid - 2 Thẻ Tầm nhìn & Sứ mệnh với vector gốc và nội dung chi tiết */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
          
          {/* THẺ 1: TẦM NHÌN (VISION) */}
          <div className="relative group transition-transform duration-300 hover:-translate-y-1 overflow-hidden rounded-2xl drop-shadow-xl">
            <img 
              src="/images/vision.webp" 
              alt="Tầm Nhìn - DAICHI SUISAN" 
              className="w-full h-auto block select-none"
              loading="lazy"
            />
            {/* Nội dung thông tin Tầm nhìn được đặt chuẩn xác vào vùng trống của thẻ */}
            <div className="absolute top-[41%] sm:top-[42%] left-[9.8%] right-[8%] bottom-[6%] pointer-events-none">
              <p className="text-[#2D3748] text-[18px] leading-snug sm:leading-relaxed font-medium select-text pointer-events-auto">
                {visionText}
              </p>
            </div>
          </div>

          {/* THẺ 2: SỨ MỆNH (MISSION) */}
          <div className="relative group transition-transform duration-300 hover:-translate-y-1 overflow-hidden rounded-2xl drop-shadow-xl">
            <img 
              src="/images/mission.webp" 
              alt="Sứ Mệnh - DAICHI SUISAN" 
              className="w-full h-auto block select-none"
              loading="lazy"
            />
            {/* Nội dung thông tin Sứ mệnh được đặt chuẩn xác vào vùng trống của thẻ */}
            <div className="absolute top-[41%] sm:top-[42%] left-[8.4%] right-[8%] bottom-[6%] pointer-events-none">
              <p className="text-[#2D3748] text-[18px] leading-snug sm:leading-relaxed font-medium select-text pointer-events-auto">
                {missionText}
              </p>
            </div>
          </div>

        </div>
      </section>
      )}

      {/* 4. 5 GIÁ TRỊ CỐT LÕI (5 Giá trị vàng) */}
      {valuesSec?.isVisible !== false && (
      <section className="pt-8 sm:pt-10 md:pt-12 pb-4 sm:pb-6 max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 relative">
        
        {/* Header: Thẻ tiêu đề GIÁ TRỊ CỐT LÕI (Khoảng cách với 5 thẻ được x2 chuẩn đẹp) */}
        <div className="text-center max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-10">
          <div className="inline-block">
            <CartoucheButton
              variant="gold"
              className="text-[#102F49] text-sm sm:text-base lg:text-lg xl:text-xl font-black uppercase tracking-[0.2em] font-serif h-[54px] sm:h-[62px] lg:h-[70px] px-8 sm:px-12 lg:px-16 drop-shadow-md cursor-default pointer-events-none"
            >
              <span>GIÁ TRỊ CỐT LÕI</span>
            </CartoucheButton>
          </div>
        </div>

        {/* 5 Thẻ Dài Giá Trị Cốt Lõi (Plaque Pillars) dạng thẻ dài như Ảnh 2 */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-2 sm:gap-4 md:gap-5 lg:gap-4 xl:gap-6 max-w-[1100px] mx-auto pt-2 sm:pt-3 md:pt-4 pb-4 sm:pb-6">
          {coreValues.map((item) => (
            <div
              key={item.id}
              className={`group relative transition-all duration-300 hover:-translate-y-2 flex flex-col items-center w-[100px] min-[390px]:w-[115px] sm:w-[135px] md:w-[150px] lg:w-[168px] xl:w-[180px] flex-shrink-0 cursor-default select-none ${item.offsetClass}`}
            >
              <div 
                className="w-full relative transition-all duration-300 group-hover:scale-[1.03]"
                style={{
                  filter: 'drop-shadow(0 6px 16px rgba(10, 25, 45, 0.4))',
                }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-auto block select-none pointer-events-none"
                  loading="lazy"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* 6. TRẢI NGHIỆM SỐ HÓA - DAICHI SUISAN ONLINE (Khung ảnh Nền xanh.webp mở rộng, cân bằng khoảng cách) */}
      <section className="relative pt-6 sm:pt-8 md:pt-10 pb-6 sm:pb-8 md:pb-10 max-w-[1440px] mx-auto px-3 sm:px-5 md:px-8 z-10">
        
        {/* Khung ảnh nền xanh.webp hiển thị trực tiếp làm khung nghệ thuật tự nhiên (không drop-shadow hay lớp mờ bao ngoài) */}
        <div 
          className="relative w-full max-w-[1380px] xl:max-w-[1400px] mx-auto"
          style={{
            backgroundImage: "url('/images/nen-xanh.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center py-8 sm:py-12 md:py-14 lg:py-16 pl-[6%] sm:pl-[7.5%] lg:pl-[8.5%] pr-[4%] sm:pr-[5.5%] lg:pr-[6.5%] relative z-10">
              
              {/* Left Column: Heading, Info & Actions */}
              <div className="lg:col-span-7">
                
                {/* 1. Gold Cartouche Badge */}
                <div className="inline-block mb-3 sm:mb-4">
                  <div className="relative inline-flex items-center justify-center px-5 py-1.5 min-h-[34px] select-none">
                    <img 
                      src="/images/nut-vang.webp" 
                      alt="DAICHI SUISAN ONLINE" 
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow-sm" 
                    />
                    <span className="relative z-10 text-[#102F49] text-xs sm:text-sm font-black uppercase tracking-wider font-serif">
                      DAICHI SUISAN ONLINE
                    </span>
                  </div>
                </div>

                {/* 2. Main Title */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] xl:text-[44px] font-black text-white font-serif leading-tight drop-shadow-md mb-3 sm:mb-4">
                  DAICHI SUISAN ONLINE<br />
                  <span>Mua Sắm Thuận Tiện Hơn</span>
                </h2>

                {/* 3. Description */}
                <p className="text-xs sm:text-sm md:text-base text-white/90 leading-relaxed font-sans max-w-xl mb-6 sm:mb-7">
                  Thông qua website bán hàng trực tuyến, DAICHI SUISAN mang đến trải nghiệm mua sắm đơn giản, nhanh chóng với đa dạng sản phẩm, nhiều chương trình ưu đãi và hỗ trợ giao hàng.
                </p>

                {/* 4. Three Feature Badges (Pills) - Màu vàng đồng bộ Giá trị cốt lõi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-6 sm:mb-8 max-w-xl">
                  
                  {/* Pill 1: Đa dạng sản phẩm */}
                  <div className="bg-gradient-to-b from-[#FFF4C7] via-[#F7CE65] to-[#DF9F28] rounded-[14px] p-2.5 sm:p-3 border border-[#C99B49] flex items-center gap-2.5 sm:gap-3 shadow-md hover:brightness-105 transition-all">
                    <div className="w-8 h-8 rounded-full bg-[#102F49] flex items-center justify-center flex-shrink-0 border border-[#C99B49]/50 text-[#FFF4C7] shadow-inner">
                      <ShoppingBag className="w-4 h-4 text-[#FFF4C7]" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#102F49] leading-tight">Đa dạng sản phẩm</div>
                      <div className="text-[11px] text-[#102F49]/80 font-bold mt-0.5 whitespace-nowrap">Hàng mới mỗi ngày</div>
                    </div>
                  </div>

                  {/* Pill 2: Hỗ trợ 24/7 (Icon điện thoại) */}
                  <div className="bg-gradient-to-b from-[#FFF4C7] via-[#F7CE65] to-[#DF9F28] rounded-[14px] p-2.5 sm:p-3 border border-[#C99B49] flex items-center gap-2.5 sm:gap-3 shadow-md hover:brightness-105 transition-all">
                    <div className="w-8 h-8 rounded-full bg-[#102F49] flex items-center justify-center flex-shrink-0 border border-[#C99B49]/50 text-[#FFF4C7] shadow-inner">
                      <Phone className="w-4 h-4 text-[#FFF4C7]" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#102F49] leading-tight">Hỗ trợ 24/7</div>
                      <div className="text-[11px] text-[#102F49]/80 font-bold mt-0.5 whitespace-nowrap">Tư vấn nhanh chóng</div>
                    </div>
                  </div>

                  {/* Pill 3: Giao hỏa tốc (Icon xe tải) */}
                  <div className="bg-gradient-to-b from-[#FFF4C7] via-[#F7CE65] to-[#DF9F28] rounded-[14px] p-2.5 sm:p-3 border border-[#C99B49] flex items-center gap-2.5 sm:gap-3 shadow-md hover:brightness-105 transition-all">
                    <div className="w-8 h-8 rounded-full bg-[#102F49] flex items-center justify-center flex-shrink-0 border border-[#C99B49]/50 text-[#FFF4C7] shadow-inner">
                      <Truck className="w-4 h-4 text-[#FFF4C7]" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#102F49] leading-tight">Giao hỏa tốc</div>
                      <div className="text-[11px] text-[#102F49]/80 font-bold mt-0.5 whitespace-nowrap">An toàn, tiện lợi</div>
                    </div>
                  </div>

                </div>

                {/* 5. Action Buttons (Mở rộng kích thước chuẩn như Ảnh 1, nút xám đổi thành vàng) */}
                <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
                  {/* Button 1: Khám phá sản phẩm ngay */}
                  <CartoucheButton
                    to="/products"
                    variant="crimson"
                    className="h-[48px] px-6 text-[18px] font-bold text-white shadow-xl lg:h-[52px] lg:px-8"
                  >
                    <span>Khám phá sản phẩm ngay</span>
                    <ArrowRight className="w-4 h-4 text-[#FCEBC2]" />
                  </CartoucheButton>

                  {/* Button 2: Liên hệ tư vấn (Đổi sang màu vàng theo yêu cầu) */}
                  <CartoucheButton
                    to="/contact"
                    variant="gold"
                    className="h-[48px] px-6 text-[18px] font-bold text-[#102F49] shadow-lg lg:h-[52px] lg:px-8"
                  >
                    <span>Liên hệ tư vấn</span>
                  </CartoucheButton>
                </div>

              </div>

              {/* Right Column: Premium Sashimi Bowl placed over waves & smoke */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end items-center mt-6 lg:mt-0 relative">
                <div className="relative w-full max-w-[360px] sm:max-w-[440px] lg:max-w-[520px] xl:max-w-[560px] group select-none">
                  <img
                    src={digitalImage}
                    alt={digitalBanner?.title || "Tô Sashimi tươi ngon thượng hạng DAICHI SUISAN"}
                    className="w-full h-auto object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.65)] transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                    loading="lazy"
                  />
                </div>
              </div>

            </div>
          </div>
      </section>

      {/* 8. SLOGAN FOOTNOTE BANNER */}
      <section className="py-12 bg-[#FAF1DC] text-center border-t border-[#EAD7AD]">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-base sm:text-lg font-bold text-[#172E3D] tracking-wide mb-3 font-serif">
            DAICHI SUISAN – Chất lượng từ nguyên liệu, trọn vẹn trong từng bữa ăn.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-[#9F1D24]">
            <Link to="/products" className="hover:underline flex items-center gap-1">
              <span>Khám phá sản phẩm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[#C99B49]">•</span>
            <Link to="/contact" className="hover:underline flex items-center gap-1">
              <span>Hỗ trợ &amp; Liên hệ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      </div>

    </div>
  );
};
