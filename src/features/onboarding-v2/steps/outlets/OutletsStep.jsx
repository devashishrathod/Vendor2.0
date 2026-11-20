import { useCallback, useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Plus, Store, TriangleAlert } from "lucide-react";
import { getErrorCode, getErrorDetails } from "@/services/http/apiError";
import { getBillingAddress } from "@/features/subscriptions/services/billingAddressApi";
import { getCurrentSubscription } from "@/features/subscriptions/services/subscriptionApi";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { SelectField, TextField } from "../../components/ui/TextField";
import { KYC_PATHS, ONBOARDING_ERROR_CODES } from "../../config/screens";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { getOutlets, signUpOutlet } from "../../services/brandSetupApi";
import { continueScreen } from "../../services/onboardingApi";
import { useSavedBrand } from "../../store/brandStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import OutletCard from "./OutletCard";
import { MOBILE_FORMAT, OUTLET_TYPES, parseOutletMissing } from "./outletHelpers";

const TYPE_LABELS = { [OUTLET_TYPES.OUTLET]: "Outlet", [OUTLET_TYPES.FRANCHISE]: "Franchise" };

/** Slots left in a plan pool (`usage.subBrands` / `usage.franchises`), Infinity when unlimited. */
const slotsLeft = (pool) => (!pool ? 0 : pool.isUnlimited || pool.limit == null ? Infinity : Math.max(0, pool.limit - (pool.used ?? 0)));

/**
 * The add-outlet form: outlet type (only the plan's pools that have room)
 * and the manager's WhatsApp number, or "Same as brand WhatsApp number"
 * (`useOwnerNumber` — verified straight away, no code).
 */
