import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Building2, Landmark, LoaderCircle, TriangleAlert } from "lucide-react";
import Button from "../../components/ui/Button";
import InfoPanel from "../../components/ui/InfoPanel";
import Notice from "../../components/ui/Notice";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { SelectField, TextField } from "../../components/ui/TextField";
import { BANK_ACCOUNT_TYPES } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { allPassed, bankRules, toDigits, toUpperAlphanumeric } from "../../validation/rules";
import FormError from "../../components/ui/FormError";
import { ACCOUNT_MAX, IFSC_LENGTH, maskGrouped, useIfscLookup, verifyBankForm } from "./bankHelpers";

/**
 * Screen 10 · Bank details. Account number + IFSC (looked up live) +
 * account type, then a ₹1 penny-drop. Skippable — skipping also skips the
 * review screen.
 */
export default function BankEnterStep() {
  const { next, skip } = useOnboardingFlow();
  const bank = useOnboardingV2Store((s) => s.form.bank);
  const bankDetails = useOnboardingV2Store((s) => s.form.bankDetails);
  const setBankField = useOnboardingV2Store((s) => s.setBankField);
  const setField = useOnboardingV2Store((s) => s.setField);

  const [accountFocused, setAccountFocused] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const rules = useMemo(() => bankRules(bank), [bank]);
  const isValid = allPassed(rules);
  const touched = Boolean(bank.accountNumber || bank.ifsc || bank.accountType);
  const { ifscValid, lookupDone, ifscInfo, lookupError } = useIfscLookup(bank.ifsc);

  const handleField = useCallback(
    (key, value) => {
      setBankField(key, value);
      setVerifyError("");
    },
    [setBankField],
  );

  const handleVerify = useCallback(async () => {
    if (!isValid) return;

    // Same account already passed the ₹1 test — don't charge it again.
    const previous = bankDetails?.result ?? {};
    const sameAccount =
      bankDetails?.enteredAccountNumber === bank.accountNumber &&
      (previous.account_ifsc || bankDetails?.ifsc) === bank.ifsc;
    if (sameAccount) {
      setField("bankDetails", { ...bankDetails, accountType: bank.accountType });
      next();
      return;
    }

    setVerifying(true);
    setVerifyError("");
    try {
      setField("bankDetails", await verifyBankForm({ bank, ifscInfo }));
      next();
    } catch (error) {
      console.error("Bank verification failed:", error);
      setVerifyError(error?.message || "Bank verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }, [bank, bankDetails, ifscInfo, isValid, next, setField]);

  const accountDisplay = accountFocused ? bank.accountNumber : maskGrouped(bank.accountNumber);
  const accountLengthOk = bank.accountNumber.length >= 9;

  return (
    <StepCard
      icon={Landmark}
      title="Add the bank account for payouts"
      subtitle="We verify it instantly. Your settlements land in this account."
      aside={
        <>
          <RuleChecklist title="Checks" rules={rules} active={touched} />
          <InfoPanel title="Account types">
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              {BANK_ACCOUNT_TYPES.map((t) => t.label).join(" · ")}
            </p>
          </InfoPanel>
        </>
      }
      footer={
        <StepFooter start={<FormError message={verifyError} />}>
          <Button variant="secondary" onClick={skip} disabled={verifying}>
            Skip for now
          </Button>
          <Button onClick={handleVerify} disabled={!isValid} loading={verifying} icon={ArrowRight}>
            {verifying ? "Verifying…" : "Verify account"}
          </Button>
        </StepFooter>
      }
    >
      <TextField
        id="account-number"
        label="Account number"
        required
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="9–18 digits"
        value={accountDisplay}
        onFocus={() => setAccountFocused(true)}
        onBlur={() => setAccountFocused(false)}
        onChange={(e) => handleField("accountNumber", toDigits(e.target.value, ACCOUNT_MAX))}
        counter={bank.accountNumber ? `${bank.accountNumber.length} / ${ACCOUNT_MAX}` : undefined}
        error={!accountFocused && bank.accountNumber && !accountLengthOk ? "Enter 9–18 digits." : undefined}
        inputClassName="font-bold tracking-[0.12em] placeholder:font-medium placeholder:tracking-normal sm:text-[15px]"
      />

      <div className="flex flex-col gap-2">
        <TextField
          id="ifsc"
          label="IFSC code"
          required
          placeholder="e.g. HDFC0001234"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={IFSC_LENGTH}
          value={bank.ifsc}
          onChange={(e) => handleField("ifsc", toUpperAlphanumeric(e.target.value, IFSC_LENGTH))}
          inputClassName="font-bold uppercase tracking-[0.12em] placeholder:font-medium placeholder:normal-case placeholder:tracking-normal sm:text-[15px]"
        />
        {ifscValid && !lookupDone && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400" role="status">
            <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
            Looking up bank…
          </p>
        )}
        {ifscInfo && (
          <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 px-3.5 py-3 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/10 dark:ring-sky-500/30">
            <Building2 size={16} strokeWidth={2} className="mt-px shrink-0 text-sky-700 dark:text-sky-400" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-sky-900 dark:text-sky-200">
                {ifscInfo.BANK}
                {ifscInfo.BRANCH ? ` · ${ifscInfo.BRANCH}` : ""}
              </p>
              <p className="mt-0.5 text-[11.5px] text-sky-800 dark:text-sky-300">Found from IFSC</p>
            </div>
          </div>
        )}
        {lookupDone && !ifscInfo && lookupError && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{lookupError}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="beneficiary"
          label="Beneficiary"
          optional
          placeholder="Name on the account"
          autoComplete="name"
          value={bank.beneficiary}
          onChange={(e) => handleField("beneficiary", e.target.value)}
        />
        <SelectField
          id="account-type"
          label="Account type"
          required
          placeholder="Select account type"
          options={BANK_ACCOUNT_TYPES}
          value={bank.accountType}
          onChange={(e) => handleField("accountType", e.target.value)}
        />
      </div>

      <Notice tone="warning" icon={TriangleAlert}>
        <strong className="font-bold">Skipping?</strong> You won&apos;t be able to sell vouchers until a bank account is
        added. You can add it later from your profile.
      </Notice>
    </StepCard>
  );
}
