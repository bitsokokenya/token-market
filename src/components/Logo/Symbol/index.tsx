import React from 'react';

const SeedleSymbol = ({ theme }: any) => {
  if (theme === 'dark') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 45 45"
        width="45"
        height="45"
      >
        <defs>
          <linearGradient id="themeGradientDark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F5F76" />
            <stop offset="100%" stopColor="#0F5F76" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        {/* Background Coin */}
        <circle
          cx="22.5"
          cy="22.5"
          r="20"
          fill="url(#themeGradientDark)"
          stroke="#083B50"
          strokeWidth="2"
        />
        {/* Subtle Grid for Financial Data */}
        <g stroke="#89CFF0" strokeWidth="1" opacity="0.3">
          <line x1="10" y1="15" x2="35" y2="15" />
          <line x1="10" y1="22" x2="35" y2="22" />
          <line x1="10" y1="30" x2="35" y2="30" />
          <line x1="15" y1="10" x2="15" y2="35" />
          <line x1="25" y1="10" x2="25" y2="35" />
        </g>
        {/* Upward Trend Arrow with Candlestick Bars */}
        <g
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="12" y="26" width="2" height="6" fill="#43d351" />
          <rect x="18" y="20" width="2" height="12" fill="#43d351" />
          <rect x="24" y="14" width="2" height="16" fill="#43d351" />
          <rect x="30" y="18" width="2" height="12" fill="#43d351" />
          <path d="M12 30 L18 24 L24 16 L30 20 L33 12" fill="none" />
        </g>
        {/* Arrowhead */}
        <polygon points="33,8 37,12 33,12" fill="#ffffff" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 45 45"
      width="45"
      height="45"
    >
      <defs>
        <linearGradient id="themeGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F5F76" />
          <stop offset="100%" stopColor="#0F5F76" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Background Coin */}
      <circle
        cx="22.5"
        cy="22.5"
        r="20"
        fill="url(#themeGradient)"
        stroke="#0A4A5B"
        strokeWidth="2"
      />
      {/* Grid for financial data */}
      <g stroke="#89CFF0" strokeWidth="1" opacity="0.5">
        <line x1="10" y1="15" x2="35" y2="15" />
        <line x1="10" y1="22" x2="35" y2="22" />
        <line x1="10" y1="30" x2="35" y2="30" />
        <line x1="15" y1="10" x2="15" y2="35" />
        <line x1="25" y1="10" x2="25" y2="35" />
      </g>
      {/* Upward Trend Arrow with Candlestick Bars */}
      <g
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Candlestick bars */}
        <rect x="12" y="26" width="2" height="6" fill="#43d351" />
        <rect x="18" y="20" width="2" height="12" fill="#43d351" />
        <rect x="24" y="14" width="2" height="16" fill="#43d351" />
        <rect x="30" y="18" width="2" height="12" fill="#43d351" />
        {/* Trend line */}
        <path d="M12 30 L18 24 L24 16 L30 20 L33 12" fill="none" />
      </g>
      {/* Arrowhead */}
      <polygon points="33,8 37,12 33,12" fill="#ffffff" />
    </svg>
  );
};

export default SeedleSymbol;
