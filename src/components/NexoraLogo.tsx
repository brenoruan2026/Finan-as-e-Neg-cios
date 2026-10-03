import React from 'react';

interface NexoraLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  variant?: 'mark' | 'full' | 'badge';
  theme?: 'dark' | 'light' | 'auto';
  showSubtitle?: boolean;
  subtitleText?: string;
  onClick?: () => void;
}

export const NexoraLogo: React.FC<NexoraLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'auto',
  showSubtitle = true,
  subtitleText = 'Gestão Empresarial',
  onClick,
}) => {
  // Dimension mapping
  const sizeMap: Record<string, { iconSize: number; textClass: string; subClass: string; badgePadding: string }> = {
    xs: { iconSize: 22, textClass: 'text-[11px]', subClass: 'text-[8px]', badgePadding: 'p-1' },
    sm: { iconSize: 28, textClass: 'text-xs', subClass: 'text-[9px]', badgePadding: 'p-1.5' },
    md: { iconSize: 36, textClass: 'text-sm', subClass: 'text-[10px]', badgePadding: 'p-2' },
    lg: { iconSize: 48, textClass: 'text-lg', subClass: 'text-xs', badgePadding: 'p-2.5' },
    xl: { iconSize: 64, textClass: 'text-2xl', subClass: 'text-sm', badgePadding: 'p-3' },
    '2xl': { iconSize: 84, textClass: 'text-3xl', subClass: 'text-sm', badgePadding: 'p-4' },
  };

  const currentSize = typeof size === 'number'
    ? { iconSize: size, textClass: 'text-sm', subClass: 'text-[10px]', badgePadding: 'p-2' }
    : sizeMap[size] || sizeMap.md;

  const rawId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradMainId = `nexoraGradMain_${rawId}`;
  const gradArcId = `nexoraGradArc_${rawId}`;
  const shineId = `nexoraShine_${rawId}`;

  const svgContent = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={currentSize.iconSize}
      height={currentSize.iconSize}
      className="shrink-0 transition-transform duration-200"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Metallic gradient 1 (Stem & Diagonal to Loop) */}
        <linearGradient id={gradMainId} x1="15%" y1="20%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#070c18" />
          <stop offset="25%" stopColor="#0c2356" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="75%" stopColor="#2563eb" />
          <stop offset="90%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Metallic gradient 2 (Upper G Arc) */}
        <linearGradient id={gradArcId} x1="20%" y1="80%" x2="90%" y2="20%">
          <stop offset="0%" stopColor="#0a1022" />
          <stop offset="35%" stopColor="#1e3a8a" />
          <stop offset="65%" stopColor="#2563eb" />
          <stop offset="85%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>

        {/* Glossy metallic shine highlight */}
        <linearGradient id={shineId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Clean Pure White Background Container */}
      <rect width="100%" height="100%" rx="90" fill="#ffffff" />

      {/* Left vertical line of N with sharp cut at top */}
      <path
        d="M 148 190 L 160 205 L 160 305 L 148 305 Z"
        fill={`url(#${gradMainId})`}
      />

      {/* Main ribbon: Top-left diagonal of N cascading down and looping into G's bowl & crossbar */}
      <path
        d="M 148 190 
           L 230 270 
           C 260 298 292 312 325 292 
           C 345 280 354 260 354 246
           L 354 244
           L 285 244
           L 285 254
           L 342 254
           C 340 266 332 278 318 284
           C 292 296 264 282 238 258
           L 172 190
           Z"
        fill={`url(#${gradMainId})`}
      />

      {/* Top crescent arch of G with sharp tail */}
      <path
        d="M 235 252
           C 246 220 275 192 322 192
           C 342 192 355 198 365 208
           L 357 215
           C 348 206 338 202 322 202
           C 285 202 258 226 246 254
           Z"
        fill={`url(#${gradArcId})`}
      />

      {/* Subtle spine shine on the dynamic loop for high-fidelity metallic sheen */}
      <path
        d="M 160 202 
           L 234 265 
           C 262 288 290 300 320 286"
        stroke={`url(#${shineId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center bg-white rounded-2xl shadow-md border border-slate-200/80 p-1 transition-transform hover:scale-105 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {svgContent}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="rounded-xl overflow-hidden shadow-xs ring-1 ring-white/10 shrink-0">
        {svgContent}
      </div>

      {variant === 'full' && (
        <div className="flex flex-col leading-tight min-w-0">
          <span
            className={`font-black tracking-wider text-slate-900 dark:text-white ${currentSize.textClass} truncate`}
          >
            NEXORA GROUP
          </span>
          {showSubtitle && (
            <span
              className={`font-semibold uppercase tracking-widest text-sky-500 dark:text-sky-400 ${currentSize.subClass} truncate`}
            >
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
