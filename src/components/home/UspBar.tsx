import React from 'react';
import { usps } from '../../data/uspData';

export const UspBar: React.FC = () => {
  return (
    <div className="lg:hidden flex gap-2 sm:gap-2.5">
      {/* Vertical Green Rectangle: "Lý do chọn chúng tôi" */}
      <div className="w-[76px] sm:w-[88px] bg-gradient-to-b from-[#0E7A32] via-[#0A5F26] to-[#07471B] rounded-[10px] sm:rounded-[12px] flex flex-col items-center justify-between py-3.5 sm:py-4 px-1 shadow-xs border border-emerald-600/30 flex-shrink-0 select-none relative overflow-hidden group">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -top-8 -left-8 w-16 h-16 bg-[#4ADE80]/20 rounded-full blur-md" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 w-16 h-16 bg-[#4ADE80]/15 rounded-full blur-md" />

        {/* Top pulse accent dot */}
        <span className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_8px_#4ADE80] animate-pulse relative z-10" />

        {/* Vertical Heading: mỗi chữ 1 hàng, x3 khoảng cách, font chữ to rõ */}
        <div className="flex flex-col items-center justify-center text-center font-black tracking-wider text-[14px] sm:text-[16px] relative z-10 gap-2 sm:gap-2.5 my-auto">
          <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">Lý</span>
          <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">do</span>
          <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">chọn</span>
          <span className="text-[#4ADE80] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            chúng
          </span>
          <span className="text-[#4ADE80] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            tôi
          </span>
        </div>

        {/* Bottom decorative bar */}
        <span className="w-1.5 h-3.5 rounded-full bg-white/20 relative z-10" />
      </div>

      {/* 5 Commitment Cards on Mobile */}
      <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
        {usps.map((usp, idx) => {
          const Icon = usp.icon;
          return (
            <div 
              key={idx}
              className="flex-1 flex items-center gap-2 px-2 py-1 rounded-[8px] sm:rounded-[10px] bg-[#F0FDF4] hover:bg-[#DCFCE7]/70 border border-[#0E7A32]/25 hover:border-[#0E7A32]/60 transition-all duration-300 hover:shadow-xs group cursor-pointer min-w-0 overflow-hidden"
            >
              {/* Circle Icon: default solid green with white icon, zooms slightly on hover */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0E7A32] text-white flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-2xs">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform duration-200" />
              </div>

              {/* Text: default green title, zooms slightly on hover */}
              <div className="min-w-0 flex-1 transition-transform duration-300 origin-left group-hover:scale-[1.03]">
                <h4 className="text-[11.5px] sm:text-[12px] font-bold text-[#0E7A32] leading-tight truncate">
                  {usp.title}
                </h4>
                <p className="text-[9.5px] sm:text-[10px] text-[#6B7280] mt-0.5 leading-snug truncate">
                  {usp.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
