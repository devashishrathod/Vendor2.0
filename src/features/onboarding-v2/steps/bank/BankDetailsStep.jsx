import { useMemo, useState } from "react";
import { ArrowRight, Eye, EyeOff, Landmark, TriangleAlert } from "lucide-react";
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

const ACCOUNT_MAX = 18;
const IFSC_LENGTH = 11;

export default function BankDetailsStep() {
  const { next, skip } = useOnboardingFlow();
  const bank = useOnboardingV2Store((s) => s.form.bank);
  const setBankField = useOnboardingV2Store((s) => s.setBankField);
  const [showNumber, setShowNumber] = useState(false);

  const rules = useMemo(() => bankRules(bank), [bank]);
  const isValid = allPassed(rules);
  const touched = Boolean(bank.accountNumber || bank.ifsc || bank.accountType);

  return (
    <StepCard
      icon={Landmark}
      title="Add the bank account for payouts"
      subtitle="We send ₹1 to verify it. Your settlements land in this account."
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
        <StepFooter>
          <Button variant="secondary" onClick={skip}>
            Skip for now
          </Button>
          <Button onClick={next} disabled={!isValid} icon={ArrowRight}>
            Verify account
          </Button>
        </StepFooter>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="account-number"
          label="Account number"
          required
          type={showNumber ? "text" : "password"}
          inputMode="numeric"
          autoComplete="off"
          placeholder="9–18 digits"
          value={bank.accountNumber}
          onChange={(e) => setBankField("accountNumber", toDigits(e.target.value, ACCOUNT_MAX))}
          inputClassName="tracking-[0.12em] placeholder:tracking-normal"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowNumber((v) => !v)}
              aria-label={showNumber ? "Hide account number" : "Show account number"}
              aria-pressed={showNumber}
              className="grid size-10 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {showNumber ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          }
        />
        <TextField
          id="ifsc"
          label="IFSC code"
          required
          placeholder="e.g., HDFC0001234"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={bank.ifsc}
          maxLength={IFSC_LENGTH}
          onChange={(e) => setBankField("ifsc", toUpperAlphanumeric(e.target.value, IFSC_LENGTH))}
          inputClassName="tracking-[0.1em] placeholder:tracking-normal"
        />
        <TextField
          id="beneficiary"
          label="Beneficiary"
          optional
          placeholder="Name on the account"
          autoComplete="name"
          value={bank.beneficiary}
          onChange={(e) => setBankField("beneficiary", e.target.value)}
        />
        <SelectField
          id="account-type"
          label="Account type"
          required
          placeholder="Select account type"
          options={BANK_ACCOUNT_TYPES}
          value={bank.accountType}
          onChange={(e) => setBankField("accountType", e.target.value)}
        />
      </div>

      <Notice tone="warning" icon={TriangleAlert}>
        Skipping? You won't be able to sell vouchers until a bank account is added. You can add it later from your profile.
      </Notice>
    </StepCard>
  );
}
