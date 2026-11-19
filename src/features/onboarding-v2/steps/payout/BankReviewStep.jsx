import { useCallback, useState } from "react";
import { ArrowRight, BadgeCheck, Landmark, Lock, Pencil, TriangleAlert } from "lucide-react";
import { getErrorCode } from "@/services/http/apiError";
import Button from "../../components/ui/Button";
import DetailGrid from "../../components/ui/DetailGrid";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import VerifiedHeroCard from "../../components/ui/VerifiedHeroCard";
import { ONBOARDING_ERROR_CODES } from "../../config/screens";
import { BANK_ACCOUNT_TYPES } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { addBankDetails } from "../../services/onboardingApi";
import { useVerifyStore } from "../../store/verifyStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";

const VERIFY_AGAIN = [ONBOARDING_ERROR_CODES.VERIFICATION_FAILED, ONBOARDING_ERROR_CODES.VERIFICATION_NOT_FOUND];

/** verify-bank `isNameMatch` (only when a beneficiary name was sent). */
const NAME_MATCH = {
  true: { label: "Name match", value: "✓ Matches", tone: "success" },
  false: { label: "Name match", value: "Doesn't match" },
};

/**
 * BANK_VERIFICATION · review sub-step. Shows verify-bank's mapped `details`;
 * Continue saves `add-bank-details { verificationId, accountType }` — never
 * isVerified (the server decides it). After saving, the bank is locked.
 * @param {{ verified: { result: object, accountType: string }, onChangeDetails: (message?: string) => void }} props
 */
export default function BankReviewStep({ verified, onChangeDetails }) {
  const { goToServerScreen, handleFlowError } = useOnboardingFlow();
  const clearResult = useVerifyStore((s) => s.clearResult);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const result = verified.result ?? {};
  const details = result.details ?? {};
  const typeLabel = BANK_ACCOUNT_TYPES.find((t) => t.value === verified.accountType)?.label ?? verified.accountType;
  const bankName = details.bankName || result.bankName || "Bank account";

  const handleContinue = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await addBankDetails({ verificationId: result.verificationId, accountType: verified.accountType });
      clearResult("BANK");
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Saving verified bank failed:", err);
      if (VERIFY_AGAIN.includes(getErrorCode(err))) {
        clearResult("BANK");
        onChangeDetails(onboardingErrorMessage(err));
        return;
      }
      setSaveError(onboardingErrorMessage(err, "We couldn't save your bank account. Please try again."));
    } finally {
      setSaving(false);
    }
  }, [clearResult, goToServerScreen, handleFlowError, onChangeDetails, result.verificationId, saving, verified.accountType]);

  return (
    <StepCard
      icon={BadgeCheck}
      title="Bank account verified"
      subtitle="Check the details. Payouts go to this account."
      headerAside={<StatusPill icon={BadgeCheck}>Verified</StatusPill>}
      footer={
        <StepFooter
          startLastOnMobile
          start={
            <Button variant="ghost" icon={Pencil} iconPosition="start" onClick={() => onChangeDetails()} disabled={saving}>
              Change details
            </Button>
          }
        >
          <FormError message={saveError} />
          <Button onClick={handleContinue} loading={saving} icon={ArrowRight}>
            {saving ? "Saving…" : "Save & continue"}
          </Button>
        </StepFooter>
      }
    >
      <VerifiedHeroCard
        icon={Landmark}
        label={typeLabel ? `${bankName} · ${typeLabel}` : bankName}
        value={details.maskedAccountNumber || "—"}
        aside={{ label: "Account holder", value: details.accountHolderName || result.nameOnRecord || "—" }}
      />

      <DetailGrid
        columns={3}
        hideEmpty
        items={[
          { label: "IFSC", value: details.ifscCode },
          { label: "Branch", value: details.branchName || result.branchName },
          NAME_MATCH[String(result.isNameMatch)] ?? { label: "Name match", value: null },
        ]}
      />

      <Notice tone="warning" icon={Lock}>
        Once saved, the bank account can only be changed through support.
      </Notice>
      {result.isNameMatch === false && (
        <Notice tone="warning" icon={TriangleAlert}>
          The name on this account doesn&apos;t match the name you entered. Our team checks it during review — change the account
          if this one isn&apos;t yours.
        </Notice>
      )}
    </StepCard>
  );
}
