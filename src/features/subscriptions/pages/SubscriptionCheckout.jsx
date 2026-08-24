import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { previewCheckout } from "../services/subscriptionApi";
import TrustBar from "../components/TrustBar";
import PlanInfo from "../components/PlanInfo";
import BillingDetailsCard from "../components/BillingDetailsCard";
import OrderSummary from "../components/OrderSummary";

export default function SubscriptionCheckout() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // The plan picked on the pricing page only supplies the id to preview —
  // everything shown on this page (plan details, billing, pricing/GST
  // breakdown, order summary rows, whether the brand can even proceed)
  // comes from POST /transactions/subscribe/preview and is rendered as-is,
  // not recomputed on the frontend.
  const subscriptionId = state?.plan?.id ?? state?.plan?._id;

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local edits to billing details before paying — starts from the
  // server's billingDetails, editable via BillingDetailsCard.
  const [billing, setBilling] = useState(null);

  // Applying/removing a promo code just re-runs the preview with/without
  // `promoCode` and swaps in whatever the server returns — same as the
  // initial load, no local discount math.
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");

  useEffect(() => {
    if (!subscriptionId) {
      navigate("/subscription", { replace: true });
      return;
    }

    previewCheckout(subscriptionId)
      .then((data) => {
        setPreview(data);
        setBilling(data?.billingDetails ?? null);
      })
      .catch((err) => setError(err.message || "Couldn't load checkout details."))
      .finally(() => setLoading(false));
  }, [subscriptionId, navigate]);

  const handleApplyPromo = async (code) => {
    setApplyingPromo(true);
    setPromoError("");
    try {
      const data = await previewCheckout(subscriptionId, code);
      setPreview(data);
    } catch (err) {
      setPromoError(err.message || "Couldn't apply that promo code.");
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    setApplyingPromo(true);
    setPromoError("");
    try {
      const data = await previewCheckout(subscriptionId);
      setPreview(data);
    } catch (err) {
      setPromoError(err.message || "Couldn't remove the promo code.");
    } finally {
      setApplyingPromo(false);
    }
  };

  if (loading || !preview) {
    return <div>{error || "Loading..."}</div>;
  }

  const businessName = preview.billingDetails?.brandName || preview.brand?.brandName;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <TrustBar />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <div className="flex flex-col gap-4">
            <PlanInfo plan={preview.plan} />
            <BillingDetailsCard details={billing} onSave={setBilling} />
          </div>

          <OrderSummary
            subscriptionId={subscriptionId}
            orderSummary={preview.orderSummary}
            pricing={preview.pricing}
            promo={preview.promo}
            canProceed={preview.canProceed}
            blockedReason={preview.blockedReason}
            notices={preview.notices}
            businessName={businessName}
            billingDetails={billing}
            onApplyPromo={handleApplyPromo}
            onRemovePromo={handleRemovePromo}
            applyingPromo={applyingPromo}
            promoError={promoError}
          />
        </div>
      </div>
    </div>
  );
}