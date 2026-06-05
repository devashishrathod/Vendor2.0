import { useState } from "react";
import HeroBanner          from "./HeroBanner";
import PlanTabs            from "./PlanTabs";
import PlanPriceCard       from "./PlanPriceCard";
import PlanComparisonTable from "./Plancomparisontable";

const BUBBLES = [
  [110, '8%',  '6%',  'rgba(16,185,129,0.12)', 6,   0  ],
  [70,  '18%', '28%', 'rgba(99,102,241,0.11)',  8,   1  ],
  [90,  '42%', '3%',  'rgba(244,63,94,0.10)',   7,   2  ],
  [60,  '18%', '82%', 'rgba(20,184,166,0.12)',  9,   0.5],
  [80,  '12%', '62%', 'rgba(245,158,11,0.10)',  7.5, 3  ],
  [45,  '75%', '12%', 'rgba(16,185,129,0.13)',  5.5, 1.5],
  [50,  '55%', '22%', 'rgba(139,92,246,0.11)',  10,  2.5],
  [65,  '70%', '72%', 'rgba(99,102,241,0.10)',  8.5, 1  ],
  [40,  '85%', '45%', 'rgba(244,63,94,0.10)',   6.5, 3.5],
  [55,  '30%', '88%', 'rgba(16,185,129,0.11)',  7,   0.8],
  [35,  '60%', '55%', 'rgba(245,158,11,0.09)',  9.5, 2  ],
  [75,  '88%', '30%', 'rgba(139,92,246,0.10)',  8,   1.2],
];

export default function SubscriptionPlan({ businessName = "Yoga Education and Research Pvt Ltd" }) {
  const [selectedPlan, setSelectedPlan] = useState("advanced");

  const handlePurchase = (plan) => {
    console.log("Purchase:", plan);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <style>{`
        .sp-bubble {
          position: absolute;
          border-radius: 50%;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          border: 1.5px solid rgba(255,255,255,0.55);
          pointer-events: none;
          animation: spFloat ease-in-out infinite;
        }
        @keyframes spFloat {
          0%,100% { transform: translateY(0px) scale(1); }
          50%      { transform: translateY(-14px) scale(1.03); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Green glow bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(16,185,129,0.15) 0%, transparent 70%)' }}
      />

      {/* Bubbles */}
      {BUBBLES.map(([size, top, left, bg, dur, delay], i) => (
        <div key={i} className="sp-bubble" style={{
          width: size, height: size, top, left, background: bg,
          boxShadow: `inset 0 0 ${size * 0.15}px ${bg}, 0 4px ${size * 0.2}px ${bg}`,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
        }} />
      ))}

      {/* ── Page content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-6">

        {/* ── Header ── */}
        <div
          className="text-center "
          style={{ animation: "slideDown 0.5s ease both" }}
        >
          {/* Pill badge */}
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full ">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Choose Your Plan
          </span>

          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-2">
            Subscription Plan
          </h1>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Enjoy enhanced benefits, exclusive content, and priority support with your subscription.
          </p>
        </div>

        {/* ── Hero banner ── */}
        <div style={{ animation: "fadeUp 0.5s 0.1s ease both", opacity: 0 }}>
          <HeroBanner businessName={businessName} />
        </div>

        {/* ── Tabs ── */}
        <div
          className="mt-8 mb-2"
          style={{ animation: "fadeUp 0.5s 0.2s ease both", opacity: 0 }}
        >
          <PlanTabs selected={selectedPlan} onChange={setSelectedPlan} />
        </div>

        {/* ── Price card — animates on tab change ── */}
        <div
          key={selectedPlan}
          style={{ animation: "fadeUp 0.3s ease both" }}
        >
          <PlanPriceCard selectedId={selectedPlan} onPurchase={handlePurchase} />
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <span className="text-xs text-gray-400 font-medium tracking-widest uppercase px-2">Compare Plans</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* ── Comparison table ── */}
        <div style={{ animation: "fadeUp 0.5s 0.3s ease both", opacity: 0 }}>
          <PlanComparisonTable selectedId={selectedPlan} />
        </div>

        {/* ── Footer note ── */}
        <p className="text-center text-xs text-gray-400 mt-10">
          All plans include GST · Secure payment · Cancel anytime
        </p>
      </div>
    </div>
  );
}