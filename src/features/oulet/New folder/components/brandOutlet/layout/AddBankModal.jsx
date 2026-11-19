import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, BadgeCheck, Building2, Check, Landmark, LoaderCircle, ShieldCheck, TriangleAlert, X } from "lucide-react";
import Toaster from "@/features/onboarding-v2/components/ui/Toaster";
import FormError from "@/features/onboarding-v2/components/ui/FormError";
import { SelectField, TextField } from "@/features/onboarding-v2/components/ui/TextField";
import { BANK_ACCOUNT_TYPES } from "@/features/onboarding-v2/constants/onboardingOptions";
import { addBankDetails } from "@/features/onboarding-v2/services/onboardingApi";
import { onboardingErrorMessage } from "@/features/onboarding-v2/utils/errorMessages";
import { useOnboardingV2Store } from "@/features/onboarding-v2/store/onboardingStore";
import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";
import {
  ACCOUNT_MAX,
  IFSC_LENGTH,
  maskForReview,
  maskGrouped,
  useIfscLookup,
  verifyBankForm,
} from "@/features/onboarding-v2/steps/payout/bankHelpers";
import { allPassed, bankRules, toDigits, toUpperAlphanumeric } from "@/features/onboarding-v2/validation/rules";

/**
 * "Add bank account" popup on the outlet review — same paid ₹1 penny drop
 * and save as the onboarding Bank step: enter → verify-bank → check details →
 * add-bank-details { verificationId }. The onboarding status is re-read after.
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function AddBankModal({ open, onClose }) {
  if (!open) return null;
  return createPortal(<BankModalBody onClose={onClose} />, document.body);
}

function BankModalBody({ onClose }) {
  const bank = useOnboardingV2Store((s) => s.form.bank);
  const legalName = useOnboardingV2Store((s) => s.form.legalName);
  const setBankField = useOnboardingV2Store((s) => s.setBankField);
  const setField = useOnboardingV2Store((s) => s.setField);
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);

  const [phase, setPhase] = useState("enter"); // enter | review
  const [verified, setVerified] = useState(null); // { result, accountNumber, ifsc, accountType } — not saved until "Save"
  const [accountFocused, setAccountFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(() => bankRules(bank), [bank]);
  const isValid = allPassed(rules);
  const { ifscValid, lookupDone, ifscInfo, lookupError } = useIfscLookup(bank.ifsc);

  const close = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [close]);

  const handleField = (key, value) => {
    setBankField(key, value);
    setError("");
  };

  const handleVerify = async () => {
    if (!isValid || busy) return;
    setBusy(true);
    setError("");
    try {
      const draft = await verifyBankForm({ bank, legalName });
      if (!draft.result?.isVerified) {
        // A failed drop is a 200 with the bank's reason.
        setError(draft.result?.message || "We couldn't verify this account. Check the details and try again.");
        return;
      }
      setVerified(draft);
      setPhase("review");
    } catch (err) {
      console.error("Bank verification failed:", err);
      setError(onboardingErrorMessage(err, "Bank verification failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!verified || busy) return;
    setBusy(true);
    setError("");
    try {
      await addBankDetails({ verificationId: verified.result.verificationId, accountType: verified.accountType });
      setField("bankDetails", verified.result);
      // The server's status (items.bank, groups) is the tracker now.
      fetchStatus().catch((err) => console.error("Onboarding status refresh failed:", err));
      onClose();
    } catch (err) {
      console.error("Saving bank account failed:", err);
      setError(onboardingErrorMessage(err, "We couldn't save your bank account. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const result = verified?.result ?? {};
  const details = result.details ?? {};
  const nameMatched = result.isNameMatch === true;
  const typeLabel = BANK_ACCOUNT_TYPES.find((t) => t.value === verified?.accountType)?.label ?? verified?.accountType;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="add-bank-title">
      <Toaster />
      <FormError message={error} />
      <button type="button" aria-label="Close" onClick={close} className="absolute inset-0 h-full w-full cursor-default bg-gray-900/50 backdrop-blur-sm" />

      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-gray-800">
        <header className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 sm:px-6 dark:border-gray-700">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
            {phase === "review" ? <BadgeCheck size={19} aria-hidden="true" /> : <Landmark size={19} aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="add-bank-title" className="text-base font-extrabold text-gray-900 dark:text-gray-50">
              {phase === "review" ? "Bank account verified" : "Add bank account"}
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-snug text-gray-500 dark:text-gray-400">
              {phase === "review" ? "Check the details, then save. Payouts go to this account." : "We verify it instantly. Your settlements land in this account."}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:hover:bg-gray-700"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6">
          {phase === "enter" ? (
            <>
              <TextField
                id="modal-account-number"
                label="Account number"
                required
                inputMode="numeric"
                autoComplete="off"
                placeholder="9–18 digits"
                value={accountFocused ? bank.accountNumber : maskGrouped(bank.accountNumber)}
                onFocus={() => setAccountFocused(true)}
                onBlur={() => setAccountFocused(false)}
                onChange={(e) => handleField("accountNumber", toDigits(e.target.value, ACCOUNT_MAX))}
                counter={bank.accountNumber ? `${bank.accountNumber.length} / ${ACCOUNT_MAX}` : undefined}
                error={!accountFocused && bank.accountNumber && bank.accountNumber.length < 9 ? "Enter 9–18 digits." : undefined}
                inputClassName="font-bold tracking-[0.12em] placeholder:font-medium placeholder:tracking-normal"
              />
              <div className="flex flex-col gap-2">
                <TextField
                  id="modal-ifsc"
                  label="IFSC code"
                  required
                  placeholder="e.g. HDFC0001234"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={IFSC_LENGTH}
                  value={bank.ifsc}
                  onChange={(e) => handleField("ifsc", toUpperAlphanumeric(e.target.value, IFSC_LENGTH))}
                  inputClassName="font-bold uppercase tracking-[0.12em] placeholder:font-medium placeholder:normal-case placeholder:tracking-normal"
                />
                {ifscValid && !lookupDone && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400" role="status">
                    <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
                    Looking up bank…
                  </p>
                )}
                {ifscInfo && (
                  <p className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-[12.5px] font-bold text-sky-900 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30">
                    <Building2 size={15} className="shrink-0 text-sky-700 dark:text-sky-400" aria-hidden="true" />
                    {ifscInfo.BANK}
                    {ifscInfo.BRANCH ? ` · ${ifscInfo.BRANCH}` : ""}
                  </p>
                )}
                {lookupDone && !ifscInfo && lookupError && <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{lookupError}</p>}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  id="modal-beneficiary"
                  label="Beneficiary"
                  optional
                  placeholder="Name on the account"
                  autoComplete="name"
                  value={bank.beneficiary}
                  onChange={(e) => handleField("beneficiary", e.target.value)}
                />
                <SelectField
                  id="modal-account-type"
                  label="Account type"
                  required
                  placeholder="Select account type"
                  options={BANK_ACCOUNT_TYPES}
                  value={bank.accountType}
                  onChange={(e) => handleField("accountType", e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-sm">
                <p className="text-[11.5px] font-semibold text-emerald-100">
                  {details.bankName || result.bankName || ifscInfo?.BANK || "Bank account"}
                  {typeLabel ? ` · ${typeLabel}` : ""}
                </p>
                <p className="mt-1.5 text-lg font-extrabold tracking-[0.12em]">{details.maskedAccountNumber || maskForReview(verified?.accountNumber)}</p>
                <p className="mt-2 text-[11px] text-emerald-100">Account holder</p>
                <p className="text-sm font-bold">{details.accountHolderName || result.nameOnRecord || "—"}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  ["IFSC", details.ifscCode || verified?.ifsc],
                  ["Branch", details.branchName || result.branchName],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-gray-50 px-3 py-2.5 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/40 dark:ring-gray-700">
                    <dt className="text-[11px] text-gray-500 dark:text-gray-400">{label}</dt>
                    <dd className="mt-0.5 break-words text-[13px] font-bold text-gray-900 dark:text-gray-100">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
              {nameMatched ? (
                <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12.5px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                  <ShieldCheck size={15} className="shrink-0" aria-hidden="true" />
                  Account holder name matches your business.
                </p>
              ) : (
                <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
                  <TriangleAlert size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                  {result.isNameMatch === false
                    ? `The name on this account doesn't match ${legalName || "your business"}. Payouts may be held until our team checks it.`
                    : `We couldn't confirm this account belongs to ${legalName || "your business"}. Our team will check it during review.`}
                </p>
              )}
            </>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3.5 sm:px-6 dark:border-gray-700 dark:bg-gray-900/40">
          {phase === "review" ? (
            <button
              type="button"
              onClick={() => setPhase("enter")}
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-gray-600 hover:bg-white disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Change details
            </button>
          ) : (
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="min-h-11 rounded-xl px-3 text-sm font-semibold text-gray-600 hover:bg-white disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={phase === "review" ? handleSave : handleVerify}
            disabled={busy || (phase === "enter" && !isValid)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} strokeWidth={2.5} aria-hidden="true" />}
            {phase === "review" ? (busy ? "Saving…" : "Save account") : busy ? "Verifying…" : "Verify account"}
          </button>
        </footer>
      </div>
    </div>
  );
}
