import { useState, useEffect } from "react";
import HeroBanner from "./HeroBanner";
import PlanTabs from "./PlanTabs";
import PlanPriceCard from "./PlanPriceCard";
import PlanComparisonTable from "./PlanComparisonTable";
import { useNavigate } from "react-router-dom";
import { useBlockBack } from "@/hooks/useBlockBack";
import { useLogout } from "@/hooks/useLogout"; // ← path apne project ke hisaab se adjust karo

export default function SubscriptionPlan({
  businessName: propBusinessName = "Yoga Education and Research Pvt Ltd",
}) {
  useBlockBack();
  const navigate = useNavigate();
  const { handleLogout } = useLogout(); // ← hook se lo

  const [selectedPlan, setSelectedPlan] = useState("advanced");
  const [businessName, setBusinessName] = useState(propBusinessName);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("onboarding-store");
      if (raw) {
        const parsed = JSON.parse(raw);
        const name =
          parsed?.state?.formData?.businessName ||
          parsed?.formData?.businessName ||
          parsed?.businessName;
        if (name) setBusinessName(name);
      }
    } catch (e) {
      console.error("localStorage parse error:", e);
    }
  }, []);

  const handlePurchase = (plan) => {
    console.log("Purchase:", plan);
    navigate("/subscription/checkout");
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

      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.15) 0%, transparent 70%)",
        }}
      />

      {/* ── Top-right logout button ── */}
      <div className="absolute top-4 right-5 z-20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors duration-150 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
        >
          {/* simple power icon — no extra package needed */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-6">
        <div
          className="text-center"
          style={{ animation: "slideDown 0.5s ease both" }}
        >
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Choose Your Plan
          </span>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-2">
            Subscription Plan
          </h1>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Enjoy enhanced benefits, exclusive content, and priority support
            with your subscription.
          </p>
        </div>

        <div style={{ animation: "fadeUp 0.5s 0.1s ease both", opacity: 0 }}>
          <HeroBanner businessName={businessName} />
        </div>

        <div
          className="mt-8 mb-2"
          style={{ animation: "fadeUp 0.5s 0.2s ease both", opacity: 0 }}
        >
          <PlanTabs selected={selectedPlan} onChange={setSelectedPlan} />
        </div>

        <div key={selectedPlan} style={{ animation: "fadeUp 0.3s ease both" }}>
          <PlanPriceCard
            selectedId={selectedPlan}
            onPurchase={handlePurchase}
          />
        </div>

        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <span className="text-xs text-gray-400 font-medium tracking-widest uppercase px-2">
            Compare Plans
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        <div style={{ animation: "fadeUp 0.5s 0.3s ease both", opacity: 0 }}>
          <PlanComparisonTable selectedId={selectedPlan} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          All plans include GST · Secure payment · Cancel anytime
        </p>
      </div>
    </div>
  );
}