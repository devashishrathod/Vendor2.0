import { useCallback, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  FileSignature,
  Landmark,
  Paperclip,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import Button from "../../components/ui/Button";
import InfoPanel from "../../components/ui/InfoPanel";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { OWNER_ID_TYPES } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { fetchPanDetails } from "../../services/onboardingApi";
import { verifyAadhaarWithDigiLocker } from "../../services/pendingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { toUpperAlphanumeric } from "../../validation/rules";
import FormError from "../../components/ui/FormError";

const PAN_LENGTH = 10;
const PAN_FORMAT = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const ID_FILE_ACCEPT = "image/*,.pdf";

const WHY_WE_ASK = [
  { icon: Wallet, title: "Payouts", text: "PAN is needed for payouts. Without it, a much higher TDS applies on your earnings." },
  { icon: Landmark, title: "Bank match", text: "Your name here must match your bank account name later." },
  { icon: FileSignature, title: "Contract", text: "This step can't be skipped: your partner contract is signed in this name." },
];

/** Name on a PAN record, whichever shape the verify endpoint returned. */
function panHolderName(details) {
  const data = details?.data ?? details ?? {};
  const parts = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");
  return (data.fullName || parts || "").trim();
}

/**
 * Screen 08u · Owner KYC — "Not registered" path only (registered paths use
 * OwnerPanEnterStep → OwnerPanReviewStep). Owner PAN + identity (DigiLocker
 * or an uploaded ID). Continue opens OwnerKycReviewStep, which saves them —
 * the owner's PAN name becomes the legal name there.
 */
export default function OwnerKycStep() {
  const { next } = useOnboardingFlow();
  const ownerKyc = useOnboardingV2Store((s) => s.form.ownerKyc);
  const patchForm = useOnboardingV2Store((s) => s.patchForm);

  const [pan, setPan] = useState(ownerKyc.pan || "");
  const [panLoading, setPanLoading] = useState(false);
  const [panError, setPanError] = useState("");
  const [digiLoading, setDigiLoading] = useState(false);
  const [idError, setIdError] = useState("");
  const idFileRef = useRef(null);

  const panFormatValid = PAN_FORMAT.test(pan);
  const panVerified = Boolean(ownerKyc.panDetails && ownerKyc.panName && ownerKyc.pan === pan);
  const isDigiLocker = ownerKyc.idMethod !== "upload";
  const identityDone = isDigiLocker ? ownerKyc.idVerified : Boolean(ownerKyc.idType && ownerKyc.idFileName);
  const canContinue = panVerified && identityDone;

  const panHint = "Your name here becomes the business's legal name";

  const handlePanChange = useCallback((event) => {
    setPan(toUpperAlphanumeric(event.target.value, PAN_LENGTH));
    setPanError("");
  }, []);

  const handleVerifyPan = useCallback(async () => {
    if (!PAN_FORMAT.test(pan)) {
      setPanError("Enter a valid PAN, e.g. ABCDE1234F.");
      return;
    }
    setPanLoading(true);
    setPanError("");
    try {
      const details = await fetchPanDetails(pan);
      const data = details?.data ?? details;
      if (data?.success === false) throw new Error(data.message || "We couldn't verify this PAN.");
      const name = panHolderName(details);
      if (!name) throw new Error("We couldn't read the name on this PAN. Check the number and try again.");
      // A different person's PAN: the earlier Aadhaar / ID check was for
      // someone else, so it has to be done again.
      const identityReset =
        ownerKyc.pan && ownerKyc.pan !== pan ? { idVerified: false, aadhaarLast4: "", idType: null, idFileName: null } : {};
      patchForm("ownerKyc", { pan, panName: name, panDetails: details, ...identityReset });
    } catch (error) {
      console.error("Owner PAN verification failed:", error);
      setPanError(error?.message || "PAN verification failed. Please try again.");
    } finally {
      setPanLoading(false);
    }
  }, [ownerKyc.pan, pan, patchForm]);

  const selectMethod = useCallback(
    (idMethod) => {
      patchForm("ownerKyc", { idMethod });
      setIdError("");
    },
    [patchForm],
  );

  const handleDigiLocker = useCallback(async () => {
    patchForm("ownerKyc", { idMethod: "digilocker" });
    setDigiLoading(true);
    setIdError("");
    try {
      const result = await verifyAadhaarWithDigiLocker();
      if (!result?.verified) throw new Error("DigiLocker didn't confirm your Aadhaar. Please try again.");
      patchForm("ownerKyc", { idVerified: true, aadhaarLast4: result.aadhaarLast4 || "" });
    } catch (error) {
      console.error("DigiLocker verification failed:", error);
      setIdError(error?.message || "DigiLocker verification failed. Please try again.");
    } finally {
      setDigiLoading(false);
    }
  }, [patchForm]);

  const selectIdType = useCallback(
    (idType) => {
      patchForm("ownerKyc", { idMethod: "upload", idType });
      setIdError("");
    },
    [patchForm],
  );

  const handleIdFile = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) patchForm("ownerKyc", { idMethod: "upload", idFileName: file.name });
    },
    [patchForm],
  );

  // Like GSTIN / PAN: this screen verifies, the review screen after it saves.
  const handleContinue = useCallback(() => {
    if (canContinue) next();
  }, [canContinue, next]);

  const selectedIdLabel = OWNER_ID_TYPES.find((t) => t.value === ownerKyc.idType)?.label;

  return (
    <StepCard
      icon={UserRound}
      title="Verify the owner"
      subtitle="The person who runs this business. Verify their PAN and identity."
      headerAside={<StatusPill tone="success">+10 profile strength</StatusPill>}
      aside={<InfoPanel title="Why we ask" tone="emerald" items={WHY_WE_ASK} />}
      footer={
        <StepFooter>
          <Button onClick={handleContinue} disabled={!canContinue} icon={ArrowRight}>
            Review details
          </Button>
        </StepFooter>
      }
    >
      {/* Owner PAN */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
          <div className="min-w-0 sm:max-w-xs sm:flex-1">
            <TextField
              id="owner-pan"
              label="Owner PAN"
              required
              hint={panHint}
              placeholder="ABCDE1234F"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={PAN_LENGTH}
              value={pan}
              onChange={handlePanChange}
              error={panError || undefined}
              inputClassName={`font-bold uppercase tracking-[0.18em] placeholder:tracking-normal ${
                panVerified ? "border-emerald-500! ring-4 ring-emerald-500/15" : ""
              }`}
              rightSlot={
                panVerified ? (
                  <span className="mr-2 grid size-6 place-items-center rounded-full bg-emerald-500 text-white" aria-hidden="true">
                    <Check size={14} strokeWidth={3} />
                  </span>
                ) : undefined
              }
            />
          </div>
          {panVerified ? (
            <span className="inline-flex min-h-11 w-fit max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 text-[13px] font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200 sm:mb-0.5 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
              <BadgeCheck size={16} strokeWidth={2.2} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{ownerKyc.panName}</span>
            </span>
          ) : (
            <Button
              variant="secondary"
              onClick={handleVerifyPan}
              disabled={!panFormatValid}
              loading={panLoading}
              className={panError ? "sm:mb-5" : ""}
            >
              {panLoading ? "Verifying…" : "Verify PAN"}
            </Button>
          )}
        </div>
      </div>

      <UnregisteredIdentity
          ownerKyc={ownerKyc}
          isDigiLocker={isDigiLocker}
          digiLoading={digiLoading}
          idError={idError}
          selectedIdLabel={selectedIdLabel}
          idFileRef={idFileRef}
          onSelectMethod={selectMethod}
          onDigiLocker={handleDigiLocker}
          onSelectIdType={selectIdType}
          onIdFile={handleIdFile}
        />
    </StepCard>
  );
}

