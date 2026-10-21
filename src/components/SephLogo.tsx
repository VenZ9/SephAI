import React from 'react';

interface SephLogoProps {
  className?: string;
  size?: number;
}

export const SephLogo: React.FC<SephLogoProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(-28, -11)">
        {/* Neural connectors */}
        <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.35">
          <line x1="60" y1="50" x2="90" y2="70" />
          <line x1="170" y1="80" x2="140" y2="100" />
          <line x1="190" y1="130" x2="140" y2="100" />
          <line x1="50" y1="150" x2="80" y2="130" />
          <line x1="160" y1="170" x2="130" y2="160" />
        </g>

        {/* S-shaped neural path */}
        <path
          d="M 90 70 C 120 70, 140 80, 140 100 C 140 120, 90 120, 80 130 C 70 140, 110 160, 130 160"
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Core network nodes */}
        <circle cx="90" cy="70" r="14" fill="currentColor" />
        <circle cx="140" cy="100" r="18" fill="currentColor" />
        <circle cx="80" cy="130" r="18" fill="currentColor" />
        <circle cx="130" cy="160" r="14" fill="currentColor" />

        {/* Orbiting satellite nodes */}
        <circle cx="60" cy="50" r="5" fill="currentColor" opacity="0.85" />
        <circle cx="170" cy="80" r="7" fill="currentColor" opacity="0.9" />
        <circle cx="160" cy="170" r="6" fill="currentColor" opacity="0.9" />
        <circle cx="50" cy="150" r="8" fill="currentColor" opacity="0.75" />
        <circle cx="190" cy="130" r="5" fill="currentColor" opacity="0.85" />
      </g>
    </svg>
  );
};
