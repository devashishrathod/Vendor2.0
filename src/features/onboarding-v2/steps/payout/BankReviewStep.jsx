import { useCallback, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Landmark, Lock, Pencil, TriangleAlert } from "lucide-react";
import Button from "../../components/ui/Button";
import DetailGrid from "../../components/ui/DetailGrid";
import Notice from "../../components/ui/Notice";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import VerifiedHeroCard from "../../components/ui/VerifiedHeroCard";
import { SCREENS } from "../../config/onboardingFlow";
import { BANK_ACCOUNT_TYPES } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { saveVerifiedBank } from "../../services/onboardingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import FormError from "../../components/ui/FormError";

/** "XXXX XXXX 9012" */
const maskForReview = (accountNumber = "") =>
  accountNumber.length > 4 ? `XXXX XXXX ${accountNumber.slice(-4)}` : accountNumber || "—";

/** One readable line from the bank address object / string. */
function formatAddress(address, fallback) {
  if (address && typeof address === "object") {
    return [address.addressLine1, address.city, address.state, address.pinCode].filter(Boolean).join(", ") || fallback;
  }
  if (typeof address === "string" && address.trim()) return address;
  return fallback;
}

/**
 * Screen 11 · Bank review. Shows the penny-drop result read-only, flags a
 * holder-name mismatch, and saves the verified account on Continue.
 */
export default function BankReviewStep() {
  const { next, goTo } = useOnboardingFlow();
  const bankDetails = useOnboardingV2Store((s) => s.form.bankDetails);
  const legalName = useOnboardingV2Store((s) => s.form.legalName);
  const ownerName = useOnboardingV2Store((s) => s.form.ownerKyc.panName);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const view = useMemo(() => {
    const raw = bankDetails ?? {};
    const result = raw.result ?? {};
    const typeValue = raw.accountType || result.account_type || "";
    return {
      bankName: result.bank_name || raw.ifscBankName || "Bank account",
      typeLabel: BANK_ACCOUNT_TYPES.find((t) => t.value === typeValue)?.label ?? typeValue,
      masked: maskForReview(raw.enteredAccountNumber || result.account_number || ""),
      holder: result.account_holder_name || "—",
      ifsc: result.account_ifsc || raw.ifsc || null,
      branch: result.bank_branch || raw.ifscBranchName || null,
      micr: result.micr_code || raw.ifscMicr || null,
      address: formatAddress(
        result.bank_address,
        [raw.ifscBankAddress, raw.ifscCity, raw.ifscState].filter(Boolean).join(", ") || null,
      ),
      isNameMatch: result.is_name_match,
      matchingScore: result.matching_score,
    };
  }, [bankDetails]);

  const businessName = legalName.trim() || ownerName || "your business";
  const nameMatched = view.isNameMatch === true;
  const nameTile = nameMatched
    ? { label: "Name match", value: "✓ Matches business", tone: "success" }
    : {
        label: "Name match",
        value: view.isNameMatch === false ? "Doesn't match business" : "Not checked",
      };

  const goToEnter = useCallback(() => goTo(SCREENS.BANK_ENTER), [goTo]);

  const handleContinue = useCallback(async () => {
    if (!bankDetails) return;
    setSaving(true);
    setSaveError("");
    try {
      await saveVerifiedBank(bankDetails, {
        enteredAccountNumber: bankDetails.enteredAccountNumber,
        accountType: bankDetails.accountType,
      });
      next();
    } catch (error) {
      console.error("Saving verified bank failed:", error);
      setSaveError(error?.message || "We couldn't save your bank account. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [bankDetails, next]);

  return (
    <StepCard
      icon={BadgeCheck}
      title="Bank account verified"
      subtitle="Check the details. Payouts go to this account."
      headerAside={bankDetails && <StatusPill icon={BadgeCheck}>Verified</StatusPill>}
      footer={
        <StepFooter
          startLastOnMobile
          start={
            <Button variant="ghost" icon={Pencil} iconPosition="start" onClick={goToEnter} disabled={saving}>
              Change details
            </Button>
          }
        >
          <FormError message={saveError} />
          <Button onClick={handleContinue} disabled={!bankDetails} loading={saving} icon={ArrowRight}>
            Continue
          </Button>
        </StepFooter>
      }
    >
      {bankDetails ? (
        <>
          <VerifiedHeroCard
            icon={Landmark}
            label={view.typeLabel ? `${view.bankName} · ${view.typeLabel}` : view.bankName}
            value={view.masked}
            aside={{ label: "Account holder", value: view.holder }}
          />

          <DetailGrid
            columns={4}
            items={[
              { label: "IFSC", value: view.ifsc },
              { label: "Branch", value: view.branch },
              { label: "MICR", value: view.micr },
              nameTile,
              { label: "Bank address", value: view.address, wide: true },
            ]}
          />

          {!nameMatched && (
            <Notice tone="warning" icon={TriangleAlert}>
              {view.isNameMatch === false
                ? `The name on this account (${view.holder}) doesn't match ${businessName}. Payouts may be held until our team checks it — change the account if this one isn't yours.`
                : `We couldn't confirm that this account belongs to ${businessName}. Our team will check it during review.`}
            </Notice>
          )}

          <Notice tone="warning" icon={Lock}>
            After approval, the bank account can only be changed through support.
          </Notice>
        </>
      ) : (
        <Notice tone="warning" icon={TriangleAlert}>
          No verified bank account yet. Go back and verify your account first.
        </Notice>
      )}
    </StepCard>
  );
}
