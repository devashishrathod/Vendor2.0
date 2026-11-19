import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AppBackground from "@/components/common/AppBackground";
import AppTopBar from "@/components/common/AppTopBar";
import { previewCheckout, getCurrentSubscription } from "../services/subscriptionApi";
import { useBrand } from "../../../hooks/useBrand";
import { isOnboardingComplete, isOnboardingCompleteNow } from "@/features/onboarding/utils/onboardingStatus";
import OnboardingPageHeader from "@/features/onboarding-v2/components/layout/OnboardingPageHeader";
import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";
import TrustBar from "../components/TrustBar";
import PlanInfo from "../components/PlanInfo";
import { useOnboardingV2Store } from "@/features/onboarding-v2/store/onboardingStore";
import BillingAddressCard from "../components/BillingAddressCard";
import BillingDetailsCard from "../components/BillingDetailsCard";
import OrderSummary from "../components/OrderSummary";
import {
  markCheckoutPaid,
  readCheckoutBilling,
  readCheckoutReturnTo,
  saveCheckoutBilling,
  wasCheckoutPaid,
} from "../utils/checkoutSession";

// A hard page reload loses React Router's navigation `state` (that's how
// this page normally gets `plan.id`), which used to send the vendor back
// to /subscription unconditionally — including right after they'd already
// paid (e.g. reloading while the WelcomePage success modal was showing).
// Check the real subscription status first so an already-paid vendor is
// sent forward instead of back to checkout/plan-picking. Confirmed real
// shape (GET /subscribeds/get): top-level `isSubscribed` boolean, plus
// `subscription.status === "ACTIVE"`.
/**
 * A GST address split into billing-address fields. The brand record stores
 * it camelCase (floorNumber, buildingName…); the raw GST verify response
 * (onboarding wizard) uses snake_case — `snake` picks that shape.
 * @param {object|null|undefined} a
 * @param {boolean} [snake]
 * @returns {{ line1: string, line2: string, city: string, state: string, pin: string }|null}
 */
function gstAddressFrom(a, snake = false) {
  if (!a) return null;
  const pick = (camel, snakeKey) => String((snake ? a[snakeKey] : a[camel]) ?? "").trim();
  const line1 = [pick("floorNumber", "floor_number"), pick("buildingNumber", "building_number"), pick("buildingName", "building_name")]
    .filter(Boolean)
    .join(", ");
  const city = pick("city", "city") || pick("district", "district");
  const state = pick("state", "state");
  const pin = pick("pin", "pin");
  // GST "location" usually repeats the whole address — keep only the parts
  // not already in line 1 / city / state / PIN (locality, landmark).
  const taken = [line1, city, pick("district", "district"), state, pin].join(",").toLowerCase();
  const line2 = pick("location", "location")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !taken.includes(part.toLowerCase()))
    .join(", ");
  const address = { line1: line1 || line2, line2: line1 ? line2 : "", city, state, pin };
  return address.line1 || address.city ? address : null;
}

function hasActiveSubscription(sub) {
  if (!sub) return false;
  return !!sub.isSubscribed || sub.subscription?.status === "ACTIVE";
}

