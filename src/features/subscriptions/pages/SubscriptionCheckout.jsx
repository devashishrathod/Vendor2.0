import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { previewCheckout, getCurrentSubscription } from "../services/subscriptionApi";
import { useBrand } from "../../../hooks/useBrand";
import TrustBar from "../components/TrustBar";
import PlanInfo from "../components/PlanInfo";
import BillingDetailsCard from "../components/BillingDetailsCard";
import OrderSummary from "../components/OrderSummary";

// A hard page reload loses React Router's navigation `state` (that's how
// this page normally gets `plan.id`), which used to send the vendor back
// to /subscription unconditionally — including right after they'd already
// paid (e.g. reloading while the WelcomePage success modal was showing).
// Check the real subscription status first so an already-paid vendor is
// sent forward instead of back to checkout/plan-picking. Confirmed real
// shape (GET /subscribeds/get): top-level `isSubscribed` boolean, plus
// `subscription.status === "ACTIVE"`.
function hasActiveSubscription(sub) {
  if (!sub) return false;
  return !!sub.isSubscribed || sub.subscription?.status === "ACTIVE";
}

export default function SubscriptionCheckout() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // The checkout-preview response's own billingDetails (confirmed shape:
  // brandName, address, gstin, pan, addressSource) never includes
  // legalBusinessName — pulled from the same useBrand() hook WelcomePage.jsx
  // already uses for it instead of guessing a new field on preview.
  const { brand } = useBrand();

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
  // initial load, no local discount math. Feedback for both shows inline,
  // right under the promo code input (PromoCodePanel), not via toast.
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");
  // After removing a code, PromoCodePanel should reopen already-expanded
  // (not require an extra "Apply Here" click) so switching to a different
  // code is a single step.
  const [promoJustRemoved, setPromoJustRemoved] = useState(false);

  useEffect(() => {
    if (!subscriptionId) {
      // Before bouncing back to plan-picking, confirm the vendor hasn't
      // already paid — a reload here (state lost) used to always send an
      // already-successful payment back to /subscription instead of
      // forward, letting them stumble into paying again.
      getCurrentSubscription(brand?._id)
        .then((sub) => {
          navigate(hasActiveSubscription(sub) ? "/brand-outlet" : "/subscription", { replace: true });
        })
        .catch(() => navigate("/subscription", { replace: true }));
      return;
    }

    previewCheckout(subscriptionId)
      .then((data) => {
        setPreview(data);
        setBilling(data?.billingDetails ?? null);
      })
      .catch((err) => setError(err.message || "Couldn't load checkout details."))
      .finally(() => setLoading(false));
  }, [subscriptionId, navigate, brand?._id]);

  const handleApplyPromo = async (code) => {
    setApplyingPromo(true);
    setPromoError("");
    setPromoJustRemoved(false);
    try {
      const data = await previewCheckout(subscriptionId, code);
      setPreview(data);
      // The backend returns 200 even for an invalid/expired code —
      // `promo.applied` stays falsy and `promo.message` carries the real
      // reason (e.g. "This promo code is not valid.") instead of the call
      // throwing, so that has to be checked explicitly. On success, the
      // applied code shows via the discount row's own code + Remove
      // control (see OrderSummary.jsx) — no separate success message.
      if (!data?.promo?.applied && data?.promo?.message) {
        setPromoError(data.promo.message);
      }
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
      setPromoJustRemoved(true);
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

  // billing's own legalBusinessName (set once the vendor edits + saves it
  // here via BillingDetailsCard) wins over this brand default — the spread
  // order below only fills the gap when nothing's been saved yet.
  const billingWithLegalName = billing
    ? { legalBusinessName: brand?.legalBusinessName, ...billing }
    : billing;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <TrustBar />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <div className="flex flex-col gap-4">
            <PlanInfo plan={preview.plan} />
            <BillingDetailsCard details={billingWithLegalName} onSave={setBilling} />
          </div>

          <OrderSummary
            subscriptionId={subscriptionId}
            returnTo={state?.returnTo}
            plan={preview.plan}
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
            promoJustRemoved={promoJustRemoved}
            promoError={promoError}
          />
        </div>
      </div>
    </div>
  );
}