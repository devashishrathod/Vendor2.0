import { useCallback, useState } from "react";
import FormError from "../../components/ui/FormError";
import { KYC_PATHS } from "../../config/screens";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useSavedBrand } from "../../store/brandStore";
import { useVerifyStore } from "../../store/verifyStore";
import { PAN_ACCEPTED_NOTE } from "../../validation/rules";
import PanEnterStep from "./PanEnterStep";
import PanReviewStep from "./PanReviewStep";

const COPY = {
  [KYC_PATHS.GST]: {
    title: "Confirm your business PAN",
    subtitle: "Filled in from your GSTIN — it has to be the PAN inside it. Verify it to continue.",
    label: "Business PAN",
    hint: "From your GSTIN (characters 3–12)",
    beforeContinue: ["The PAN must match your GSTIN.", "Verification is instant.", "Once saved it can only be changed through support."],
  },
  [KYC_PATHS.NO_GST]: {
    title: "Verify your PAN",
    subtitle: "Your business PAN, or your personal PAN if you run it yourself. We suggest your business type from it.",
    label: "Business or personal PAN",
    hint: "10 characters · 5 letters · 4 numbers · 1 letter",
    note: PAN_ACCEPTED_NOTE,
    beforeContinue: ["The name on this PAN becomes your legal business name.", "Verification is instant.", "Once saved it can only be changed through support."],
  },
};

/**
 * PAN_VERIFICATION (guide §4.5) — GST and NO_GST paths; verify → review →
 * save. GST path: the PAN is prefilled from verify-gst's `panFromGstin` (or
 * the saved GSTIN's characters 3–12 after a refresh).
 */
export default function PanVerificationStep() {
  const { kycPath } = useOnboardingFlow();
  const { brand } = useSavedBrand();
  const stored = useVerifyStore((s) => s.results.PAN);
  const gstResult = useVerifyStore((s) => s.results.GST);
  const [phase, setPhase] = useState(stored?.isVerified ? "review" : "enter");
  const [notice, setNotice] = useState("");
  const [refill, setRefill] = useState("");

  const copy = COPY[kycPath] ?? COPY[KYC_PATHS.NO_GST];
  const prefill =
    refill || (kycPath === KYC_PATHS.GST ? gstResult?.panFromGstin || brand?.gst?.gstNumber?.slice(2, 12) || "" : "");

  const showReview = useCallback(() => {
    setNotice("");
    setPhase("review");
  }, []);
  const showEnter = useCallback((message = "", refillPan = "") => {
    setNotice(message);
    setRefill(refillPan || "");
    setPhase("enter");
  }, []);

  if (phase === "review" && stored) return <PanReviewStep result={stored} onChangeDetails={showEnter} />;
  return (
    <>
      {notice && (
        <div className="mb-3">
          <FormError message={notice} />
        </div>
      )}
      <PanEnterStep key={prefill} kind="PAN" prefill={prefill} {...copy} onVerified={showReview} />
    </>
  );
}
