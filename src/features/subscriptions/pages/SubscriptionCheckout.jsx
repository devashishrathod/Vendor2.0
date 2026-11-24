import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AppBackground from "@/components/common/AppBackground";
import AppTopBar from "@/components/common/AppTopBar";
import { previewCheckout } from "../services/subscriptionApi";
import { useBrand } from "../../../hooks/useBrand";
import { isOnboardingComplete, isOnboardingCompleteNow } from "@/features/onboarding/utils/onboardingStatus";
import OnboardingPageHeader from "@/features/onboarding-v2/components/layout/OnboardingPageHeader";
import { routeForScreen } from "@/features/onboarding-v2/config/routes";
import { SCREENS } from "@/features/onboarding-v2/config/screens";
import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";
import TrustBar from "../components/TrustBar";
import PlanInfo from "../components/PlanInfo";
import BillingAddressCard from "../components/BillingAddressCard";
import BillingDetailsCard from "../components/BillingDetailsCard";
import OrderSummary from "../components/OrderSummary";
import { toFormAddress, useBillingAddress } from "../hooks/useBillingAddress";
import { markCheckoutPaid, readCheckoutReturnTo, wasCheckoutPaid } from "../utils/checkoutSession";

export default function SubscriptionCheckout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // The checkout-preview response's own billingDetails (confirmed shape:
  // brandName, address, gstin, pan, addressSource) never includes
  // legalBusinessName — pulled from the same useBrand() hook WelcomePage.jsx
  // already uses for it instead of guessing a new field on preview.
  const { brand } = useBrand();
  // Billing address lives on the server (GET / PUT /brands/billing-address);
  // its `gstAddress` is the "Same as GST" prefill (owner answer 13).
  const billingAddress = useBillingAddress();
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);
  // create-order answered 422 BILLING_ADDRESS_REQUIRED — point at the form.
  const [billingNeeded, setBillingNeeded] = useState(false);

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
      // Still onboarding: where to go is the server's call — once the plan
      // is live the status has moved past SUBSCRIBE_PLAN (guide §4.11).
      fetchStatus()
        .then((status) => {
          const screen = status?.currentScreen;
          navigate(screen && screen !== SCREENS.SUBSCRIBE_PLAN ? routeForScreen(screen) : "/subscription", { replace: true });
        })
        .catch(() => navigate("/subscription", { replace: true }));
      return;
    }

    previewCheckout(subscriptionId, promoRef.current || undefined)
      .then((data) => {
        setPreview(data);
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
  }, [subscriptionId, navigate, fetchStatus]);

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

  // Billing saved → the preview's billingAddressRequired / billingDetails
  // change, and so does status.hasBillingAddress.
  const saveAddress = billingAddress.save;
  const handleAddressChange = useCallback(
    async (parts) => {
      await saveAddress(parts);
      setBillingNeeded(false);
      fetchStatus().catch((err) => console.error("Onboarding status refresh failed:", err));
      try {
        setPreview(await previewCheckout(subscriptionId, promoRef.current || undefined));
      } catch (err) {
        console.error("Checkout preview refresh failed:", err);
      }
    },
    [fetchStatus, saveAddress, subscriptionId],
  );

  const handleBillingRequired = useCallback(() => {
    setBillingNeeded(true);
    document.getElementById("billing-address")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  if (loading || !preview) {
    return <div>{error || "Loading..."}</div>;
  }

  const businessName = preview.billingDetails?.brandName || preview.brand?.brandName;
  const billing = preview.billingDetails ?? null;

  // Verified identity for the Billing Details card.
  const billingWithLegalName = billing ? { legalBusinessName: brand?.legalBusinessName, ...billing } : billing;

  // Billing Address form: the saved address; else the server's
  // suggestedAddress (GST, else PAN); else empty. "Same as GST" only for a
  // GST brand, filled from `gstAddress`; an empty state defaults to the GSTIN's.
  const gstAddress = billingAddress.gstin ? toFormAddress(billingAddress.gstAddress) : null;
  const saved = toFormAddress(billingAddress.billingAddress);
  const suggested = toFormAddress(billingAddress.suggestedAddress);
  const emptyAddress = { line1: "", line2: "", city: "", state: gstAddress?.state ?? "", pin: "" };
  let addressValue = { ...emptyAddress, sameAsGst: false };
  if (saved) addressValue = { ...saved, sameAsGst: false };
  else if (suggested) addressValue = { ...suggested, sameAsGst: Boolean(gstAddress) && billingAddress.suggestedAddress?.source === "GST" };
  const billingRequired = preview.billingAddressRequired === true || billingNeeded;

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
              {billingAddress.loading ? (
                <p className="rounded-xl bg-white px-4 py-3 text-sm text-gray-500 ring-1 ring-gray-200/70 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
                  Loading billing address…
                </p>
              ) : (
                <BillingAddressCard
                  key={saved ? "saved" : "draft"}
                  value={addressValue}
                  gstAddress={gstAddress}
                  onChange={handleAddressChange}
                  isSaved={Boolean(saved)}
                  required={billingRequired}
                />
              )}
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
            billingAddressRequired={billingRequired}
            onBillingRequired={handleBillingRequired}
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