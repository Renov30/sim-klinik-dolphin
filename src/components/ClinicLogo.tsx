'use client';

import React from 'react';

interface ClinicLogoProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export default function ClinicLogo({
  name,
  size = 'md',
  className = '',
  showText = true,
}: ClinicLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const svgSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Dolphin e-Clinic Logo Icon */}
      <div
        className={`${iconSizes[size]} shrink-0 flex items-center justify-center relative bg-emerald-600 shadow-xs`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${svgSizes[size]} relative z-10`}
        >
          {/* Leaping Dolphin Body */}
          <path
            fill="white"
            d="M30.584 7.854c.27-1.729 1.028-3.908 2.975-5.854.704-.704.25-2-1-2 0 0-6.061.007-9.893 3.327C21.663 3.115 20.625 3 19.559 3c-8 0-12 4-14 12-.444 1.778-.865 1.399-3 3-1.195.896-2.117 3 1 3 3 0 5 .954 9 1 3.629.042 9.504-3.229 11.087-1.292 2.211 2.706 1.396 5.438.597 6.666-2.904 3.396-5.939.541-8.685-.374-3-1-1 1 0 2s1.312 4 0 6 3 0 5-3c.011-.017.022-.028.032-.045C28.392 31.5 34.559 25.936 34.559 18c0-3.918-1.515-7.474-3.975-10.146z"
          />
          {/* Eye */}
          <circle fill="#065f46" cx="13.117" cy="14" r="1.6" />
          {/* Soft Mint Underbelly Accent */}
          <path
            fill="#a7f3d0"
            d="M10.396 21.896s4-.876 7.167-2.688c4.625-2.646 7.26-2.594 8.885-.823s1.99 6.594-2.885 9.677c2.604-2.75 1.146-8.349-2.014-7.588-8.153 1.964-8.903 1.547-11.153 1.422z"
          />
          {/* Flipper Accent */}
          <path
            fill="#d1fae5"
            d="M19.383 17.744l-2.922 1.285c-.254.064-.433.3-.412.561.122 1.504.756 3.625 2.263 4.629 2.354 1.569 2.367 1.897 3 0 .768-2.303-.182-4.462-1.333-6.24-.127-.196-.37-.293-.596-.235z"
          />
          {/* Medical Plus Accent */}
          <path
            d="M32 11V8M30.5 9.5H33.5"
            stroke="#a7f3d0"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={`${textSizes[size]} font-extrabold tracking-tight text-slate-800 leading-none truncate`}
            title={name}
          >
            {name}
          </span>
        </div>
      )}
    </div>
  );
}

