import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { Link } from 'react-router-dom';

export interface CartoucheButtonProps {
  children: React.ReactNode;
  variant?: 'crimson' | 'glass' | 'emerald' | 'gold';
  to?: string;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

// Generate the traditional Asian / Japanese cartouche stepped corner SVG path
function generateCartouchePath(w: number, h: number, step: number, radius: number): string {
  if (w <= 0 || h <= 0) return '';
  const s = Math.min(step, h / 4, w / 4);
  const r = Math.min(radius, s, (h - 2 * s) / 2);
  
  // Clamped coordinates
  const x1 = s + r;
  const x2 = w - s - r;
  const x3 = w - s;
  const x4 = w - r;
  const x5 = w;

  const y1 = r;
  const y2 = s;
  const y3 = s + r;
  const y4 = h - s - r;
  const y5 = h - s;
  const y6 = h - r;
  const y7 = h;

  return [
    `M ${x1} 0`,
    `L ${x2} 0`,
    `A ${r} ${r} 0 0 1 ${x3} ${y1}`,
    `L ${x3} ${y2}`,
    `L ${x4} ${y2}`,
    `A ${r} ${r} 0 0 1 ${x5} ${y3}`,
    `L ${x5} ${y4}`,
    `A ${r} ${r} 0 0 1 ${x4} ${y5}`,
    `L ${x3} ${y5}`,
    `L ${x3} ${y6}`,
    `A ${r} ${r} 0 0 1 ${x2} ${y7}`,
    `L ${x1} ${y7}`,
    `A ${r} ${r} 0 0 1 ${s} ${y6}`,
    `L ${s} ${y5}`,
    `L ${r} ${y5}`,
    `A ${r} ${r} 0 0 1 0 ${y4}`,
    `L 0 ${y3}`,
    `A ${r} ${r} 0 0 1 ${r} ${y2}`,
    `L ${s} ${y2}`,
    `L ${s} ${y1}`,
    `A ${r} ${r} 0 0 1 ${x1} 0`,
    'Z'
  ].join(' ');
}

export const CartoucheButton: React.FC<CartoucheButtonProps> = ({
  children,
  variant = 'crimson',
  to,
  href,
  onClick,
  className = '',
  ariaLabel,
  type = 'button',
  disabled = false,
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Measure exact bounding box to render crisp, undistorted SVG path
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  // Use measured or sensible default dimensions
  const w = dimensions.width || 180;
  const h = dimensions.height || 42;

  // Corner step and radius scale proportionally with height for grand plaques and normal buttons
  const step = Math.max(5.5, Math.round(h * 0.12));
  const radius = Math.max(3.5, Math.round(h * 0.08));
  const outerPath = generateCartouchePath(w, h, step, radius);

  // Inlay double border (inset scales from 2.5px up to 4px for large plaques)
  const inset = Math.max(2.5, Math.min(4, Math.round(h * 0.05)));
  const innerW = Math.max(0, w - inset * 2);
  const innerH = Math.max(0, h - inset * 2);
  const innerPath = generateCartouchePath(innerW, innerH, Math.max(2, step - 1.5), Math.max(1.5, radius - 1));

  // Color configurations based on Image 1 (Madame Lân red lacquer & gold/cream border)
  const isCrimson = variant === 'crimson';
  const isGlass = variant === 'glass';
  const isEmerald = variant === 'emerald';
  const isGold = variant === 'gold';

  const gradientId = `cartouche-grad-${variant}-${Math.random().toString(36).substring(2, 7)}`;

  const svgBackground = (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300"
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: isCrimson
          ? 'drop-shadow(0 2px 6px rgba(132, 20, 29, 0.35))'
          : isGlass
          ? 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4))'
          : isGold
          ? 'drop-shadow(0 2px 6px rgba(201, 155, 73, 0.25))'
          : 'drop-shadow(0 2px 6px rgba(14, 122, 50, 0.35))',
      }}
    >
      <defs>
        {isCrimson && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9C1E26" />
            <stop offset="50%" stopColor="#84141D" />
            <stop offset="100%" stopColor="#6C0F16" />
          </linearGradient>
        )}
        {isGlass && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(35, 40, 50, 0.78)" />
            <stop offset="100%" stopColor="rgba(18, 22, 30, 0.88)" />
          </linearGradient>
        )}
        {isEmerald && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#127F38" />
            <stop offset="50%" stopColor="#0E7A32" />
            <stop offset="100%" stopColor="#075220" />
          </linearGradient>
        )}
        {isGold && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF4C7" />
            <stop offset="50%" stopColor="#F7CE65" />
            <stop offset="100%" stopColor="#DF9F28" />
          </linearGradient>
        )}
      </defs>

      {/* 1. Main outer cartouche fill */}
      <path
        d={outerPath}
        fill={`url(#${gradientId})`}
        stroke={
          isCrimson
            ? '#B82830'
            : isGlass
            ? 'rgba(255, 255, 255, 0.35)'
            : isGold
            ? '#C99B49'
            : '#22C55E'
        }
        strokeWidth="1.2"
      />

      {/* 2. Inlay traditional gold/cream double border */}
      <g transform={`translate(${inset}, ${inset})`}>
        <path
          d={innerPath}
          fill="none"
          stroke={isGold ? '#D8B168' : '#FCEBC2'}
          strokeWidth="1.1"
          strokeOpacity={isGlass ? '0.85' : isGold ? '0.75' : '0.92'}
        />
      </g>
    </svg>
  );

  const sharedClasses = `relative inline-flex items-center justify-center select-none cursor-pointer transition-all duration-300 group hover:brightness-110 active:scale-[0.98] font-label ${
    disabled ? 'opacity-50 pointer-events-none' : ''
  } ${className}`;

  if (to) {
    return (
      <Link
        to={to}
        ref={containerRef as React.RefObject<HTMLAnchorElement>}
        className={sharedClasses}
        aria-label={ariaLabel}
      >
        {svgBackground}
        <span className="relative z-10 flex items-center justify-center gap-2 px-4 py-2">
          {children}
        </span>
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        ref={containerRef as React.RefObject<HTMLAnchorElement>}
        className={sharedClasses}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {svgBackground}
        <span className="relative z-10 flex items-center justify-center gap-2 px-4 py-2">
          {children}
        </span>
      </a>
    );
  }

  return (
    <button
      type={type}
      ref={containerRef as React.RefObject<HTMLButtonElement>}
      onClick={onClick}
      disabled={disabled}
      className={sharedClasses}
      aria-label={ariaLabel}
    >
      {svgBackground}
      <span className="relative z-10 flex items-center justify-center gap-2 px-4 py-2">
        {children}
      </span>
    </button>
  );
};
