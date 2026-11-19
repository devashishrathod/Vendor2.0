import { useCallback, useState } from "react";
import { Check, ExternalLink, FileText, Info, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ANALYTICS_EVENTS } from "@/constants/analytics";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { trackEvent } from "@/utils/analytics";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { SCREENS } from "../../config/onboardingFlow";
import { SCREEN_ROUTES } from "../../config/routes";
import { PARTNER_AGREEMENT_URL, PARTNER_TERMS, SUPPORT_EMAIL, TERMS_URL } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { acceptPartnerContract } from "../../services/onboardingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";

const LINK_CLASS = "font-semibold text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400";

/** "Terms & Conditions Summary" panel — same content as the old deed step. */
function TermsSummary() {
  return (
    <div className="flex flex-col gap-4 rounded-[14px] bg-gray-50 p-5 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Terms &amp; Conditions Summary</p>
      <ol className="flex flex-col gap-3">
        {PARTNER_TERMS.map((term, i) => (
          <li key={term.title} className="flex gap-3">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              {i + 1}
            </span>
            <div>
              <p className="mb-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">{term.title}</p>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{term.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t border-gray-200 pt-3 text-xs leading-relaxed text-gray-500 dark:border-gray-700 dark:text-gray-400">
        For the full legal document, open the partner agreement link. Contact{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK_CLASS}>
          {SUPPORT_EMAIL}
        </a>{" "}
        for any queries.
      </p>
    </div>
  );
}

/**
 * Screen 12 · Partner Deed Agreement. Same content as the old onboarding's
 * deed step (Step14PartnerContract): deed document link, terms summary and
 * the agree checkbox. Accepting calls the real accept-partnership endpoint
 * and moves on to the plan page (or wherever the backend says is next).
 */
export default function PartnerContractStep() {
  const { next, goTo } = useOnboardingFlow();
  const acceptedAt = useOnboardingV2Store((s) => s.form.contractAcceptedAt);
  const setField = useOnboardingV2Store((s) => s.setField);
  const markCompleted = useOnboardingV2Store((s) => s.markCompleted);
  const navigate = useNavigate();

  const locked = Boolean(acceptedAt);
  const [agreed, setAgreed] = useState(locked);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

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
      // Same hand-off as the old deed step: the backend says which
      // post-deed page comes next (normally the plan page).
      const backendScreen = res?.data?.user?.currentScreen ?? res?.data?.currentScreen;
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETE, {
        step_name: "PARTNERSHIP_DEED",
        next_step: backendScreen ?? "SUBSCRIBE_PLAN",
      });
      // Keep the logged-in screen in step with the backend (forward-only), so
      // "/", the back-button guard and a refresh resume on the right page.
      useAuthStore.getState().advanceScreen(backendScreen ?? "SUBSCRIBE_PLAN");
      const laterRoute = backendScreen && backendScreen !== "SUBSCRIBE_PLAN" ? SCREEN_ROUTES[backendScreen] : null;
      if (laterRoute) {
        // Plan already granted: the wizard must not resume on the contract
        // (whose Continue would lead to the plan page the backend skipped).
        markCompleted(SCREENS.PARTNER_CONTRACT);
        markCompleted(SCREENS.PLAN);
        markCompleted(SCREENS.PAYMENT);
        goTo(SCREENS.OUTLET);
        navigate(laterRoute);
      } else {
        next();
      }
    } catch (error) {
      console.error("Accepting partner contract failed:", error);
      setAcceptError(error?.message || "Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }, [acceptedAt, goTo, markCompleted, navigate, next, setField]);

  let buttonLabel = "Subscription Plan";
  if (accepting) buttonLabel = "Processing...";

  return (
    <StepCard
      icon={FileText}
      title="Partner Deed Agreement"
      subtitle={locked ? "Agreement already submitted" : "Review and accept to complete onboarding"}
      footer={
        <StepFooter start={<FormError message={acceptError} />}>
          <Button
            onClick={handleAccept}
            disabled={!agreed}
            loading={accepting}
            icon={locked ? Lock : Check}
            iconPosition="start"
          >
            {buttonLabel}
          </Button>
        </StepFooter>
      }
    >
      <div className="rounded-[14px] bg-gray-50 p-4 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Partnership Deed Document</p>
        <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          You&apos;re nearly there! Review and sign the digital contract below to finish onboarding with Trydood.
        </p>
        <a
          href={PARTNER_AGREEMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 text-sm ${LINK_CLASS}`}
        >
          <ExternalLink size={14} aria-hidden="true" />
          Open Trydood Partner Agreement ↗
        </a>
      </div>

      <TermsSummary />

      <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
        <Info size={14} className="mr-1 shrink-0 text-emerald-500" aria-hidden="true" />
        Also review the full{" "}
        <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          Terms &amp; Conditions
        </a>{" "}
        before accepting.
      </p>

      <label
        className={`flex min-h-11 items-start gap-3 rounded-xl p-4 transition ${
          locked
            ? "cursor-not-allowed bg-emerald-50/60 dark:bg-emerald-500/10"
            : `cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-emerald-500/10 ${agreed ? "bg-emerald-50/60 dark:bg-emerald-500/10" : "bg-gray-50 dark:bg-gray-800/50"}`
        }`}
      >
        <input
          type="checkbox"
          checked={locked || agreed}
          disabled={locked}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-emerald-500 disabled:cursor-not-allowed"
        />
        <span className="text-sm text-gray-600 dark:text-gray-300">
          I have read and agree to the{" "}
          <a href={PARTNER_AGREEMENT_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            Trydood Partner Agreement
          </a>{" "}
          and all associated{" "}
          <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            terms and conditions
          </a>
          .
        </span>
      </label>
    </StepCard>
  );
}
