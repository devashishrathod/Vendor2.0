import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { LoaderCircle, TriangleAlert, X } from "lucide-react";
import { getBillingAddress } from "@/features/subscriptions/services/billingAddressApi";
import { getCurrentSubscription } from "@/features/subscriptions/services/subscriptionApi";
import { getOutlets } from "@/features/onboarding-v2/services/brandSetupApi";
import AddOutletForm from "@/features/onboarding-v2/steps/outlets/AddOutletForm";
import OutletCard from "@/features/onboarding-v2/steps/outlets/OutletCard";
import { typesWithRoom } from "@/features/onboarding-v2/steps/outlets/outletHelpers";

/**
 * Add an outlet from the Outlets page — the same flow as onboarding
 * (guide §4.13): outlet type (only the plan's pools with room, from
 * `usage`) and the manager's WhatsApp number, or "Same as brand WhatsApp
 * number" (`useOwnerNumber` — verified at once, decided by `isVerified`,
 * never by the message text); then the manager's code, location and work
 * hours on the outlet's card. An outlet left unverified keeps its hold and
 * can be finished — or cancelled — from the list.
 * @param {{ brand: object, existingCount: number, onClose: () => void, onChanged: () => void }} props
 */
export default function AddOutletModal({ brand, existingCount = 0, onClose, onChanged }) {
  const isFirst = existingCount === 0;
  const brandId = brand?._id;
  const [usage, setUsage] = useState(undefined); // undefined = loading
  const [gstAddress, setGstAddress] = useState(null);
  const [added, setAdded] = useState(null); // { id, openCode, notice }
  const [outlet, setOutlet] = useState(null);

  useEffect(() => {
    getCurrentSubscription()
      .then((data) => setUsage(data?.usage ?? null))
      .catch((err) => {
        console.error("Plan usage fetch failed:", err);
        setUsage(null);
      });
    getBillingAddress()
      .then((res) => setGstAddress(res?.data?.gstin ? res.data.gstAddress ?? null : null))
      .catch((err) => console.error("GST address fetch failed:", err));
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Re-reads the new outlet (verify / location / hours changed it); gone = cancelled.
  const loadOutlet = useCallback(
    (id) =>
      getOutlets(brandId)
        .then((list) => setOutlet(list.find((o) => o._id === id) ?? null))
        .catch((err) => console.error("Outlet fetch failed:", err)),
    [brandId],
  );

  const onAdded = useCallback(
    async (data) => {
      const id = data?.subBrand?._id;
      if (data?.usage) setUsage(data.usage);
      setAdded({
        id,
        openCode: Boolean(data?.otpSent),
        notice:
          data?.otpSent === false && !data?.isVerified
            ? `${data.otpError || "The code couldn't be sent to the manager."} Tap “Resend code” below.`
            : "",
      });
      if (id) await loadOutlet(id);
      onChanged();
    },
    [loadOutlet, onChanged],
  );

  const refreshOutlet = useCallback(async () => {
    if (added?.id) await loadOutlet(added.id);
    onChanged();
  }, [added, loadOutlet, onChanged]);

  const types = usage === undefined ? [] : typesWithRoom(usage);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Add outlet">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{added ? "Finish your new outlet" : "Add an outlet"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {!added && usage === undefined && (
          <p className="flex items-center gap-2 text-sm text-gray-500" role="status">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            Checking your plan…
          </p>
        )}

        {!added && usage !== undefined && types.length === 0 && (
          <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:ring-gray-700">
            Your plan has no more outlet slots.{" "}
            <Link to="/subscription-plan" className="font-bold text-emerald-700 underline dark:text-emerald-400">
              View plans
            </Link>
          </p>
        )}

        {!added && types.length > 0 && (
          <AddOutletForm brandId={brandId} ownerNumber={brand?.whatsappNumber ?? ""} isFirst={isFirst} types={types} onAdded={onAdded} onCancel={onClose} />
        )}

        {added && (
          <div className="flex flex-col gap-3">
            {added.notice && (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                <TriangleAlert size={14} className="mt-px shrink-0" aria-hidden="true" />
                {added.notice}
              </p>
            )}
            {outlet ? (
              <OutletCard
                outlet={outlet}
                brandId={brandId}
                index={existingCount}
                gstAddress={gstAddress}
                canChange
                openCodeOnMount={added.openCode}
                onChanged={refreshOutlet}
              />
            ) : (
              <p className="text-sm text-gray-500">This outlet was cancelled.</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You can close this and finish later from the Outlets list — an unverified outlet is held until its timer runs out.
            </p>
            <div className="flex justify-end">
              <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
