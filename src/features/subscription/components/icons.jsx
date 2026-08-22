import React from 'react';

// Small, stroke-based icon set — intentionally generic/minimal so it's easy
// to swap for an icon library (lucide-react, etc.) later. All icons accept
// standard SVG props (size via width/height, color via `stroke`).

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function ArrowLeftIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function PrintIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

export function DownloadIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function CheckCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckSquareIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  );
}

export function ReceiptIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 2h12v19l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V2z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

export function SwapIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8h13l-3-3m3 3l-3 3" />
      <path d="M20 16H7l3 3m-3-3l3-3" />
    </svg>
  );
}

export function LayersIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
    </svg>
  );
}

export function FranchiseIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l3 4h-6l3-4z" />
      <path d="M12 7v3M6 21v-6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
      <path d="M3 21h18M9 21v-4M15 21v-4" />
    </svg>
  );
}

export function VerifiedIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12l2.3 2.3L15.5 9" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function XCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export const BENEFIT_ICON_MAP = {
  checkSquare: CheckSquareIcon,
  receipt: ReceiptIcon,
  swap: SwapIcon,
  layers: LayersIcon,
  franchise: FranchiseIcon,
  verified: VerifiedIcon,
};
