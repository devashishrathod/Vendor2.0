import { Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TrydoodOffersBanner() {
  const navigate = useNavigate();

  return (
    <section className="mb-8">
      <div className="flex items-start justify-between mb-3 gap-3">
        <h3 className="text-sm font-bold text-gray-900">Trydood Offers</h3>
        <button type="button" className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap mt-0.5">
          View All Offers →
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-100 px-6 py-6 flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-3 max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Gift size={18} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">Get 20% OFF on Premium Listing</p>
            <p className="text-xs text-gray-500 mt-1 mb-4">Boost your visibility and attract more customers.</p>
            <button
              type="button"
              onClick={() => navigate("/subscription-plan")}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
            >
              Claim Offer
            </button>
          </div>
        </div>

        <p className="hidden sm:block text-sm italic text-emerald-700/70 font-medium">Good Business Sounds Better</p>
      </div>
    </section>
  );
}
