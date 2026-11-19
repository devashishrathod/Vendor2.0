import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Building2, Landmark, LoaderCircle, TriangleAlert } from "lucide-react";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import InfoPanel from "../../components/ui/InfoPanel";
import Notice from "../../components/ui/Notice";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { SelectField, TextField } from "../../components/ui/TextField";
import { SCREENS } from "../../config/screens";
import { BANK_ACCOUNT_TYPES } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { skipScreen } from "../../services/onboardingApi";
import { useSavedBrand } from "../../store/brandStore";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { useVerifyStore } from "../../store/verifyStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { allPassed, bankRules, toDigits, toUpperAlphanumeric } from "../../validation/rules";
import { ACCOUNT_MAX, IFSC_LENGTH, isSameAccount, maskGrouped, useIfscLookup, verifyBankForm } from "./bankHelpers";

/**
 * BANK_VERIFICATION · enter sub-step (guide §4.9). "Verify account" runs ONE
 * paid penny drop (an account + IFSC already verified this session isn't
 * sent again). Skippable: `POST skip { screen: BANK_VERIFICATION }`, and the
 * server's answer is the next screen.
 * @param {{ onVerified: () => void }} props
 */
export default function BankEnterStep({ onVerified }) {
  const { isViewingPast, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const { brand } = useSavedBrand();
  // Name the server compares the account holder with, when no beneficiary is typed.
  const legalName = brand?.legalBusinessName ?? "";
  const bank = useOnboardingV2Store((s) => s.form.bank);
  const setBankField = useOnboardingV2Store((s) => s.setBankField);
  const verified = useVerifyStore((s) => s.results.BANK);
  const setResult = useVerifyStore((s) => s.setResult);

  const [accountFocused, setAccountFocused] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(() => bankRules(bank), [bank]);
  const isValid = allPassed(rules);
  const touched = Boolean(bank.accountNumber || bank.ifsc || bank.accountType);
  const { ifscValid, lookupDone, ifscInfo, lookupError } = useIfscLookup(bank.ifsc);

  const handleField = useCallback(
    (key, value) => {
      setBankField(key, value);
      setError("");
    },
    [setBankField],
  );

  const handleVerify = useCallback(async () => {
    if (!isValid || verifying) return;
    // Same account already passed the ₹1 test — don't charge it again.
    if (isSameAccount(verified, bank)) {
      setResult("BANK", { ...verified, accountType: bank.accountType });
      onVerified();
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const draft = await verifyBankForm({ bank, legalName });
      if (!draft.result?.isVerified) {
        // A failed drop is a 200 with the bank's reason (guide §2.10).
        setError(draft.result?.message || "We couldn't verify this account. Check the details and try again.");
        return;
      }
      setResult("BANK", draft);
      onVerified();
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Bank verification failed:", err);
      setError(onboardingErrorMessage(err, "Bank verification failed. Please try again."));
    } finally {
      setVerifying(false);
    }
  }, [bank, handleFlowError, isValid, legalName, onVerified, setResult, verified, verifying]);

  const handleSkip = useCallback(async () => {
    if (skipping) return;
    setSkipping(true);
    setError("");
    try {
      const res = await skipScreen(SCREENS.BANK_VERIFICATION);
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Skipping bank failed:", err);
      setError(onboardingErrorMessage(err, "Couldn't skip this step. Please try again."));
    } finally {
      setSkipping(false);
    }
  }, [goToServerScreen, handleFlowError, skipping]);

  const accountDisplay = accountFocused ? bank.accountNumber : maskGrouped(bank.accountNumber);
  const accountLengthOk = bank.accountNumber.length >= 9;

  return (
    <StepCard
      icon={Landmark}
      title="Add the bank account for payouts"
      subtitle="We verify it instantly with a ₹1 test. Your settlements land in this account."
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
        <StepFooter start={<FormError message={error} />}>
          {/* Skip only works on the vendor's own current screen (#23f). */}
          {!isViewingPast && (
            <Button variant="secondary" onClick={handleSkip} disabled={verifying} loading={skipping}>
              Skip for now
            </Button>
          )}
          <Button onClick={handleVerify} disabled={!isValid || skipping} loading={verifying} icon={ArrowRight}>
            {verifying ? "Verifying…" : isSameAccount(verified, bank) ? "Review details" : "Verify account"}
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
        {lookupDone && !ifscInfo && lookupError && <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{lookupError}</p>}
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
        <strong className="font-bold">Skipping?</strong> Without a bank account you can&apos;t sell vouchers to customers. You
        can add it later from your profile.
      </Notice>
    </StepCard>
  );
}
