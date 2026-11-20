import { useCallback } from "react";
import BillingAddressCard from "@/features/subscriptions/components/BillingAddressCard";
import { toFormAddress, useBillingAddress } from "@/features/subscriptions/hooks/useBillingAddress";
import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";

/**
 * "Billing Address" tab — the address on every invoice (guide §8): edit any
 * time with PUT /brands/billing-address. A GST brand's state must be its
 * GSTIN's state (422 BILLING_STATE_GSTIN_MISMATCH). There is no delete (the
 * server refuses one).
 */
const BillingAddressPage = () => {
  const billing = useBillingAddress();
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);

  const gstAddress = billing.gstin ? toFormAddress(billing.gstAddress) : null;
  const saved = toFormAddress(billing.billingAddress);
  const suggested = toFormAddress(billing.suggestedAddress);
  let value = { line1: "", line2: "", city: "", state: gstAddress?.state ?? "", pin: "", sameAsGst: false };
  if (saved) value = { ...saved, sameAsGst: false };
  else if (suggested) value = { ...suggested, sameAsGst: Boolean(gstAddress) && billing.suggestedAddress?.source === "GST" };

  const save = billing.save;
  const handleSave = useCallback(
    async (parts) => {
      await save(parts);
      fetchStatus().catch((err) => console.error("Onboarding status refresh failed:", err));
    },
    [fetchStatus, save],
  );

  if (billing.loading) return <p className="text-sm text-gray-400">Loading billing address…</p>;

  return (
    <div className="max-w-3xl">
      {billing.error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500">We couldn&apos;t load your billing address. Please refresh.</p>
      )}
      <BillingAddressCard key={saved ? "saved" : "draft"} value={value} gstAddress={gstAddress} onChange={handleSave} isSaved={Boolean(saved)} />
    </div>
  );
};

export default BillingAddressPage;