/**
 * Identity (DigiLocker or uploaded ID) — unregistered path only.
 */
function UnregisteredIdentity({
  ownerKyc,
  isDigiLocker,
  digiLoading,
  idError,
  selectedIdLabel,
  idFileRef,
  onSelectMethod: selectMethod,
  onDigiLocker: handleDigiLocker,
  onSelectIdType: selectIdType,
  onIdFile: handleIdFile,
}) {
  return (
    <>
      {/* Identity and address */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
          Identity and address <span className="text-red-500">*</span>
        </legend>
        <div className="mt-1.5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div
            className={`flex flex-col gap-3 rounded-[14px] p-4 transition ${
              isDigiLocker
                ? "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-500/10"
                : "bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700"
            }`}
          >
            <button
              type="button"
              aria-pressed={isDigiLocker}
              onClick={() => selectMethod("digilocker")}
              className="flex min-h-11 items-start gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <span
                className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full ${
                  isDigiLocker ? "bg-emerald-500" : "ring-2 ring-inset ring-gray-300 dark:ring-gray-600"
                }`}
                aria-hidden="true"
              >
                {isDigiLocker && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 text-[15px] font-extrabold text-gray-900 dark:text-gray-100">
                  Aadhaar via DigiLocker
                  <StatusPill tone="success">Fastest</StatusPill>
                </span>
                <span className="mt-1 block text-xs leading-snug text-gray-600 dark:text-gray-400">
                  Verified in one tap. We keep only the last 4 digits.
                </span>
              </span>
            </button>
            {ownerKyc.idVerified ? (
              <StatusPill icon={Check}>
                Aadhaar verified{ownerKyc.aadhaarLast4 ? ` · XXXX ${ownerKyc.aadhaarLast4}` : ""}
              </StatusPill>
            ) : (
              <Button onClick={handleDigiLocker} loading={digiLoading} icon={ShieldCheck} iconPosition="start" className="w-full sm:w-fit">
                {digiLoading ? "Opening DigiLocker…" : "Verify with DigiLocker"}
              </Button>
            )}
          </div>

          <div
            className={`flex flex-col gap-3 rounded-[14px] p-4 transition ${
              !isDigiLocker
                ? "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-500/10"
                : "bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700"
            }`}
          >
            <button
              type="button"
              aria-pressed={!isDigiLocker}
              onClick={() => selectMethod("upload")}
              className="flex min-h-11 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <span
                className={`grid size-[18px] shrink-0 place-items-center rounded-full ${
                  !isDigiLocker ? "bg-emerald-500" : "ring-2 ring-inset ring-gray-300 dark:ring-gray-600"
                }`}
                aria-hidden="true"
              >
                {!isDigiLocker && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              <span className="text-[15px] font-extrabold text-gray-900 dark:text-gray-100">Or upload another ID</span>
            </button>
            <div className="flex flex-wrap gap-2" role="group" aria-label="ID type">
              {OWNER_ID_TYPES.map((type) => {
                const selected = !isDigiLocker && ownerKyc.idType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectIdType(type.value)}
                    className={`min-h-10 rounded-full px-3.5 text-xs font-bold transition ${
                      selected
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
            {!isDigiLocker && ownerKyc.idType && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  icon={Paperclip}
                  iconPosition="start"
                  onClick={() => idFileRef.current?.click()}
                  className="min-h-10 px-3.5 text-xs"
                >
                  {ownerKyc.idFileName ? "Replace file" : `Choose ${selectedIdLabel.toLowerCase()} file`}
                </Button>
                {ownerKyc.idFileName && (
                  <span className="min-w-0 truncate text-xs font-semibold text-emerald-800 dark:text-emerald-300" title={ownerKyc.idFileName}>
                    {ownerKyc.idFileName}
                  </span>
                )}
              </div>
            )}
            <input
              ref={idFileRef}
              type="file"
              accept={ID_FILE_ACCEPT}
              onChange={handleIdFile}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </div>
        <FormError message={idError} />
      </fieldset>
    </>
  );
}
