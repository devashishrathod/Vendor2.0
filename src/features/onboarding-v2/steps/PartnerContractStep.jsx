import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Download, ScrollText } from "lucide-react";
import Button from "../components/ui/Button";
import StepCard from "../components/ui/StepCard";
import StepFooter from "../components/ui/StepFooter";
import { PARTNER_AGREEMENT_URL, PARTNER_TERMS, TERMS_URL } from "../constants/onboardingOptions";
import { useOnboardingFlow } from "../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../store/onboardingStore";

// Pixels from the bottom that still count as "read to the end".
const END_THRESHOLD = 8;

export default function PartnerContractStep() {
  const { next } = useOnboardingFlow();
  const legalName = useOnboardingV2Store((s) => s.form.legalName);
  const accepted = useOnboardingV2Store((s) => s.form.contractAccepted);
  const setField = useOnboardingV2Store((s) => s.setField);
  const deedRef = useRef(null);
  const [readToEnd, setReadToEnd] = useState(accepted);

  const businessName = legalName.trim() || "your business";

  const checkReadToEnd = useCallback(() => {
    const el = deedRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - END_THRESHOLD) setReadToEnd(true);
  }, []);

  // A deed shorter than its box (large screens) is fully visible already.
  useEffect(() => {
    checkReadToEnd();
  }, [checkReadToEnd]);

  return (
    <StepCard
      icon={ScrollText}
      title="Trydood partner agreement"
      subtitle="Read and accept to finish onboarding."
      headerAside={
        <a
          href={PARTNER_AGREEMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-[13px] font-semibold text-gray-700 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700"
        >
          <Download size={15} strokeWidth={2} aria-hidden="true" />
          Download PDF
        </a>
      }
      footer={
        <StepFooter>
          <Button onClick={next} disabled={!accepted} icon={ArrowRight}>
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
        className="max-h-[22rem] overflow-y-auto rounded-xl bg-gray-50 p-4 ring-1 ring-inset ring-gray-200 focus-visible:outline-2 focus-visible:outline-emerald-600 sm:p-5 dark:bg-gray-800/50 dark:ring-gray-700"
      >
        <p className="text-xs text-gray-500">Between Trydood and</p>
        <p className="mt-0.5 text-[15px] font-extrabold text-gray-900 dark:text-gray-100">{businessName}</p>
        <ol className="mt-4 flex flex-col gap-4">
          {PARTNER_TERMS.map((term, i) => (
            <li key={term.title}>
              <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                {i + 1}. {term.title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">{term.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          For the full legal document, open the{" "}
          <a href={PARTNER_AGREEMENT_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            partner agreement
          </a>{" "}
          and the{" "}
          <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            terms &amp; conditions
          </a>
          .
        </p>
      </div>

      {!readToEnd && <p className="text-xs text-gray-500">Scroll to the end of the agreement to accept it.</p>}

      <label
        className={`flex items-start gap-3 rounded-xl p-4 ring-1 ring-inset transition ${
          readToEnd ? "cursor-pointer ring-gray-200 hover:bg-emerald-50/50 dark:ring-gray-700 dark:hover:bg-emerald-500/5" : "cursor-not-allowed opacity-60 ring-gray-200 dark:ring-gray-700"
        } ${accepted ? "bg-emerald-50/60 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30" : ""}`}
      >
        <input
          type="checkbox"
          checked={accepted}
          disabled={!readToEnd}
          onChange={(e) => setField("contractAccepted", e.target.checked)}
          className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          I have read the agreement and accept it on behalf of <strong className="font-bold">{businessName}</strong>.
        </span>
      </label>
    </StepCard>
  );
}
