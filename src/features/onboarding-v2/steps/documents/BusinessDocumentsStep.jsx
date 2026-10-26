import { useMemo } from "react";
import { ArrowRight, Check, FileText, Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import DocumentRow from "../../components/ui/DocumentRow";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { BRANCHES, SCREENS, resolveBranch } from "../../config/onboardingFlow";
import { DOCUMENT_SUGGESTIONS, LICENCES, SAMPLE_CATEGORIES } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";

const COPY = {
  [BRANCHES.REGISTERED]: "Add as many as you have. Give each one a title so our team knows what it is.",
  [BRANCHES.UNREGISTERED]:
    "Owner ID, business licence and shop proof help us approve you faster. Add as many as you have, each with a title.",
};

const normalizeTitle = (title) => title.trim().toLowerCase();

/** Shared by both paths — registered (after GST) and unregistered (step 2). */
export default function BusinessDocumentsStep() {
  const { next, skip, isCompleted, isSkipped } = useOnboardingFlow();
  const branch = resolveBranch(useOnboardingV2Store((s) => s.branch));
  const documents = useOnboardingV2Store((s) => s.form.documents);
  const categoryId = useOnboardingV2Store((s) => s.form.categoryId);
  const subCategory = useOnboardingV2Store((s) => s.form.subCategory);
  const addDocument = useOnboardingV2Store((s) => s.addDocument);
  const updateDocument = useOnboardingV2Store((s) => s.updateDocument);
  const removeDocument = useOnboardingV2Store((s) => s.removeDocument);

  const isRegistered = branch === BRANCHES.REGISTERED;
  const licence = SAMPLE_CATEGORIES.find((c) => c.id === categoryId)?.licence ?? LICENCES.GENERAL;

  const suggestions = useMemo(() => {
    const titles = DOCUMENT_SUGGESTIONS[branch].map((title) => title ?? licence);
    return [...new Set(titles)];
  }, [branch, licence]);

  const addedTitles = useMemo(() => new Set(documents.map((d) => normalizeTitle(d.title))), [documents]);
  const completeDocs = documents.filter((d) => d.fileName && d.title.trim());
  const hasIncomplete = documents.some((d) => Boolean(d.fileName) !== Boolean(d.title.trim()));
  const canContinue = completeDocs.length > 0 && !hasIncomplete;

  // Empty rows are dropped on continue — they were never filled in.
  const handleContinue = () => {
    documents.filter((d) => !d.fileName && !d.title.trim()).forEach((d) => removeDocument(d.id));
    next();
  };

  const verificationPill = (screen, reviewScreen, label) => {
    if (isCompleted(reviewScreen)) return <StatusPill icon={Check}>{label} verified</StatusPill>;
    if (isSkipped(screen)) return <StatusPill tone="neutral">{label} skipped</StatusPill>;
    return null;
  };

  return (
    <StepCard
      icon={FileText}
      title="Add your business documents"
      subtitle={COPY[branch]}
      headerAside={
        isRegistered ? (
          <>
            {verificationPill(SCREENS.PAN_VERIFICATION, SCREENS.PAN_REVIEW, "PAN")}
            {verificationPill(SCREENS.GST_VERIFICATION, SCREENS.GST_REVIEW, "GST")}
          </>
        ) : (
          <StatusPill tone="warning">Unregistered · no PAN / GST needed</StatusPill>
        )
      }
      footer={
        <StepFooter
          start={
            <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
              {completeDocs.length === 1 ? "1 document added" : `${completeDocs.length} documents added`}
            </p>
          }
        >
          <Button variant="secondary" onClick={skip}>
            Skip for now
          </Button>
          <Button onClick={handleContinue} disabled={!canContinue} icon={ArrowRight}>
            Continue to Bank
          </Button>
        </StepFooter>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-full text-[11px] font-bold text-gray-600 sm:w-auto dark:text-gray-400">
          Suggested{subCategory ? ` for ${subCategory}` : ""}:
        </span>
        {suggestions.map((title) => {
          const added = addedTitles.has(normalizeTitle(title));
          return (
            <button
              key={title}
              type="button"
              disabled={added}
              onClick={() => addDocument(title)}
              className={`min-h-9 rounded-full px-3 text-xs transition ${
                added
                  ? "cursor-default bg-gray-100 font-semibold text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                  : "bg-emerald-50 font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30"
              }`}
            >
              {added ? `✓ ${title}` : `+ ${title}`}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        {documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            onChange={(patch) => updateDocument(doc.id, patch)}
            onRemove={() => removeDocument(doc.id)}
          />
        ))}
        <button
          type="button"
          onClick={() => addDocument()}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-emerald-700 ring-[1.5px] ring-inset ring-emerald-200 transition hover:bg-emerald-50 dark:text-emerald-400 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/10"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          {documents.length ? "Add another document" : "Add a document"}
        </button>
      </div>

      <p className="text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-400">
        PDF works best. JPG or PNG at least 800 px on the short side. Up to 5 MB each. A title is required for every document.
      </p>
    </StepCard>
  );
}
