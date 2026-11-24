import { useCallback, useState } from "react";
import FormError from "../../components/ui/FormError";
import { useVerifyStore } from "../../store/verifyStore";
import BankEnterStep from "./BankEnterStep";
import BankReviewStep from "./BankReviewStep";

/**
 * BANK_VERIFICATION (guide §4.9) — one server screen: verify (paid penny
 * drop) → review → save, or skip.
 */
export default function BankVerificationStep() {
  const verified = useVerifyStore((s) => s.results.BANK);
  const [phase, setPhase] = useState(verified?.result?.isVerified ? "review" : "enter");
  const [notice, setNotice] = useState("");

  const showReview = useCallback(() => {
    setNotice("");
    setPhase("review");
  }, []);
  const showEnter = useCallback((message = "") => {
    setNotice(message);
    setPhase("enter");
  }, []);

  if (phase === "review" && verified) return <BankReviewStep verified={verified} onChangeDetails={showEnter} />;
  return (
    <>
      {notice && (
        <div className="mb-3">
          <FormError message={notice} />
        </div>
      )}
      <BankEnterStep onVerified={showReview} />
    </>
  );
}
