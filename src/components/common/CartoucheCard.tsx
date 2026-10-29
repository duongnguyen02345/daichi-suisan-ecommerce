import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';

export interface CartoucheCardProps {
  children: React.ReactNode;
  variant?: 'cream' | 'navy' | 'crimson' | 'white';
  className?: string;
  innerClassName?: string;
  step?: number;
  radius?: number;
  style?: React.CSSProperties;
}

function generateCartouchePath(w: number, h: number, step: number, radius: number): string {
  if (w <= 0 || h <= 0) return '';
  const s = Math.min(step, h / 4, w / 4);
  const r = Math.min(radius, s, (h - 2 * s) / 2);
  
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

export const CartoucheCard: React.FC<CartoucheCardProps> = ({
  children,
  variant = 'cream',
  className = '',
  innerClassName = '',
  step = 8,
  radius = 6,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  const w = dimensions.width || 300;
  const h = dimensions.height || 200;

  const outerPath = generateCartouchePath(w, h, step, radius);

  const inset = 3.5;
  const innerW = Math.max(0, w - inset * 2);
  const innerH = Math.max(0, h - inset * 2);
  const innerPath = generateCartouchePath(innerW, innerH, Math.max(2, step - inset * 0.7), Math.max(2, radius - inset * 0.5));

  const isCream = variant === 'cream';
  const isNavy = variant === 'navy';
  const isCrimson = variant === 'crimson';

  const gradientId = `cart-card-grad-${variant}-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={style}
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300"
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: isCrimson
            ? 'drop-shadow(0 4px 12px rgba(132, 20, 29, 0.25))'
            : isNavy
            ? 'drop-shadow(0 4px 14px rgba(16, 47, 73, 0.35))'
            : 'drop-shadow(0 4px 14px rgba(45, 25, 10, 0.08))',
        }}
      >
        <defs>
          {isCream && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF7" />
              <stop offset="60%" stopColor="#FFF8E8" />
              <stop offset="100%" stopColor="#F5E8C7" />
            </linearGradient>
          )}
          {isNavy && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#153B5B" />
              <stop offset="100%" stopColor="#0B2338" />
            </linearGradient>
          )}
          {isCrimson && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A82026" />
              <stop offset="60%" stopColor="#84141D" />
              <stop offset="100%" stopColor="#6C0F16" />
            </linearGradient>
          )}
          {variant === 'white' && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFFDF9" />
            </linearGradient>
          )}
        </defs>

        {/* 1. Main outer contour */}
        <path
          d={outerPath}
          fill={`url(#${gradientId})`}
          stroke={isCrimson ? '#C42B2D' : isNavy ? '#C99B49' : '#C99B49'}
          strokeWidth="1.5"
        />

        {/* 2. Inlay double border */}
        <g transform={`translate(${inset}, ${inset})`}>
          <path
            d={innerPath}
            fill="none"
            stroke={isCrimson ? '#F8E2A8' : isNavy ? '#E5CF9E' : '#E0B96C'}
            strokeWidth="1.1"
            strokeOpacity={isNavy ? '0.7' : '0.85'}
          />
        </g>
      </svg>

      <div className={`relative z-10 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};
