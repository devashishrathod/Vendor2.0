import { useCallback, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, Check, Eye, FileSignature, IdCard, Landmark, Paperclip, UserRound, Wallet } from "lucide-react";
import { getErrorCode } from "@/services/http/apiError";
import Button from "../../components/ui/Button";
import DocumentPreviewModal from "../../components/ui/DocumentPreviewModal";
import FormError from "../../components/ui/FormError";
import InfoPanel from "../../components/ui/InfoPanel";
import Notice from "../../components/ui/Notice";
import OptionCard from "../../components/ui/OptionCard";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { ONBOARDING_ERROR_CODES } from "../../config/screens";
import { DOCUMENT_RULES, OWNER_ID_TYPES } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { saveOwnerIdDocument, saveOwnerPan, verifyPan } from "../../services/onboardingApi";
import { useSavedBrandStore } from "../../store/brandStore";
import { useVerifyStore } from "../../store/verifyStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { checkDocumentFile, formatFileSize, toUpperAlphanumeric } from "../../validation/rules";
import { CODE_INPUT_CLASS, readPanRecord } from "./verificationRecords";

const PAN_LENGTH = 10;
const PAN_FORMAT = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const METHODS = Object.freeze({ PAN: "PAN", ID_DOCUMENT: "ID_DOCUMENT" });

const WHY_WE_ASK = [
  { icon: Wallet, title: "Payouts", text: "PAN is needed for payouts. Without it, a much higher TDS applies on your earnings." },
  { icon: Landmark, title: "Bank match", text: "The owner's name should match your bank account name later." },
  { icon: FileSignature, title: "Can't be skipped", text: "Every unregistered business verifies its owner once." },
];

const VERIFY_AGAIN = [ONBOARDING_ERROR_CODES.VERIFICATION_FAILED, ONBOARDING_ERROR_CODES.VERIFICATION_NOT_FOUND];

/**
 * OWNER_VERIFICATION (guide §4.7, owner answer 2) — UNREGISTERED path, not
 * skippable. ONE choice: the owner's personal PAN (recommended; paid
 * verify-pan, then `owner-verification { method: PAN, verificationId }`) or an
 * ID document upload (multipart `{ method: ID_DOCUMENT, idType, file }`). The
 * server sets the legal name and answers with the next screen.
 */
