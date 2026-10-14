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
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 4-Color Geometric Pelio-Style Logo Icon */}
      <div className={`${iconSizes[size]} shrink-0 flex items-center justify-center relative`}>
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Top Leaf - Cyan / Sky */}
          <path
            d="M18 3.5C18 3.5 22.5 9.5 22.5 13.5C22.5 16 20.5 17.5 18 17.5C15.5 17.5 13.5 16 13.5 13.5C13.5 9.5 18 3.5 18 3.5Z"
            fill="#0ea5e9"
          />
          {/* Right Leaf - Amber / Yellow */}
          <path
            d="M32.5 18C32.5 18 26.5 22.5 22.5 22.5C20 22.5 18.5 20.5 18.5 18C18.5 15.5 20 13.5 22.5 13.5C26.5 13.5 32.5 18 32.5 18Z"
            fill="#f59e0b"
          />
          {/* Bottom Leaf - Coral / Rose */}
          <path
            d="M18 32.5C18 32.5 13.5 26.5 13.5 22.5C13.5 20 15.5 18.5 18 18.5C20.5 18.5 22.5 20 22.5 22.5C22.5 26.5 18 32.5 18 32.5Z"
            fill="#f43f5e"
          />
          {/* Left Leaf - Emerald Green */}
          <path
            d="M3.5 18C3.5 18 9.5 13.5 13.5 13.5C16 13.5 17.5 15.5 17.5 18C17.5 20.5 16 22.5 13.5 22.5C9.5 22.5 3.5 18 3.5 18Z"
            fill="#10b981"
          />
          {/* Center core white circle */}
          <circle cx="18" cy="18" r="3" fill="white" />
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

