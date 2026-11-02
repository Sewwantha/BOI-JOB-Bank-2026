import React from 'react';

interface LogoProps {
  className?: string;
}

const JobBankLogo: React.FC<LogoProps> = ({ className = 'h-8 w-8' }) => {
  return (
    <svg
      viewBox="0 0 100 110"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Metallic Gold Linear Gradient */}
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6e4a6" />
          <stop offset="35%" stopColor="#d4af37" />
          <stop offset="70%" stopColor="#b8860b" />
          <stop offset="100%" stopColor="#f6e4a6" />
        </linearGradient>
      </defs>
      
      <g stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {/* MIDDLE COBRA */}
        {/* Head */}
        <ellipse cx="50" cy="16" rx="9" ry="6.5" />
        {/* Eyes */}
        <circle cx="46.5" cy="16" r="1.1" fill="url(#goldGradient)" />
        <circle cx="53.5" cy="16" r="1.1" fill="url(#goldGradient)" />
        {/* Hood Outlines */}
        <path d="M 46 45 C 44 38, 35 34, 38 24 C 39 19, 41.5 17.5, 42.5 17" />
        <path d="M 54 45 C 56 38, 65 34, 62 24 C 61 19, 58.5 17.5, 57.5 17" />
        {/* Neck Stripes */}
        <path d="M 48 45 L 48 29 C 48 24, 46 22, 45.5 21" />
        <path d="M 52 45 L 52 29 C 52 24, 54 22, 54.5 21" />

        {/* LEFT COBRA */}
        {/* Head */}
        <ellipse cx="28" cy="23" rx="8" ry="6" transform="rotate(-15 28 23)" />
        {/* Eyes */}
        <circle cx="25.5" cy="22" r="1" fill="url(#goldGradient)" />
        <circle cx="30.5" cy="24" r="1" fill="url(#goldGradient)" />
        {/* Hood Outlines */}
        <path d="M 33 45 C 29 42, 17 38, 19 28 C 20 23, 22.5 21, 23.5 20.5" />
        <path d="M 39 45 C 36 41, 28 35, 29 27 C 29 25, 29.5 23.5, 29.5 23" />
        {/* Neck Stripe */}
        <path d="M 36 45 C 33 41, 24 33, 25.5 25" />

        {/* RIGHT COBRA */}
        {/* Head */}
        <ellipse cx="72" cy="23" rx="8" ry="6" transform="rotate(15 72 23)" />
        {/* Eyes */}
        <circle cx="69.5" cy="24" r="1" fill="url(#goldGradient)" />
        <circle cx="74.5" cy="22" r="1" fill="url(#goldGradient)" />
        {/* Hood Outlines */}
        <path d="M 67 45 C 71 42, 83 38, 81 28 C 80 23, 77.5 21, 76.5 20.5" />
        <path d="M 61 45 C 64 41, 72 35, 71 27 C 71 25, 70.5 23.5, 70.5 23" />
        {/* Neck Stripe */}
        <path d="M 64 45 C 67 41, 76 33, 74.5 25" />

        {/* DIAMOND BASE */}
        {/* Top Horizontal Edge */}
        <path d="M 35 45 L 65 45" />
        {/* Girdle Horizontal Line */}
        <path d="M 20 55 L 80 55" />
        {/* Girdle to Pavilion tip */}
        <path d="M 20 55 L 50 95 L 80 55" />
        {/* Upper Facets Outer */}
        <path d="M 20 55 L 35 45 M 80 55 L 65 45" />
        {/* Facet lines connecting to Pavilion tip */}
        <path d="M 38 55 L 50 95" />
        <path d="M 62 55 L 50 95" />
        <path d="M 50 55 L 50 95" />
        {/* Crown Facets Triangles */}
        <path d="M 35 45 L 50 55 L 65 45" />
        <path d="M 35 45 L 38 55 L 50 55 L 62 55 L 65 45" />
        <path d="M 20 55 L 38 55 M 80 55 L 62 55" />
        <path d="M 50 45 L 50 55" />
      </g>
    </svg>
  );
};

export default JobBankLogo;
