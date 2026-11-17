import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ANALYTICS_EVENTS } from "@/constants/analytics";
import { trackEvent } from "@/utils/analytics";
import Button from "../../components/ui/Button";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { PARTNER_AGREEMENT_URL, PARTNER_TERMS, TERMS_URL } from "../../constants/onboardingOptions";
import { SCREENS } from "../../config/onboardingFlow";
import { SCREEN_ROUTES } from "../../config/routes";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { acceptPartnerContract } from "../../services/onboardingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import FormError from "../../components/ui/FormError";

// Pixels from the bottom that still count as "read to the end".
const END_THRESHOLD = 8;

/**
 * Screen 12 · Partner contract. The same deed summary the production panel
 * shows; the vendor must scroll to the end before the accept checkbox
 * unlocks. Accepting calls the real accept-partnership endpoint and moves on
 * to the plan page.
 */
export default function PartnerContractStep() {
  const { next } = useOnboardingFlow();
  const legalName = useOnboardingV2Store((s) => s.form.legalName);
  const ownerName = useOnboardingV2Store((s) => s.form.ownerKyc.panName);
  const acceptedAt = useOnboardingV2Store((s) => s.form.contractAcceptedAt);
  const setField = useOnboardingV2Store((s) => s.setField);
  const markCompleted = useOnboardingV2Store((s) => s.markCompleted);
  const navigate = useNavigate();

  const deedRef = useRef(null);
  const [readToEnd, setReadToEnd] = useState(Boolean(acceptedAt));
  const [agreed, setAgreed] = useState(Boolean(acceptedAt));
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  const businessName = legalName.trim() || ownerName || "your business";

  const checkReadToEnd = useCallback(() => {
    const el = deedRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - END_THRESHOLD) setReadToEnd(true);
  }, []);

  // A deed shorter than its box (large screens) is fully visible already;
  // the observer fires once on attach and again whenever the box resizes.
  useEffect(() => {
    const el = deedRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(checkReadToEnd);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkReadToEnd]);

  const handleAccept = useCallback(async () => {
    if (acceptedAt) {
      next();
      return;
    }
    setAccepting(true);
    setAcceptError("");
    try {
      const res = await acceptPartnerContract();
      setField("contractAcceptedAt", new Date().toISOString());
      // Same hand-off as the production deed step: the backend says which
      // post-deed page comes next (normally the plan page).
      const backendScreen = res?.data?.user?.currentScreen ?? res?.data?.currentScreen;
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETE, {
        step_name: "PARTNERSHIP_DEED",
        next_step: backendScreen ?? "SUBSCRIBE_PLAN",
      });
      const laterRoute = backendScreen && backendScreen !== "SUBSCRIBE_PLAN" ? SCREEN_ROUTES[backendScreen] : null;
      if (laterRoute) {
        markCompleted(SCREENS.PARTNER_CONTRACT);
        navigate(laterRoute);
      } else {
        next();
      }
    } catch (error) {
      console.error("Accepting partner contract failed:", error);
      setAcceptError(error?.message || "We couldn't record your acceptance. Please try again.");
    } finally {
      setAccepting(false);
    }
  }, [acceptedAt, markCompleted, navigate, next, setField]);

  return (
    <StepCard
      icon={PenLine}
      title="Trydood partner agreement"
      subtitle="Read and accept to finish onboarding."
      footer={
        <StepFooter start={<FormError message={acceptError} />}>
          <Button onClick={handleAccept} disabled={!(readToEnd && agreed)} loading={accepting} icon={ChevronRight}>
            Accept &amp; continue
          </Button>
        </StepFooter>
      }
    >
      <div
        ref={deedRef}
        onScroll={checkReadToEnd}
        tabIndex={0}
        aria-label="Partner agreement"
        className="max-h-[22rem] overflow-y-auto rounded-[14px] bg-gray-50 px-4 py-5 ring-1 ring-inset ring-gray-200 focus-visible:outline-2 focus-visible:outline-emerald-600 sm:max-h-[430px] sm:px-[26px] sm:py-[22px] dark:bg-gray-800/50 dark:ring-gray-700"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Between Trydood and <strong className="font-extrabold text-gray-900 dark:text-gray-100">{businessName}</strong>
        </p>
        <ol className="mt-5 flex flex-col gap-4">
          {PARTNER_TERMS.map((term, i) => (
            <li key={term.title}>
              <p className="text-[13.5px] font-bold text-gray-800 dark:text-gray-200">
                {i + 1}. {term.title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">{term.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          For the full legal document, open the{" "}
          <a
            href={PARTNER_AGREEMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-400"
          >
            Trydood partner agreement
          </a>{" "}
          and the{" "}
          <a
            href={TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-400"
          >
            terms &amp; conditions
          </a>
          .
        </p>
      </div>

      {!readToEnd && (
        <p className="text-xs text-gray-500 dark:text-gray-400" role="status">
          Scroll to the end of the agreement to enable Accept.
        </p>
      )}

      <label
        className={`flex min-h-11 items-start gap-3 rounded-xl bg-emerald-50 p-4 transition dark:bg-emerald-500/10 ${
          readToEnd ? "cursor-pointer" : "cursor-not-allowed opacity-60"
        }`}
      >
        <input
          type="checkbox"
          checked={agreed}
          disabled={!readToEnd || Boolean(acceptedAt)}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-emerald-500 disabled:cursor-not-allowed"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          I have read the agreement and accept it on behalf of <strong className="font-bold">{businessName}</strong>.
        </span>
      </label>
    </StepCard>
  );
}
