import { useState } from "react";
import { ArrowRight, BadgeCheck, Building2, FileBadge } from "lucide-react";
import Button from "@/features/onboarding-v2/components/ui/Button";
import ConfirmDialog from "@/features/onboarding-v2/components/ui/ConfirmDialog";
import Notice from "@/features/onboarding-v2/components/ui/Notice";
import { SelectField } from "@/features/onboarding-v2/components/ui/TextField";
import { KYC_PATHS } from "@/features/onboarding-v2/config/screens";
import { ENTITY_TYPES } from "@/features/onboarding-v2/constants/onboardingOptions";
import { editBasicDetails } from "@/features/onboarding-v2/services/onboardingApi";
import { suggestedEntityFromPan } from "@/features/onboarding-v2/steps/verification/verificationRecords";
import { onboardingErrorMessage } from "@/features/onboarding-v2/utils/errorMessages";

const card = "rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800";

/**
 * Unregistered → registered after approval (guide §8), only while
 * `editable.registrationStatus` is true:
 * - "I have GST" → add the GSTIN (verify + save); the server moves the
 *   brand to the GST path, legal name and entity from GST.
 * - "Registered, no GST" → `update-basic-details { kycPath: "NO_GST" }`
 *   alone, then the PAN (the owner PAN already on file counts), then the
 *   entity once (`update-basic-details { businessEntityType }`).
 * Approval stays. Anything else sent → 409 LEGAL_FIELD_LOCKED.
 * @param {{ brand: object, status: import('@/features/onboarding-v2/types').OnboardingStatus, onAddGst: () => void, onAddPan: () => void, onChanged: () => Promise<void> }} props
 */
export default function RegistrationUpgrade({ brand, status, onAddGst, onAddPan, onChanged }) {
  const [confirmNoGst, setConfirmNoGst] = useState(false);
  const [busy, setBusy] = useState(false);
  const [entity, setEntity] = useState(() => suggestedEntityFromPan(brand?.pan?.pan) ?? "");
  const [error, setError] = useState("");

  const kycPath = status?.kycPath;
  const canUpgrade = kycPath === KYC_PATHS.UNREGISTERED && status?.editable?.registrationStatus;
  // After "Registered, no GST": PAN (if none yet), then the entity — once.
  const needsPan = kycPath === KYC_PATHS.NO_GST && !brand?.pan && status?.editable?.kyc?.add?.pan;
  const needsEntity = kycPath === KYC_PATHS.NO_GST && !brand?.businessEntityType && status?.editable?.entity;

  if (!canUpgrade && !needsPan && !needsEntity) return null;

  const run = async (call, fallback) => {
    setBusy(true);
    setError("");
    try {
      await call();
      await onChanged();
    } catch (err) {
      console.error("Registration upgrade failed:", err);
      setError(onboardingErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const switchToNoGst = () =>
    run(() => editBasicDetails({ kycPath: KYC_PATHS.NO_GST }), "We couldn't change your business status.").finally(() => setConfirmNoGst(false));

  const saveEntity = () => entity && run(() => editBasicDetails({ businessEntityType: entity }), "We couldn't save your business entity.");

  return (
    <section className={card} aria-label="Register your business">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <BadgeCheck size={17} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {canUpgrade ? "Registered your business?" : "Finish your registration"}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Your approval stays — this only adds your registration details.</p>
        </div>
      </div>

      {canUpgrade && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onAddGst}
            disabled={busy}
            className="flex items-start gap-3 rounded-xl p-4 text-left ring-1 ring-inset ring-gray-200 transition hover:bg-emerald-50 hover:ring-emerald-200 dark:ring-gray-700 dark:hover:bg-emerald-500/10"
          >
            <FileBadge size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>
              <span className="block text-[13px] font-bold text-gray-900 dark:text-gray-100">I have GST</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Verify your GSTIN — your legal name and entity come from it.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setConfirmNoGst(true)}
            disabled={busy}
            className="flex items-start gap-3 rounded-xl p-4 text-left ring-1 ring-inset ring-gray-200 transition hover:bg-emerald-50 hover:ring-emerald-200 dark:ring-gray-700 dark:hover:bg-emerald-500/10"
          >
            <Building2 size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>
              <span className="block text-[13px] font-bold text-gray-900 dark:text-gray-100">Registered, no GST</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Then your PAN and business entity.</span>
            </span>
          </button>
        </div>
      )}

      {needsPan && (
        <Notice tone="info" action={<Button onClick={onAddPan} icon={ArrowRight}>Add PAN</Button>}>
          Next, add your business PAN.
        </Notice>
      )}

      {needsEntity && !needsPan && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <SelectField
              id="upgrade-entity"
              label="Business entity"
              required
              placeholder="Select your business entity"
              hint="Set once — changes later go through support."
              options={ENTITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
            />
          </div>
          <Button onClick={saveEntity} loading={busy} disabled={!entity}>
            Save entity
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {confirmNoGst && (
        <ConfirmDialog
          title="Registered, no GST?"
          message="Your business status changes to “Registered, no GST”. Next you add your PAN (if it isn't on file) and your business entity."
          confirmLabel="Yes, continue"
          cancelLabel="Not now"
          confirmVariant="primary"
          busy={busy}
          onConfirm={switchToNoGst}
          onCancel={() => setConfirmNoGst(false)}
        />
      )}
    </section>
  );
}