export default function SubscriptionCheckout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // The checkout-preview response's own billingDetails (confirmed shape:
  // brandName, address, gstin, pan, addressSource) never includes
  // legalBusinessName — pulled from the same useBrand() hook WelcomePage.jsx
  // already uses for it instead of guessing a new field on preview.
  const { brand } = useBrand();
  // GST record from the onboarding wizard — fallback when the brand record
  // has no GST address yet.
  const onboardingGstAddress = useOnboardingV2Store((s) => {
    const gst = s.form.gstDetails;
    return (gst?.data ?? gst)?.address ?? null;
  });

  // The plan picked on the pricing page only supplies the id to preview —
  // everything shown on this page (plan details, billing, pricing/GST
  // breakdown, order summary rows, whether the brand can even proceed)
  // comes from POST /transactions/subscribe/preview and is rendered as-is,
  // not recomputed on the frontend.
  //
  // The plan id is read from the URL (?plan=) so a page refresh — which
  // wipes router `state` — rebuilds the same checkout from the preview API
  // instead of bouncing back to the plan picker. Router state is only a
  // fallback for any caller that hasn't put it in the URL.
  const planId = searchParams.get("plan") || state?.plan?.id || state?.plan?._id;
  // Checked once on mount: a plan already paid for in this tab must not
  // reopen checkout on reload (that would invite paying twice). Not
  // re-read on later renders, so marking it paid mid-success-animation
  // doesn't yank the page away.
  const [paidOnLoad] = useState(() => wasCheckoutPaid(planId));
  const subscriptionId = paidOnLoad ? null : planId;

  // Back-target for the Upgrade flow — router state is lost on refresh,
  // sessionStorage (written by SubscriptionPlan.jsx) isn't.
  const returnTo = state?.returnTo ?? readCheckoutReturnTo() ?? undefined;

  // Onboarding (not the dashboard's upgrade flow): keep the wizard's header.
  const onboardingStatus = useOnboardingStatusStore((s) => s.status);
  const inOnboarding = !returnTo && !isOnboardingComplete(onboardingStatus);

  // Applied promo code mirrors ?promo= so a refresh re-runs the preview
  // with it. A ref (not a dep of the load effect) so applying/removing a
  // code doesn't re-trigger the initial load.
  const promoRef = useRef(searchParams.get("promo") || "");
  const syncPromoParam = (code) => {
    promoRef.current = code;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (code) next.set("promo", code);
        else next.delete("promo");
        return next;
      },
      // keep router state (plan/returnTo) on this in-place URL update
      { replace: true, state }
    );
  };

  // Browser back off this page is handled app-wide by PostAuthRouteGuard
  // (it always sends "back from /subscription/checkout" to /subscription,
  // regardless of currentScreen) — that used to be duplicated here with a
  // second, independent pushState/popstate trap, and the two competing
  // history-manipulation loops racing on the same back press was what
  // actually caused it to land on stale entries like /brand-outlet
  // sometimes. One handler, one place, no race.

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
      // ⚠️ FIXED: an already-onboarded brand here is UPGRADING (Plan &
      // Billing → Upgrade). Its active subscription is the OLD plan, not
      // proof this upgrade was paid — so a reload must go back to the plan
      // picker, never forward to the onboarding-only Create Outlet page
      // (which is where it used to send approved brands, leaving them stuck).
      if (isOnboardingCompleteNow()) {
        navigate("/subscription", { replace: true });
        return;
      }
      // Still onboarding: before bouncing back to plan-picking, confirm the
      // vendor hasn't already paid — a reload here (state lost) used to
      // always send an already-successful payment back to /subscription
      // instead of forward, letting them stumble into paying again.
      getCurrentSubscription(brand?._id)
        .then((sub) => {
          navigate(hasActiveSubscription(sub) ? "/brand-outlet" : "/subscription", { replace: true });
        })
        .catch(() => navigate("/subscription", { replace: true }));
      return;
    }

    previewCheckout(subscriptionId, promoRef.current || undefined)
      .then((data) => {
        setPreview(data);
        // Unpaid billing edits from before a refresh win over the server copy.
        setBilling(readCheckoutBilling(subscriptionId) ?? data?.billingDetails ?? null);
        // A ?promo= code that no longer applies (expired, wrong plan) —
        // show why. The stale param itself is overwritten by the next
        // apply/remove (kept out of this effect so URL updates don't
        // re-trigger the initial load).
        if (promoRef.current && !data?.promo?.applied) {
          promoRef.current = "";
          setPromoError(data?.promo?.message || "That promo code no longer applies.");
        }
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
      if (data?.promo?.applied) {
        syncPromoParam(data?.pricing?.promoCode || code);
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
      syncPromoParam("");
    } catch (err) {
      setPromoError(err.message || "Couldn't remove the promo code.");
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleSaveBilling = (next) => {
    setBilling(next);
    saveCheckoutBilling(subscriptionId, next);
  };

  if (loading || !preview) {
    return <div>{error || "Loading..."}</div>;
  }

  const businessName = preview.billingDetails?.brandName || preview.brand?.brandName;

  // Verified identity for the Billing Details card.
  const billingWithLegalName = billing
    ? { legalBusinessName: brand?.legalBusinessName, ...billing }
    : billing;

  // Billing Address: structured fields, defaulting to the GST address when
  // the brand has one ("Same as my GST address" ticked), else the preview's
  // single-line address as line 1.
  const gstAddress = gstAddressFrom(brand?.gst?.address) ?? gstAddressFrom(onboardingGstAddress, true);
  const addressValue = billing?.addressParts ?? (
    gstAddress
      ? { ...gstAddress, sameAsGst: true }
      : { line1: billing?.address || "", line2: "", city: "", state: "", pin: "", sameAsGst: false }
  );
  const handleAddressChange = (parts) => {
    const address = [parts.line1, parts.line2, parts.city, parts.state, parts.pin].filter(Boolean).join(", ");
    handleSaveBilling({ ...billing, addressParts: parts, address });
  };

  return (
    <div className="app-shell-bg relative isolate min-h-screen">
      <AppBackground />
      {/* Checkout is only ever reached from the plan picker (/subscription)
          via handlePurchase — so that's always the correct one-step-back
          target, no returnTo/sessionStorage needed like SubscriptionPlan's
          own Back button. An explicit button (not the browser's back
          button) so it isn't caught by PostAuthRouteGuard's app-wide
          popstate handling, which redirects any browser back/forward to
          the vendor's currentScreen route regardless of where they
          actually came from in this side flow. */}
      {inOnboarding ? (
        <OnboardingPageHeader
          title="Payment"
          onBack={() => navigate("/subscription", { state: { returnTo } })}
        />
      ) : (
        <AppTopBar onBack={() => navigate("/subscription", { state: { returnTo } })} />
      )}
      {/* Full-bleed: sits outside the max-w container so the ribbon spans
          the whole viewport width edge to edge. */}
      <TrustBar />
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <div className="flex flex-col gap-4">
            <PlanInfo plan={preview.plan} />
            {/* Billing Details, then Billing Address — full width each, laid out
                horizontally inside so they stay short. */}
            <div className="flex flex-col gap-4">
              <BillingDetailsCard details={billingWithLegalName} />
              <BillingAddressCard
                value={addressValue}
                gstAddress={gstAddress}
                onChange={handleAddressChange}
                isSaved={Boolean(billing?.addressParts)}
              />
            </div>
          </div>

          <OrderSummary
            subscriptionId={subscriptionId}
            returnTo={returnTo}
            onPaid={() => markCheckoutPaid(subscriptionId)}
            plan={preview.plan}
            orderSummary={preview.orderSummary}
            pricing={preview.pricing}
            promo={preview.promo}
            canProceed={preview.canProceed}
            requiresPayment={preview.requiresPayment}
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