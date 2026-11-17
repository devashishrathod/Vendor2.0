import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Building2, Check, CircleHelp, Receipt, Store, TriangleAlert, Lock } from "lucide-react";
import Button from "../../components/ui/Button";
import Notice from "../../components/ui/Notice";
import OptionCard from "../../components/ui/OptionCard";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { BRANCHES } from "../../config/onboardingFlow";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { fetchGstMandatoryCategoryIds } from "../../services/pendingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { selectStatusLocked } from "../../utils/statusLock";

const STATUS_OPTIONS = [
  {
    branch: BRANCHES.GST,
    icon: Receipt,
    title: "I have GST",
    description: "GSTIN for this business, any business entity.",
    pill: "Fastest · 1 number fills most details",
    verified: true,
    nextItems: [
      "GSTIN (verified instantly)",
      "Business PAN (verified instantly)",
      "Business entity (auto-selected from GST)",
      "Business documents · optional",
    ],
  },
  {
    branch: BRANCHES.REG_NO_GST,
    icon: Building2,
    title: "Registered, no GST",
    description: "Company, LLP, firm, trust or society without a GSTIN yet.",
    pill: "Business PAN needed",
    verified: true,
    nextItems: [
      "Business or personal PAN (verified instantly)",
      "Business entity (auto-selected from your PAN)",
      "Business documents · optional",
    ],
  },
  {
    branch: BRANCHES.UNREGISTERED,
    icon: Store,
    title: "Not registered",
    description: "Small shop, home business or new venture.",
    pill: "No GST needed · sell in your state",
    verified: false,
    nextItems: ["Owner verification", "Business entity (recommended for you)", "Business documents · optional"],
  },
];

/** "Pill + Next you'll add" block inside each radio card. */
function NextItems({ option, selected }) {
  return (
    <span className="flex flex-col gap-3">
      <StatusPill tone={selected ? "success" : "neutral"}>{option.pill}</StatusPill>
      <span className="block border-t border-gray-200 pt-3 dark:border-gray-700">
        <span className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Next you&apos;ll add
        </span>
        <span className="mt-1.5 flex flex-col gap-1">
          {option.nextItems.map((item) => (
            <span key={item} className="flex items-start gap-1.5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              {option.verified ? (
                <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
              )}
              {item}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

/**
 * Screen 05 · Business status. Picks the Step 2 path (GST / registered
 * without GST / not registered). GST-mandatory categories only allow GST.
 */
export default function BusinessStatusStep() {
  const { chooseBranch } = useOnboardingFlow();
  const storedBranch = useOnboardingV2Store((s) => s.branch);
  const categoryId = useOnboardingV2Store((s) => s.form.categoryId);
  const categoryName = useOnboardingV2Store((s) => s.form.categoryName);
  // Locked once this path's business verification is done.
  const statusLocked = useOnboardingV2Store(selectStatusLocked);

  const [picked, setSelected] = useState(storedBranch ?? BRANCHES.GST);
  const selected = statusLocked ? storedBranch : picked;
  const lockedTitle = STATUS_OPTIONS.find((o) => o.branch === storedBranch)?.title;
  const [gstOnly, setGstOnly] = useState(false);
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setChecking(true);
        setCheckError("");
        const ids = await fetchGstMandatoryCategoryIds();
        if (cancelled) return;
        const mandatory = Array.isArray(ids) && ids.map(String).includes(String(categoryId));
        setGstOnly(mandatory);
        if (mandatory) setSelected(BRANCHES.GST);
      } catch (err) {
        console.error("GST-mandatory categories fetch failed:", err);
        if (!cancelled) setCheckError("We couldn't check whether your category needs GST.");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [categoryId, attempt]);

  const retryCheck = useCallback(() => setAttempt((n) => n + 1), []);
  const handleContinue = useCallback(() => chooseBranch(selected), [chooseBranch, selected]);

  return (
    <StepCard
      icon={CircleHelp}
      title="Which one describes your business?"
      subtitle="This decides what we verify next. All three can sell on Trydood."
      footer={
        <StepFooter>
          <Button onClick={handleContinue} disabled={checking || Boolean(checkError)} loading={checking} icon={ArrowRight}>
            Continue
          </Button>
        </StepFooter>
      }
    >
      <div role="group" aria-label="Business status" className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STATUS_OPTIONS.map((option) => {
          const isSelected = selected === option.branch;
          return (
            <OptionCard
              key={option.branch}
              icon={option.icon}
              title={option.title}
              description={option.description}
              selected={isSelected}
              disabled={statusLocked ? option.branch !== storedBranch : gstOnly && option.branch !== BRANCHES.GST}
              onSelect={() => setSelected(option.branch)}
            >
              <NextItems option={option} selected={isSelected} />
            </OptionCard>
          );
        })}
      </div>

      {statusLocked && (
        <Notice icon={Lock}>
          <strong className="font-bold">Locked — your business verification is done.</strong> Your business status stays
          &ldquo;{lockedTitle}&rdquo;. To change it, contact support.
        </Notice>
      )}

      {gstOnly && !statusLocked && (
        <Notice tone="warning" icon={TriangleAlert}>
          {categoryName || "Your category"} needs GST to sell on Trydood, so only the first option is available for it.
        </Notice>
      )}

      {checkError && (
        <Notice
          tone="error"
          action={
            <Button variant="secondary" onClick={retryCheck} className="min-h-9 px-3 text-xs">
              Retry
            </Button>
          }
        >
          {checkError}
        </Notice>
      )}

      {!statusLocked && <Notice>Picked the wrong one? You can come back and change it before you submit for review.</Notice>}
    </StepCard>
  );
}
