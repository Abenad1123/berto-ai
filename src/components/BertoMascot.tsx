import React from 'react';

interface BertoMascotProps {
  className?: string;
  variant?: 'happy' | 'sparkle' | 'winking';
}

export const BertoMascot: React.FC<BertoMascotProps> = ({
  className = 'w-8 h-8',
  variant = 'happy',
}) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Mascot Head Body - Playful Smart Brain Outline */}
      <path
        d="M24 10C17 10 12 15 12 21C9.5 21.5 7.5 23.5 7.5 26.5C7.5 29.5 9.5 32 12.5 32.5C13 36.5 17 40 22 40C23 40 24 39.8 24.5 39.5C25 39.8 26 40 27 40C32 40 36 36.5 36.5 32.5C39.5 32 41.5 29.5 41.5 26.5C41.5 23.5 39.5 21.5 37 21C37 15 32 10 24 10Z"
        fill="currentColor"
        stroke="#09090b"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Internal Cerebral Folds (Subtle White/Transparent Lines) */}
      <path
        d="M24 13V22M19 16C17 18 17 21 19 23M29 16C31 18 31 21 29 23"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Golden Sparkle / Antenna on Top */}
      <path
        d="M24 3L25.8 7.2L30 9L25.8 10.8L24 15L22.2 10.8L18 9L22.2 7.2L24 3Z"
        fill="#f59e0b"
        stroke="#09090b"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Expressive Cartoon Eyes */}
      {variant === 'winking' ? (
        <>
          {/* Left Eye: Big & Shiny */}
          <ellipse cx="19" cy="27" rx="3" ry="4" fill="#09090b" />
          <circle cx="20" cy="25.5" r="1.2" fill="#ffffff" />
          {/* Right Eye: Wink Arc */}
          <path
            d="M28 27C29 25 32 25 33 27"
            stroke="#09090b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* Left Eye */}
          <ellipse cx="19" cy="27" rx="3" ry="4" fill="#09090b" />
          <circle cx="20" cy="25.5" r="1.3" fill="#ffffff" />
          <circle cx="18" cy="28.5" r="0.6" fill="#ffffff" />

          {/* Right Eye */}
          <ellipse cx="29" cy="27" rx="3" ry="4" fill="#09090b" />
          <circle cx="30" cy="25.5" r="1.3" fill="#ffffff" />
          <circle cx="28" cy="28.5" r="0.6" fill="#ffffff" />
        </>
      )}

      {/* Cute Rosy Cheeks */}
      <circle cx="14" cy="30" r="2.2" fill="#f43f5e" opacity="0.75" />
      <circle cx="34" cy="30" r="2.2" fill="#f43f5e" opacity="0.75" />

      {/* Cheerful Smile */}
      <path
        d="M21 31C22.5 33 25.5 33 27 31"
        stroke="#09090b"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
