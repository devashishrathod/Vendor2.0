import { useCallback, useState } from "react";
import FormError from "../../components/ui/FormError";
import { useVerifyStore } from "../../store/verifyStore";
import GstEnterStep from "./GstEnterStep";
import GstReviewStep from "./GstReviewStep";

/**
 * GST_VERIFICATION (guide §4.4) — one server screen, two panel sub-steps:
 * verify (paid) → review → confirm & save. A verified, active result from this
 * session opens straight on review.
 */
export default function GstVerificationStep() {
  const stored = useVerifyStore((s) => s.results.GST);
  const reviewable = Boolean(stored?.isVerified && stored?.isActive !== false);
  const [phase, setPhase] = useState(reviewable ? "review" : "enter");
  const [notice, setNotice] = useState("");

  const showReview = useCallback(() => {
    setNotice("");
    setPhase("review");
  }, []);
  const showEnter = useCallback((message = "") => {
    setNotice(message);
    setPhase("enter");
  }, []);

  if (phase === "review" && stored) return <GstReviewStep result={stored} onChangeDetails={showEnter} />;
  return (
    <>
      {notice && (
        <div className="mb-3">
          <FormError message={notice} />
        </div>
      )}
      <GstEnterStep onVerified={showReview} />
    </>
  );
}
