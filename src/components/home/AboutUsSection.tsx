import React, { useEffect, useState } from 'react';
import { Quote, ArrowRight } from 'lucide-react';
import { CartoucheButton } from '../common/CartoucheButton';
import { loadPageSections } from '../../lib/pageSectionsApi';
import { PageSection } from '../../types';

const headerCard = {
  svg: '/images/header-section.svg?v=20261026_anchor',
  title: '05 Lý Do Chọn Chúng Tôi',
};

const commitmentCards = [
  {
    id: 1,
    svg: '/images/cam-ket-1.svg?v=20261026_anchor',
    title: '01 Chất Lượng Được Ưu Tiên',
    desc: 'Minh bạch nguồn gốc xuất xứ',
    detail: 'Hải sản đánh bắt từ Hokkaido, Sanriku & Bò Wagyu A5 Miyazaki có đầy đủ chứng nhận VSATTP.',
    offsetClass: 'lg:-translate-y-3.5 xl:-translate-y-4 2xl:-translate-y-5',
  },
  {
    id: 2,
    svg: '/images/cam-ket-2.svg?v=20261026_anchor',
    title: '02 Minh Bạch & Uy Tín',
    desc: 'Bảo quản tiêu chuẩn ăn sống',
    detail: 'Quy trình kiểm soát độ tươi nghiêm ngặt, giữ trọn vị ngọt tự nhiên chuẩn món Nhật thượng hạng.',
    offsetClass: 'lg:translate-y-3.5 xl:translate-y-4 2xl:translate-y-5',
  },
  {
    id: 3,
    svg: '/images/cam-ket-3.svg?v=20261026_anchor',
    title: '03 Sản Phẩm Đa Dạng',
    desc: 'Công nghệ IQF âm sâu -60°C',
    detail: 'Khóa chặt dưỡng chất và độ ẩm tế bào, khi rã đông thực phẩm giữ nguyên độ tươi ngon nguyên bản.',
    offsetClass: 'lg:-translate-y-3.5 xl:-translate-y-4 2xl:-translate-y-5',
  },
  {
    id: 4,
    svg: '/images/cam-ket-4.svg?v=20261026_anchor',
    title: '04 Tận Tâm & Tận Tình',
    desc: 'Thùng xốp & đá gel chuyên dụng',
    detail: 'Đóng gói bảo ôn đa lớp, nhiệt độ ổn định suốt hành trình trao tận tay căn bếp gia đình bạn.',
    offsetClass: 'lg:translate-y-3.5 xl:translate-y-4 2xl:translate-y-5',
  },
  {
    id: 5,
    svg: '/images/cam-ket-5.svg?v=20261026_anchor',
    title: '05 Cung Ứng Linh Hoạt',
    desc: 'Đồng hành cùng bữa tiệc gia đình',
    detail: 'Hỗ trợ phi lê, cắt lát Sashimi, tẩm ướp lẩu nướng theo yêu cầu và tư vấn thực đơn tiệc trọn gói.',
    offsetClass: 'lg:-translate-y-3.5 xl:-translate-y-4 2xl:-translate-y-5',
  },
];

