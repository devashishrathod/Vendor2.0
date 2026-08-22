import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBrand } from "../../../hooks/useBrand";
import { getPlanById } from "../services/subscriptionApi";
import { PLANS_BY_ID } from "../constants/plans"; // remove once /api/plans/:id is live
import TrustBar from "../components/TrustBar";
import PlanInfo from "../components/PlanInfo";
import BillingDetailsCard from "../components/BillingDetailsCard";
import OrderSummary from "../components/OrderSummary";

export default function SubscriptionCheckout() {
  const { brand, loading: brandLoading } = useBrand();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(state?.plan ?? null);
  const [planLoading, setPlanLoading] = useState(!state?.plan);

  const [billing, setBilling] = useState({
    brandName: "",
    address: "",
    gstin: "",
    pan: "",
  });

  // Resolve the plan if the page was loaded directly / refreshed and
  // navigate state is gone. Reads ?planId= from the URL.
  useEffect(() => {
    if (plan) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("planId");

    if (!id) {
      navigate("/subscription", { replace: true });
      return;
    }

    getPlanById(id)
      .then(setPlan)
      .catch(() => {
        // backend not ready yet — fall back to local constants
        const fallback = PLANS_BY_ID[id];
        if (fallback) {
          setPlan(fallback);
        } else {
          navigate("/subscription", { replace: true });
        }
      })
      .finally(() => setPlanLoading(false));
  }, [plan, navigate]);

  useEffect(() => {
    if (!brand) return;

    setBilling({
      brandName: brand.legalBusinessName || brand.brandName || "",
      address:
        brand.gst?.address?.location ||
        [
          brand.address?.floorNumber,
          brand.address?.street,
          brand.address?.city,
          brand.address?.district,
          brand.address?.state,
          brand.address?.pinCode,
        ]
          .filter(Boolean)
          .join(", "),
      gstin: brand.gst?.gstNumber || brand.gstin || "",
      pan: brand.pan?.pan || (typeof brand.pan === "string" ? brand.pan : ""),
      // used only for Razorpay prefill, not shown in BillingDetailsCard
      email: brand.email || brand.gst?.email || "",
      phone: brand.phone || brand.mobile || "",
    });
  }, [brand]);

  if (brandLoading || planLoading || !plan) {
    return <div>Loading...</div>;
  }

  const businessName = brand?.gst?.legalName || brand?.brandName;
  const brandId = brand?._id ?? brand?.id;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <TrustBar />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <div className="flex flex-col gap-4">
            <PlanInfo plan={plan} />
            <BillingDetailsCard details={billing} onSave={setBilling} />
          </div>

          <OrderSummary
            plan={plan}
            brandId={brandId}
            businessName={businessName}
            billingDetails={billing}
          />
        </div>
      </div>
    </div>
  );
}