function AddOutletForm({ brandId, ownerNumber, isFirst, types, onAdded, onCancel }) {
  const [outletType, setOutletType] = useState(types[0]);
  const [number, setNumber] = useState("");
  const [useOwner, setUseOwner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const valid = useOwner || MOBILE_FORMAT.test(number);

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await signUpOutlet({ brandId, outletType, isFirstOutlet: isFirst, ...(useOwner ? { useOwnerNumber: true } : { whatsappNumber: number }) });
      onAdded(res?.data);
    } catch (err) {
      console.error("Adding an outlet failed:", err);
      if (getErrorCode(err) === ONBOARDING_ERROR_CODES.OWNER_NUMBER_NOT_VERIFIED) setUseOwner(false);
      // 403 limit / plan / number already registered — the server's message says which.
      setError(onboardingErrorMessage(err, "We couldn't add this outlet. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-[1.5px] ring-inset ring-emerald-200 sm:p-5 dark:bg-gray-900 dark:ring-emerald-500/30">
      <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">{isFirst ? "Add your first outlet" : "Add another outlet"}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {types.length > 1 ? (
          <SelectField
            id="new-outlet-type"
            label="Outlet type"
            required
            options={types.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
            value={outletType}
            onChange={(e) => setOutletType(e.target.value)}
          />
        ) : (
          <TextField id="new-outlet-type" label="Outlet type" value={TYPE_LABELS[types[0]]} disabled />
        )}
        <TextField
          id="new-outlet-number"
          label="Manager's WhatsApp number"
          required
          inputMode="numeric"
          maxLength={10}
          placeholder="98765 43210"
          hint="The manager gets a code on WhatsApp to verify the outlet."
          value={useOwner ? ownerNumber : number}
          disabled={useOwner}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
      </div>
      {ownerNumber && (
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 self-start text-[13px] font-medium text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={useOwner} onChange={(e) => setUseOwner(e.target.checked)} className="size-4 accent-emerald-600" />
          Same as brand WhatsApp number ({ownerNumber}) — no code needed
        </label>
      )}
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button onClick={submit} disabled={!valid} loading={saving} icon={Plus} iconPosition="start">
          {useOwner ? "Add outlet" : "Add & send code"}
        </Button>
      </div>
    </div>
  );
}

/**
 * OUTLET_DETAILS (guide §4.13). Each outlet: signUp-with-whatsapp → the
 * manager's code → location → work hours (locked until verified). "Add
 * another" while the plan has room (`usage`). Continue asks the server;
 * its 422 `missing` codes (OUTLET, OUTLET_NOT_VERIFIED:<id>,
 * OUTLET_LOCATION:<id>, OUTLET_WORK_HOURS:<id>) are shown on that outlet's card.
 */
export default function OutletsStep() {
  const { status, kycPath, isViewingPast, closeScreen, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const { brand } = useSavedBrand();
  const brandId = status?.brandId;
  const [outlets, setOutlets] = useState(null);
  const [usage, setUsage] = useState(null);
  const [gstAddress, setGstAddress] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);
  const [openCodeFor, setOpenCodeFor] = useState(null);
  const [highlights, setHighlights] = useState({});
  const [noOutletError, setNoOutletError] = useState(false);
  const [sendNotice, setSendNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canAdd = status?.editable?.setup?.add !== false;
  const canChange = status?.editable?.setup?.change !== false;

  // State is only set once the requests settle.
  const loadOutlets = useCallback(
    () =>
      getOutlets(brandId)
        .then((list) => {
          setOutlets(list);
          setLoadError("");
        })
        .catch((err) => {
          console.error("Loading outlets failed:", err);
          setLoadError(onboardingErrorMessage(err, "We couldn't load your outlets."));
          setOutlets((current) => current ?? []);
        }),
    [brandId],
  );

  const loadUsage = useCallback(
    () =>
      getCurrentSubscription()
        .then((data) => setUsage(data?.usage ?? null))
        .catch((err) => console.error("Plan usage fetch failed:", err)),
    [],
  );

  useEffect(() => {
    if (!brandId) return;
    loadOutlets();
    loadUsage();
  }, [brandId, loadOutlets, loadUsage]);

  // "GST address is the outlet address" prefill (GST brands only).
  useEffect(() => {
    if (kycPath !== KYC_PATHS.GST) return;
    getBillingAddress()
      .then((res) => setGstAddress(res?.data?.gstAddress ?? null))
      .catch((err) => console.error("GST address fetch failed:", err));
  }, [kycPath]);

  // A card's change (a cancel frees a slot) — the new card has already opened its code entry, and an old notice is stale.
  const refresh = useCallback(async () => {
    await Promise.all([loadOutlets(), loadUsage()]);
    setHighlights({});
    setOpenCodeFor(null);
    setSendNotice("");
  }, [loadOutlets, loadUsage]);

  const onAdded = useCallback(
    async (data) => {
      setAdding(false);
      setNoOutletError(false);
      if (data?.usage) setUsage(data.usage);
      await loadOutlets();
      // A code went out → open its entry straight away. Saved but not sent → say so (Resend is on the card).
      if (data?.otpSent && data?.subBrand?._id) setOpenCodeFor(data.subBrand._id);
      setSendNotice(
        data?.otpSent === false && !data?.isVerified
          ? `${data.otpError || "The code couldn't be sent to the manager."} Tap “Resend code” on the outlet.`
          : "",
      );
    },
    [loadOutlets],
  );

  const handleContinue = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const res = await continueScreen();
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Outlets continue failed:", err);
      if (getErrorCode(err) === ONBOARDING_ERROR_CODES.STEP_INCOMPLETE) {
        const { noOutlet, byOutlet } = parseOutletMissing(getErrorDetails(err)?.missing);
        setHighlights(byOutlet);
        setNoOutletError(noOutlet);
        setError(noOutlet ? "Add at least one outlet to continue." : "Finish the highlighted outlets to continue.");
      } else {
        setError(onboardingErrorMessage(err, "That didn't work. Please try again."));
      }
    } finally {
      setBusy(false);
    }
  }, [goToServerScreen, handleFlowError]);

  const types = [OUTLET_TYPES.OUTLET, OUTLET_TYPES.FRANCHISE].filter((t) =>
    usage ? slotsLeft(t === OUTLET_TYPES.OUTLET ? usage.subBrands : usage.franchises) > 0 : t === OUTLET_TYPES.OUTLET,
  );
  const list = outlets ?? [];
  const isFirst = list.length === 0;
  const showForm = canAdd && types.length > 0 && (isFirst || adding);
  const ownerNumber = brand?.whatsappNumber ?? "";

  return (
    <StepCard
      icon={Store}
      title="Your outlets"
      subtitle="Each outlet needs a verified manager WhatsApp number, its location and work hours. Customers see your vouchers at these outlets."
      footer={
        <StepFooter start={<FormError message={error} />}>
          {isViewingPast ? (
            <Button onClick={closeScreen} icon={ArrowRight}>
              Done
            </Button>
          ) : (
            <Button onClick={handleContinue} loading={busy} icon={ArrowRight}>
              Review your details
            </Button>
          )}
        </StepFooter>
      }
    >
      {outlets === null ? (
        <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" role="status">
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          Loading your outlets…
        </p>
      ) : (
        <>
          {loadError && <FormError message={loadError} />}
          {noOutletError && list.length === 0 && (
            <Notice tone="warning" icon={TriangleAlert}>
              Add at least one outlet to continue.
            </Notice>
          )}
          {sendNotice && (
            <Notice tone="warning" icon={TriangleAlert}>
              {sendNotice}
            </Notice>
          )}

          {list.map((outlet, index) => (
            <OutletCard
              key={outlet._id}
              outlet={outlet}
              index={index}
              brandId={brandId}
              highlight={highlights[outlet._id]}
              gstAddress={gstAddress}
              canChange={canChange}
              openCodeOnMount={openCodeFor === outlet._id}
              onChanged={refresh}
            />
          ))}

          {showForm ? (
            <AddOutletForm
              brandId={brandId}
              ownerNumber={ownerNumber}
              isFirst={isFirst}
              types={types}
              onAdded={onAdded}
              onCancel={isFirst ? undefined : () => setAdding(false)}
            />
          ) : canAdd && types.length > 0 ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-emerald-700 ring-[1.5px] ring-inset ring-emerald-200 transition hover:bg-emerald-50 dark:text-emerald-400 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/10"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              Add another outlet
            </button>
          ) : (
            usage && (
              <p className="rounded-xl bg-gray-50 px-3.5 py-3 text-center text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:ring-gray-700">
                Your plan has no more outlet slots. Upgrade your plan to add more.
              </p>
            )
          )}
        </>
      )}
    </StepCard>
  );
}