export const AboutUsSection: React.FC = () => {
  const [sections, setSections] = useState<PageSection[]>([]);

  useEffect(() => {
    void loadPageSections('home').then(setSections).catch(() => {});
  }, []);

  const introSec = sections.find((s) => s.sectionKey === 'intro');
  const artisanSec = sections.find((s) => s.sectionKey === 'artisan');
  const commitmentsSec = sections.find((s) => s.sectionKey === 'commitments');

  if (introSec && !introSec.isVisible) {
    return null;
  }

  const badgeText = introSec?.body?.badge || 'DAICHI SUISAN';
  const mainTitle = introSec?.title || 'Trọn Vẹn Tinh Hoa Hải Sản & Thực Phẩm Nhật Bản';
  const quoteText = artisanSec?.body?.quote || '“Sự trọn vẹn trong ẩm thực không chỉ là độ ngon miệng, mà là khoảnh khắc sum vầy an tâm, ấm cúng và đầy ắp yêu thương bên gia đình.”';
  const ctaText = introSec?.ctaText || 'Xem thêm về DAICHI SUISAN';
  const ctaLink = introSec?.ctaLink || '/about';
  return (
    <div id="about-us" className="relative scroll-mt-[120px] lg:scroll-mt-[128px]">
      
      {/* PHẦN 1: LỜI NGỎ & CÂU CHUYỆN THƯƠNG HIỆU (CỐ ĐỊNH VÀO VÙNG NÚI PHÚ SĨ TRÊN NỀN CANVA) */}
      <section className="relative homepage-story-zone bg-transparent pt-14 sm:pt-18 lg:pt-0 pb-14 sm:pb-18 lg:pb-0 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Cột trái: Lời ngỏ / Giới thiệu */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              
              {/* Badge thương hiệu */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF1DC] text-[#9F1D24] border border-[#E5CF9E] text-xs font-bold uppercase tracking-wider mb-3.5 w-fit font-label">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9F1D24]" />
                <span>{badgeText}</span>
              </div>

              {/* Tiêu đề chính trang nhã */}
              <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-black text-[#172E3D] leading-[1.18] tracking-tight mb-4 font-header">
                {mainTitle}
              </h2>

              {/* Gạch trang trí phong cách ẩm thực */}
              <div className="flex items-center gap-2 mb-5">
                <span className="w-12 h-[2px] bg-[#9F1D24]" />
                <span className="w-2 h-2 rotate-45 bg-[#C99B49]" />
                <span className="w-6 h-[1px] bg-[#C99B49]" />
              </div>

              {/* Đoạn Lời ngỏ */}
              <div className="space-y-4 text-[16px] sm:text-[18px] text-[#172E3D] leading-relaxed">
                {introSec?.body?.description ? (
                  <p className="story-highlight-paragraph font-medium text-[#172E3D]">
                    <span className="story-static-highlight">{introSec.body.description}</span>
                  </p>
                ) : (
                  <>
                    <p className="story-highlight-paragraph font-medium text-[#172E3D]">
                      <span className="story-static-highlight">
                        Chào mừng bạn đến với thế giới ẩm thực tươi sống của <strong className="text-[#9F1D24] font-bold">DAICHI SUISAN</strong>. Lấy cảm hứng từ triết lý ẩm thực xứ sở Phù Tang – nơi mỗi món ăn là một bản hòa tấu tôn vinh sự thuần khiết, độ tươi sống nguyên bản và lòng kính trọng đối với thiên nhiên.
                      </span>
                    </p>
                    <p className="story-highlight-paragraph text-[#172E3D]">
                      <span className="story-static-highlight">
                        Từ những chuyến hải trình đánh bắt tại các ngư trường trù phú bậc nhất như vùng biển lạnh Hokkaido, Sanriku đến các phiên đấu giá cá ngừ sớm mai tại chợ Toyosu (Tokyo)... Chúng tôi kết nối trực tiếp nguồn nguyên liệu thượng hạng về đến bàn tiệc của mỗi gia đình Việt Nam và đối tác nhà hàng, khách sạn.
                      </span>
                    </p>
                  </>
                )}
              </div>

              {/* Trích dẫn triết lý trong khung cartouche kem viền chỉ vàng */}
              {artisanSec?.isVisible !== false && (
                <div className="mt-5 p-4 sm:p-5 rounded-[16px] bg-[#FFFDF7] border-l-4 border-[#9F1D24] border border-[#EAD7AD] shadow-xs">
                  <div className="flex gap-3">
                    <Quote className="w-6 h-6 text-[#9F1D24] flex-shrink-0 opacity-80 mt-0.5" />
                    <p className="italic text-[15px] sm:text-[17px] lg:text-[18px] text-[#172E3D] font-medium leading-relaxed">
                      {quoteText}
                    </p>
                  </div>
                </div>
              )}

              {/* Nút xem chi tiết về chúng tôi */}
              <div className="mt-6 flex items-center gap-4">
                <CartoucheButton
                  to={ctaLink}
                  variant="crimson"
                  className="h-[50px] px-7 text-[18px] font-bold text-white"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-4 h-4 text-[#FCEBC2]" />
                </CartoucheButton>
              </div>

            </div>

            {/* Cột phải: Hình ảnh nghệ thuật ẩm thực */}
            <div className="lg:col-span-5 relative mt-12 sm:mt-14 lg:mt-0">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Khung ảnh chính bo góc trang nhã với viền vàng Nhật Bản */}
                <div className="relative rounded-[20px] overflow-hidden shadow-xl border-2 border-[#C99B49] outline outline-1 outline-[#C99B49]/40 outline-offset-4 bg-white group">
                  <img 
                    src="/images/daichi-chef-craft.png" 
                    alt="Nghệ nhân sắp đặt sushi và sashimi tươi sống" 
                    className="w-full h-[340px] sm:h-[420px] lg:h-[480px] object-cover object-center group-hover:scale-105 transition-transform duration-700 filter saturate-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Chú thích trên ảnh */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-[11px] font-semibold tracking-wider uppercase text-[#FCEBC2] mb-1 font-label">
                      Chuẩn Mực Nhật Bản
                    </div>
                    <div className="text-[16px] sm:text-[18px] font-bold">
                      Sashimi Cá Hồi, Bụng Cá Ngừ &amp; Sò Điệp Hotate
                    </div>
                  </div>
                </div>

                {/* Thẻ Bookmark 100% Tươi Ngon */}
                <div 
                  className="absolute -top-[88px] sm:-top-[104px] lg:-top-[116px] xl:-top-[120px] right-4 sm:right-6 lg:right-8 z-20 w-[88px] sm:w-[104px] lg:w-[116px] xl:w-[120px] select-none group-hover:-translate-y-1 transition-transform duration-300 pointer-events-none"
                  title="100% Tươi Ngon"
                >
                  <picture>
                    <source type="image/webp" srcSet="/images/100-tuoi-ngon-512.webp" />
                    <img 
                      src="/images/100-tuoi-ngon.png" 
                      alt="100% Tươi Ngon" 
                      className="w-full h-auto object-contain filter drop-shadow-2xl"
                    />
                  </picture>
                </div>

                {/* Thẻ trải nghiệm nổi góc dưới trái */}
                <div className="absolute -bottom-4 -left-3 sm:-bottom-6 sm:-left-6 bg-[#FFFDF8]/95 backdrop-blur-md p-3.5 sm:p-4 rounded-[14px] shadow-lg border border-[#EAD7AD] max-w-[250px] hidden sm:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E2F1E6] text-[#07583F] flex items-center justify-center font-bold text-sm flex-shrink-0 border border-[#ACD0B6] font-label">
                      5★
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#172E3D] font-label">Chuẩn Tươi Ăn Sống</div>
                      <div className="text-[11px] text-[#65716C] mt-0.5">Bảo quản lạnh âm sâu khép kín</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PHẦN 2: LÝ DO KHÁCH HÀNG LUÔN TIN CHỌN CHÚNG TÔI (CỐ ĐỊNH CHUẨN XÁC VÀO VÙNG BIỂN ĐÊM THEO ẢNH 2) */}
      <section className="relative homepage-commitments-zone bg-transparent text-white overflow-hidden py-10 sm:py-14 lg:py-0">
        <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 relative z-10 w-full flex flex-col justify-center">

          {/* Dàn 6 thẻ bài nghệ thuật: Header vàng bên trái + 5 thẻ cam kết so le nhịp nhàng theo Ảnh 2 */}
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-2 sm:gap-2.5 lg:gap-3 xl:gap-3.5 2xl:gap-4 max-w-[1100px] mx-auto py-2 sm:py-4">
            
            {/* 1. Thẻ Tiêu đề Vàng Header Section (Header_secsion.svg) */}
            <div className="group relative transition-all duration-300 hover:-translate-y-2 flex flex-col items-center w-[105px] sm:w-[120px] lg:w-[122px] xl:w-[136px] 2xl:w-[145px] flex-shrink-0">
              <div className="w-full relative filter drop-shadow-md group-hover:drop-shadow-2xl transition-all duration-300">
                <img
                  src={headerCard.svg}
                  alt={headerCard.title}
                  className="w-full h-auto object-contain select-none transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
            </div>

            {/* 2. Năm Thẻ Cam Kết xếp so le (High - Low - High - Low - High) đúng theo Ảnh 2 */}
            {commitmentCards.map((card) => (
              <div
                key={card.id}
                className={`group relative transition-all duration-300 hover:-translate-y-2 flex flex-col items-center w-[105px] sm:w-[120px] lg:w-[122px] xl:w-[136px] 2xl:w-[145px] flex-shrink-0 ${card.offsetClass}`}
              >
                <div className="w-full relative filter drop-shadow-md group-hover:drop-shadow-2xl transition-all duration-300">
                  <img
                    src={card.svg}
                    alt={`${card.title} - ${card.desc}: ${card.detail}`}
                    className="w-full h-auto object-contain select-none transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
};
