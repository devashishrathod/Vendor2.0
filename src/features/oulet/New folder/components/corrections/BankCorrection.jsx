import { useMemo, useState } from "react";
import { submitVerifiedBankDetails } from "@/features/onboarding/services/api/verificationDetails.api";
import Button from "@/features/onboarding-v2/components/ui/Button";
import DetailGrid from "@/features/onboarding-v2/components/ui/DetailGrid";
import FormError from "@/features/onboarding-v2/components/ui/FormError";
import RuleChecklist from "@/features/onboarding-v2/components/ui/RuleChecklist";
import { SelectField, TextField } from "@/features/onboarding-v2/components/ui/TextField";
import { BANK_ACCOUNT_TYPES } from "@/features/onboarding-v2/constants/onboardingOptions";
import {
  ACCOUNT_MAX,
  IFSC_LENGTH,
  maskForReview,
  useIfscLookup,
  verifyBankForm,
} from "@/features/onboarding-v2/steps/payout/bankHelpers";
import { allPassed, bankRules, toDigits, toUpperAlphanumeric } from "@/features/onboarding-v2/validation/rules";

/**
 * Bank re-verify for a rejected brand — the wizard's bank form: account
 * number, IFSC with a live bank lookup, account type and an optional
 * beneficiary name (sent for the name match, falling back to the legal
 * name). Saving stores it without moving the onboarding screen.
 * @param {{ initialBank: { accountNumber?: string, ifscCode?: string, accountType?: string }, legalName: string, onSaved: () => void }} props
 */
export default function BankCorrection({ initialBank, legalName, onSaved }) {
  const [bank, setBank] = useState({
    accountNumber: initialBank?.accountNumber || "",
    ifsc: initialBank?.ifscCode || "",
    accountType: initialBank?.accountType || "",
    beneficiary: "",
  });
  const [details, setDetails] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const rules = useMemo(() => bankRules(bank), [bank]);
  const valid = allPassed(rules);
  const { lookupDone, ifscInfo, lookupError } = useIfscLookup(bank.ifsc);
  const touched = Boolean(bank.accountNumber || bank.ifsc || bank.accountType);

  const setField = (key, value) => {
    setBank((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const verify = async () => {
    if (!valid || busy) return;
    setBusy("verify");
    setError("");
    try {
      setDetails(await verifyBankForm({ bank, ifscInfo, legalName }));
    } catch (err) {
      setError(err?.message || "Bank verification failed. Please check the details and try again.");
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (!details || busy) return;
    setBusy("save");
    setError("");
    try {
      await submitVerifiedBankDetails(details, {
        enteredAccountNumber: bank.accountNumber,
        accountType: bank.accountType,
        keepScreen: true,
      });
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err?.message || "Couldn't save the bank details. Please try again.");
    } finally {
      setBusy("");
    }
  };

  if (!details) {
    const ifscNote = lookupDone && ifscInfo ? [ifscInfo.BANK, ifscInfo.BRANCH].filter(Boolean).join(" · ") : "";
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="fix-account-number"
            label="Account number"
            required
            inputMode="numeric"
            autoComplete="off"
            placeholder="9–18 digits"
            value={bank.accountNumber}
            onChange={(e) => setField("accountNumber", toDigits(e.target.value, ACCOUNT_MAX))}
            counter={`${bank.accountNumber.length} / ${ACCOUNT_MAX}`}
          />
          <TextField
            id="fix-ifsc"
            label="IFSC"
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g., HDFC0001234"
            value={bank.ifsc}
            onChange={(e) => setField("ifsc", toUpperAlphanumeric(e.target.value, IFSC_LENGTH))}
            success={ifscNote || undefined}
            error={lookupError || undefined}
          />
          <SelectField
            id="fix-account-type"
            label="Account type"
            required
            placeholder="Select account type"
            options={BANK_ACCOUNT_TYPES}
            value={bank.accountType}
            onChange={(e) => setField("accountType", e.target.value)}
          />
          <TextField
            id="fix-beneficiary"
            label="Account holder name"
            optional
            hint="Used to match the account to your business"
            autoComplete="off"
            value={bank.beneficiary}
            onChange={(e) => setField("beneficiary", e.target.value)}
          />
        </div>
        <RuleChecklist title="Checks" rules={rules} active={touched} />
        <FormError message={error} />
        <div className="flex justify-end">
          <Button onClick={verify} disabled={!valid} loading={busy === "verify"}>
            {busy === "verify" ? "Verifying…" : "Verify account"}
          </Button>
        </div>
      </div>
    );
  }

  const result = details.result ?? {};
  const typeLabel = BANK_ACCOUNT_TYPES.find((t) => t.value === bank.accountType)?.label;
  return (
    <div className="flex flex-col gap-3">
      <DetailGrid
        hideEmpty
        items={[
          { label: "Account number", value: maskForReview(bank.accountNumber), tone: "success" },
          { label: "Account holder", value: result.account_holder_name },
          { label: "IFSC", value: result.account_ifsc || bank.ifsc },
          { label: "Bank", value: [result.bank_name, result.bank_branch].filter(Boolean).join(" · ") || null },
          { label: "Account type", value: typeLabel },
          {
            label: "Name match",
            value: typeof result.is_name_match === "boolean" ? (result.is_name_match ? "Matches your business" : "Doesn't match") : null,
          },
        ]}
      />
      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setDetails(null);
            setSaved(false);
          }}
          disabled={Boolean(busy)}
        >
          Change
        </Button>
        <Button onClick={save} disabled={saved} loading={busy === "save"}>
          {saved ? "Saved" : busy === "save" ? "Saving…" : "Save bank account"}
        </Button>
      </div>
    </div>
  );
}