export default function OwnerVerificationStep() {
  const { status, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const mergeBrand = useSavedBrandStore((s) => s.mergeBrand);
  const savedMethod = status?.items?.ownerVerificationMethod ?? null;

  const [method, setMethod] = useState(savedMethod ?? METHODS.PAN);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Owner PAN ──
  const panResult = useVerifyStore((s) => s.results.OWNER_PAN);
  const setResult = useVerifyStore((s) => s.setResult);
  const clearResult = useVerifyStore((s) => s.clearResult);
  const [pan, setPan] = useState(panResult?.details?.pan ?? "");
  const [verifying, setVerifying] = useState(false);
  const panVerified = Boolean(panResult?.isVerified && panResult?.details?.pan === pan);
  const panName = panVerified ? readPanRecord(panResult).name : null;
  // Only a personal PAN (4th letter P) can verify the owner. A company / firm /
  // LLP / trust PAN is stopped here, before the paid call (server: OWNER_PAN_NOT_PERSONAL).
  const panComplete = PAN_FORMAT.test(pan);
  const panIsPersonal = pan.charAt(3) === "P";
  const canVerifyPan = panComplete && panIsPersonal;
  const panFieldError =
    panComplete && !panIsPersonal
      ? "This is a business PAN. Enter the owner's personal PAN (its 4th letter is P), or upload an ID instead."
      : undefined;

  // ── ID document ──
  const [idType, setIdType] = useState(null);
  const [file, setFile] = useState(null);
  const [checkingFile, setCheckingFile] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef(null);

  const canSave = method === METHODS.PAN ? panVerified : Boolean(idType && file && !checkingFile);

  const chooseMethod = useCallback((next) => {
    setMethod(next);
    setError("");
  }, []);

  const handlePanChange = useCallback((event) => {
    setPan(toUpperAlphanumeric(event.target.value, PAN_LENGTH));
    setError("");
  }, []);

  const handleVerifyPan = useCallback(async () => {
    if (!canVerifyPan || verifying || panVerified) return;
    setVerifying(true);
    setError("");
    try {
      const res = await verifyPan(pan);
      const result = res?.data;
      if (!result?.isVerified) {
        setError(result?.message || "We couldn't verify this PAN. Check the number and try again.");
        return;
      }
      setResult("OWNER_PAN", result);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Owner PAN verification failed:", err);
      // OWNER_PAN_NOT_PERSONAL is answered before any paid call.
      setError(onboardingErrorMessage(err, "PAN verification failed. Please try again."));
    } finally {
      setVerifying(false);
    }
  }, [canVerifyPan, handleFlowError, pan, panVerified, setResult, verifying]);

  const handleFile = useCallback(async (event) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    setCheckingFile(true);
    setError("");
    const problem = await checkDocumentFile(picked);
    setCheckingFile(false);
    if (problem) {
      setFile(null);
      setError(problem);
      return;
    }
    setFile(picked);
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    try {
      const res =
        method === METHODS.PAN ? await saveOwnerPan(panResult.verificationId) : await saveOwnerIdDocument({ idType, file });
      const data = res?.data;
      if (data?.legalBusinessName) mergeBrand({ legalBusinessName: data.legalBusinessName });
      if (method === METHODS.PAN) clearResult("OWNER_PAN");
      goToServerScreen(data?.currentScreen);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Owner verification save failed:", err);
      if (method === METHODS.PAN && VERIFY_AGAIN.includes(getErrorCode(err))) clearResult("OWNER_PAN");
      // KYC_FILE_TYPE, KYC_IMAGE_TOO_SMALL, 413, KYC_STORAGE_UNAVAILABLE, DOCUMENT_IN_USE …
      setError(onboardingErrorMessage(err, "We couldn't save the owner verification. Please try again."));
    } finally {
      setSaving(false);
    }
  }, [canSave, clearResult, file, goToServerScreen, handleFlowError, idType, mergeBrand, method, panResult, saving]);

  const savedLabel = savedMethod === METHODS.PAN ? "the owner's PAN" : "an ID document";

  return (
    <StepCard
      icon={UserRound}
      title="Verify the owner"
      subtitle="The person who runs this business. Choose one way to verify them."
      aside={<InfoPanel title="Why we ask" tone="emerald" items={WHY_WE_ASK} />}
      footer={
        <StepFooter start={<FormError message={error} />}>
          <Button onClick={handleSave} disabled={!canSave} loading={saving} icon={ArrowRight}>
            {saving ? "Saving…" : "Save & continue"}
          </Button>
        </StepFooter>
      }
    >
      {savedMethod && (
        <Notice tone="info" icon={BadgeCheck}>
          The owner is already verified with {savedLabel}. Saving again replaces it.
        </Notice>
      )}

      <div role="radiogroup" aria-label="How to verify the owner" className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <OptionCard
          icon={IdCard}
          title="Owner's PAN"
          description="The owner's personal PAN (4th letter P). Verified instantly."
          selected={method === METHODS.PAN}
          onSelect={() => chooseMethod(METHODS.PAN)}
          badge={<StatusPill tone="success">Recommended</StatusPill>}
        />
        <OptionCard
          icon={Paperclip}
          title="Upload an ID"
          description="Aadhaar (masked), driving licence, passport or voter ID. Checked by our team."
          selected={method === METHODS.ID_DOCUMENT}
          onSelect={() => chooseMethod(METHODS.ID_DOCUMENT)}
        />
      </div>

      {method === METHODS.PAN ? (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
          <div className="min-w-0 sm:max-w-xs sm:flex-1">
            <TextField
              id="owner-pan"
              label="Owner PAN"
              required
              hint="A personal PAN — a company or firm PAN won't work here"
              placeholder="ABCDE1234F"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={PAN_LENGTH}
              value={pan}
              onChange={handlePanChange}
              error={panFieldError}
              inputClassName={CODE_INPUT_CLASS}
            />
          </div>
          {panVerified ? (
            <span className="inline-flex min-h-11 w-fit max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 text-[13px] font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
              <Check size={16} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{panName || "PAN verified"}</span>
            </span>
          ) : (
            <Button variant="secondary" onClick={handleVerifyPan} disabled={!canVerifyPan} loading={verifying}>
              {verifying ? "Verifying…" : "Verify PAN"}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="ID type">
            {OWNER_ID_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                aria-pressed={idType === type.value}
                onClick={() => {
                  setIdType(type.value);
                  setError("");
                }}
                className={`min-h-10 rounded-full px-3.5 text-xs font-bold transition ${
                  idType === type.value
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
          {idType === "AADHAAR" && (
            <Notice tone="warning">Upload a masked Aadhaar only — just the last 4 digits may be visible. Our team checks it.</Notice>
          )}
          {idType && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" icon={Paperclip} iconPosition="start" onClick={() => fileRef.current?.click()} loading={checkingFile}>
                {file ? "Replace file" : "Choose file"}
              </Button>
              {file && (
                <>
                  <span className="min-w-0 truncate text-xs font-semibold text-emerald-800 dark:text-emerald-300" title={file.name}>
                    {file.name} · {formatFileSize(file.size)}
                  </span>
                  <Button variant="ghost" icon={Eye} iconPosition="start" onClick={() => setPreview(true)}>
                    Preview
                  </Button>
                </>
              )}
            </div>
          )}
          <p className="text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-400">
            PDF, or a JPG / PNG at least {DOCUMENT_RULES.minImageSidePx} px on the short side. Up to 5 MB.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept={DOCUMENT_RULES.accept}
            onChange={handleFile}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      )}

      {preview && file && (
        <DocumentPreviewModal
          file={file}
          title={OWNER_ID_TYPES.find((t) => t.value === idType)?.label ?? "ID document"}
          fileName={file.name}
          onClose={() => setPreview(false)}
        />
      )}
    </StepCard>
  );
}
