import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import Button from "@/features/onboarding-v2/components/ui/Button";
import Notice from "@/features/onboarding-v2/components/ui/Notice";
import { SelectField, TextField } from "@/features/onboarding-v2/components/ui/TextField";
import { BANK_ACCOUNT_TYPES } from "@/features/onboarding-v2/constants/onboardingOptions";
import {
  addBankDetails,
  addGstDetails,
  addPanDetails,
  verifyBankAccount,
  verifyGst,
  verifyPan,
} from "@/features/onboarding-v2/services/onboardingApi";
import { readGstRecord, readPanRecord } from "@/features/onboarding-v2/steps/verification/verificationRecords";
import { onboardingErrorMessage } from "@/features/onboarding-v2/utils/errorMessages";
import { allPassed, bankRules, gstRules, panRules, toDigits, toUpperAlphanumeric } from "@/features/onboarding-v2/validation/rules";

const TITLES = { PAN: "Add your PAN", GST: "Add your GSTIN", BANK: "Add a bank account" };

/** Review rows for a verify result (only fields the server sent). */
function resultRows(type, result) {
  if (type === "GST") {
    const r = readGstRecord(result);
    return [
      ["GSTIN", r.gstNumber],
      ["Legal name", r.legalName],
      ["Trade name", r.tradeName],
      ["Status", result?.isActive === false ? "Not active" : r.registrationStatus],
      ["Address", r.address],
    ];
  }
  if (type === "PAN") {
    const r = readPanRecord(result);
    return [
      ["PAN", r.pan],
      ["Name", r.name],
      ["Type", r.panType],
    ];
  }
  const d = result?.details ?? {};
  return [
    ["Account holder", result?.nameOnRecord || d.accountHolderName],
    ["Account", d.accountLast4Digits ? `XXXX XXXX ${d.accountLast4Digits}` : d.maskedAccountNumber],
    ["IFSC", d.ifscCode],
    ["Bank", result?.bankName || d.bankName],
  ];
}

/**
 * Add a missing PAN, GSTIN or bank account after approval — once (guide §8):
 * verify (PAID, only on this tap; a number verified for this brand in the
 * last 30 days comes back `reused` for free) → review → save with only the
 * `verificationId`. An existing one is read-only (409
 * DETAIL_ALREADY_PROVIDED). Numbers live only in this modal's state — never
 * in browser storage — and go when it closes.
 * @param {{ type: 'PAN'|'GST'|'BANK', brandPan?: string|null, onClose: () => void, onSaved: () => Promise<void>|void }} props
 */
export default function KycAddModal({ type, brandPan = null, onClose, onSaved }) {
  const [value, setValue] = useState("");
  const [bank, setBank] = useState({ accountNumber: "", ifsc: "", accountType: "" });
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !verifying && !saving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving, verifying]);

  const rules = useMemo(() => {
    if (type === "PAN") return panRules(value);
    if (type === "GST") return gstRules(value, { pan: brandPan ?? "" });
    return bankRules(bank);
  }, [bank, brandPan, type, value]);
  const valid = allPassed(rules);

  const verify = async () => {
    if (!valid || verifying) return;
    setVerifying(true);
    setError("");
    setResult(null);
    try {
      const res =
        type === "PAN"
          ? await verifyPan(value)
          : type === "GST"
            ? await verifyGst(value)
            : await verifyBankAccount({ accountNumber: bank.accountNumber, ifscCode: bank.ifsc });
      const data = res?.data ?? null;
      // A failed check is still 200 with isVerified false and the provider's reason.
      if (!data?.isVerified) setError(data?.message || "This couldn't be verified. Check the details and try again.");
      setResult(data);
    } catch (err) {
      console.error(`${type} verify failed:`, err);
      setError(onboardingErrorMessage(err, "Verification failed. Please try again."));
    } finally {
      setVerifying(false);
    }
  };

  const save = async () => {
    if (!result?.isVerified || saving) return;
    setSaving(true);
    setError("");
    try {
      if (type === "PAN") await addPanDetails(result.verificationId);
      else if (type === "GST") await addGstDetails(result.verificationId);
      else await addBankDetails({ verificationId: result.verificationId, accountType: bank.accountType });
      await onSaved();
      onClose();
    } catch (err) {
      console.error(`${type} save failed:`, err);
      setError(onboardingErrorMessage(err, "We couldn't save this. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const editing = (fn) => (...args) => {
    setResult(null);
    setError("");
    fn(...args);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={TITLES[type]}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{TITLES[type]}</h3>
          <button type="button" onClick={onClose} disabled={verifying || saving} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {type === "BANK" ? (
            <>
              <TextField
                id="kyc-account"
                label="Account number"
                required
                inputMode="numeric"
                autoComplete="off"
                value={bank.accountNumber}
                onChange={(e) => editing(setBank)((b) => ({ ...b, accountNumber: toDigits(e.target.value, 18) }))}
              />
              <TextField
                id="kyc-ifsc"
                label="IFSC code"
                required
                autoComplete="off"
                value={bank.ifsc}
                onChange={(e) => editing(setBank)((b) => ({ ...b, ifsc: toUpperAlphanumeric(e.target.value, 11) }))}
              />
              <SelectField
                id="kyc-account-type"
                label="Account type"
                required
                placeholder="Select account type"
                options={BANK_ACCOUNT_TYPES}
                value={bank.accountType}
                onChange={(e) => setBank((b) => ({ ...b, accountType: e.target.value }))}
              />
            </>
          ) : (
            <TextField
              id="kyc-number"
              label={type === "PAN" ? "PAN" : "GSTIN"}
              required
              autoComplete="off"
              value={value}
              onChange={(e) => editing(setValue)(toUpperAlphanumeric(e.target.value, type === "PAN" ? 10 : 15))}
            />
          )}

          {!valid && (value || bank.accountNumber || bank.ifsc) && (
            <ul className="text-xs text-gray-500 dark:text-gray-400">
              {rules.filter((r) => !r.passed).map((r) => (
                <li key={r.label}>• {r.label}</li>
              ))}
            </ul>
          )}

          {result?.isVerified && (
            <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30">
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={14} aria-hidden="true" />
                Verified{result.reused ? " (already checked recently — no new charge)" : ""}
              </p>
              <dl className="grid grid-cols-1 gap-1.5">
                {resultRows(type, result)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs">
                      <dt className="w-28 shrink-0 text-gray-500 dark:text-gray-400">{k}</dt>
                      <dd className="min-w-0 break-words font-semibold text-gray-900 dark:text-gray-100">{v}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          )}

          {error && <Notice tone="error">{error}</Notice>}
          <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
            Once saved it can&apos;t be changed here — changes go through support.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={verifying || saving}>
              Cancel
            </Button>
            {result?.isVerified ? (
              <Button onClick={save} loading={saving} icon={ArrowRight}>
                Save
              </Button>
            ) : (
              <Button onClick={verify} loading={verifying} disabled={!valid} icon={ArrowRight}>
                Verify
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
