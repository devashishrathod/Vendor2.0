import React from 'react';

// Placeholder wordmark so the invoice has *something* in the logo slot.
// Swap this for `<img src="/your-logo.svg" />` once you have real brand
// assets — nothing else in InvoiceCard depends on this being an SVG.
export default function BrandLogo({ name = 'Your Brand', size = 40 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="19" stroke="#10b981" strokeWidth="2" />
        <path
          d="M12 22c2-4 4-6 8-6s6 2 8 6"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="20" cy="24" r="3" fill="#10b981" />
      </svg>
      <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>{name}</span>
    </div>
  );
}
