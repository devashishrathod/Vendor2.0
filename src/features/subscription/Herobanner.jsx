import { BarChart3, Megaphone } from "lucide-react";

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

      <div className="flex items-center justify-between gap-6">

        {/* Left — BarChart3 icon */}
        <div
          className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.3)" }}
        >
          <BarChart3 size={44} color="#34d399" strokeWidth={1.5} />
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
            {businessName}
          </h2>
          <p className="text-indigo-200 text-xs leading-relaxed max-w-sm mx-auto">
            Boost your visibility, connect with more customers,<br />
            and expand your business opportunities with our powerful platform.
          </p>
        </div>

        {/* Right — Megaphone icon */}
        <div
          className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.20)", border: "1px solid rgba(99,102,241,0.25)" }}
        >
          <Megaphone size={44} color="#a5b4fc" strokeWidth={1.5} />
        </div>

      </div>
    </div>
  );
}