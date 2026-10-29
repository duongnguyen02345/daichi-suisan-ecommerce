import React from 'react';

export interface PlaquePillarProps {
  number: string;
  lines: string[];
  offsetClass?: string;
}

export const PlaquePillar: React.FC<PlaquePillarProps> = ({
  number,
  lines,
  offsetClass = '',
}) => {
  return (
    <div
      className={`group relative flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-2 select-none flex-shrink-0 w-[125px] sm:w-[140px] md:w-[155px] lg:w-[168px] xl:w-[180px] h-[340px] sm:h-[370px] md:h-[400px] lg:h-[420px] p-4 sm:p-5 ${offsetClass}`}
      style={{
        filter: 'drop-shadow(0 6px 16px rgba(10, 25, 45, 0.4))',
      }}
    >
      {/* SVG Background Plaque with Chamfered Corners and Double Red Border */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 group-hover:scale-[1.01]"
        viewBox="0 0 140 400"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="plaque-bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFFDF7" />
            <stop offset="100%" stopColor="#FBF7EC" />
          </linearGradient>
        </defs>

        {/* Outer Chamfered Border & Fill */}
        <polygon
          points="18,0 122,0 140,18 140,382 122,400 18,400 0,382 0,18"
          fill="url(#plaque-bg-grad)"
          stroke="#9F1D24"
          strokeWidth="1.8"
        />

        {/* Inner Fine Red Inlay Border */}
        <polygon
          points="21,4.5 119,4.5 135.5,21 135.5,379 119,395.5 21,395.5 4.5,379 4.5,21"
          fill="none"
          stroke="#9F1D24"
          strokeWidth="0.9"
          strokeOpacity="0.75"
        />
      </svg>

      {/* 1. Header: Number and Gold Ornament */}
      <div className="relative z-10 flex flex-col items-center pt-2 sm:pt-3">
        <span className="text-[34px] sm:text-[38px] lg:text-[42px] font-black font-serif text-[#102F49] tracking-wider leading-none">
          {number}
        </span>
        <div className="flex items-center justify-center gap-1 mt-2 mb-1">
          <span className="w-1 h-1 rounded-full bg-[#C99B49]" />
          <span className="w-1.5 h-1.5 rotate-45 bg-[#C99B49]" />
          <span className="w-1 h-1 rounded-full bg-[#C99B49]" />
        </div>
      </div>

      {/* 2. Body: Vertical stacked words in bold serif */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-1 sm:space-y-1.5 text-center">
        {lines.map((word, idx) => (
          <span
            key={idx}
            className="text-[17px] sm:text-[19px] md:text-[21px] lg:text-[23px] font-black uppercase font-serif tracking-[0.18em] text-[#102F49] leading-tight"
          >
            {word}
          </span>
        ))}
      </div>

      {/* 3. Footer: Traditional Japanese Red Wave Seal (Hanko) */}
      <div className="relative z-10 pb-2 sm:pb-3 flex justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          className="opacity-85 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105"
        >
          <circle cx="16" cy="16" r="14.5" stroke="#9F1D24" strokeWidth="1.4" fill="#FFF1F1" fillOpacity="0.6" />
          <circle cx="16" cy="16" r="12.5" stroke="#9F1D24" strokeWidth="0.7" strokeDasharray="1.5 1.5" />
          <path d="M6 19 C9 15, 13 15, 16 19 C19 15, 23 15, 26 19" stroke="#9F1D24" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          <path d="M8.5 21.5 C11 18.5, 14 18.5, 16 21.5 C18 18.5, 21 18.5, 23.5 21.5" stroke="#9F1D24" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M11 24 C13 22, 14.5 22, 16 24 C17.5 22, 19 22, 21 24" stroke="#9F1D24" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <circle cx="16" cy="11.5" r="2.2" fill="#9F1D24" />
        </svg>
      </div>
    </div>
  );
};
