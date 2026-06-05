export default function HeroBanner({ businessName = "Your Business" }) {
  return (
    <div
      className="relative rounded-2xl px-8 py-4 mb-8 overflow-hidden"
      style={{
        background: "linear-gradient(120deg, #1a1756 0%, #1e1b6e 40%, #2d1b8e 70%, #1a0f4e 100%)",
      }}
    >
      {/* Subtle dot decoration */}
      <div className="absolute top-3 right-32 w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-60" />
      <div className="absolute bottom-4 left-40 w-1.5 h-1.5 rounded-full bg-violet-400 opacity-50" />
      <div className="absolute top-5 left-1/2 w-1 h-1 rounded-full bg-blue-300 opacity-40" />

      {/* Three-column layout: icon | text | icon */}
      <div className="flex items-center justify-between gap-6">

        {/* Left — chart icon box */}
        <div
          className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.3)" }}
        >
          {/* Bar chart + line SVG */}
          <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11" xmlns="http://www.w3.org/2000/svg">
            {/* Bars */}
            <rect x="6"  y="28" width="7" height="14" rx="1.5" fill="#6366f1" opacity="0.9"/>
            <rect x="16" y="20" width="7" height="22" rx="1.5" fill="#818cf8" opacity="0.9"/>
            <rect x="26" y="12" width="7" height="30" rx="1.5" fill="#10b981" opacity="0.9"/>
            {/* Trend line */}
            <path d="M6 26 L20 16 L34 8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Arrow tip */}
            <path d="M30 6 L34 8 L32 12" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Center — text */}
        <div className="flex-1 text-center">
          <p className="text-white text-base font-semibold mb-1 leading-snug">
            Ready to empower your business,
          </p>
          <h2
            className="text-xl font-black mb-3 leading-tight"
            style={{
              background: "linear-gradient(90deg, #34d399 0%, #6ee7b7 50%, #2dd4bf 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {businessName} ?
          </h2>
          <p className="text-indigo-200 text-xs leading-relaxed max-w-sm mx-auto">
            Boost your visibility, connect with more customers,<br />
            and expand your business opportunities with our powerful platform.
          </p>
        </div>

        {/* Right — megaphone icon box */}
        <div
          className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.20)", border: "1px solid rgba(99,102,241,0.25)" }}
        >
          {/* Megaphone SVG */}
          <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11" xmlns="http://www.w3.org/2000/svg">
            {/* Megaphone body */}
            <path d="M8 18 L8 30 L14 30 L14 18 Z" fill="#6366f1" opacity="0.8" rx="1"/>
            <path d="M14 14 L36 6 L36 42 L14 34 Z" fill="#818cf8" opacity="0.85"/>
            {/* Bell mouth */}
            <path d="M36 10 Q44 24 36 38" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M36 16 Q41 24 36 32" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" fill="none"/>
            {/* Handle / cord */}
            <path d="M10 30 L10 38 Q10 42 14 42 Q18 42 18 38 L18 34" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            {/* Sound dots */}
            <circle cx="42" cy="18" r="1.5" fill="#34d399" opacity="0.8"/>
            <circle cx="44" cy="24" r="1.5" fill="#34d399" opacity="0.6"/>
            <circle cx="42" cy="30" r="1.5" fill="#34d399" opacity="0.8"/>
          </svg>
        </div>
      </div>
    </div>
  );
}