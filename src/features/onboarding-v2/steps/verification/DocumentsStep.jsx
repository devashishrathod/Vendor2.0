import { useCallback, useState } from "react";
import { ArrowRight, Check, FileText, TriangleAlert } from "lucide-react";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { KYC_PATHS, SCREENS } from "../../config/screens";
import { useKycDocuments } from "../../hooks/useKycDocuments";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { continueScreen, skipScreen } from "../../services/onboardingApi";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import DocumentsEditor from "./DocumentsEditor";
import { documentsSubtitle } from "./documentsHelpers";

/**
 * KYC_DOCUMENTS — "Business documents" (guide §4.8), all three paths,
 * skippable. ≥ 1 business document → POST continue; none → POST skip
 * { screen: KYC_DOCUMENTS }. Both answer with the next screen. When `hints`
 * contains FSSAI, skipping first shows the FSSAI warning (a warning only —
 * never matched on the category name). Opened again from Back, it only
 * edits documents (continue / skip work on the current screen only).
 */
export default function DocumentsStep() {
  const { status, kycPath, isViewingPast, closeScreen, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const docs = useKycDocuments();
  const [unsaved, setUnsaved] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [fssaiWarning, setFssaiWarning] = useState(false);

  const canAdd = status?.editable?.documents?.add !== false;
  const canChange = status?.editable?.documents?.change !== false;
  const hasDocuments = docs.count > 0;

  const move = useCallback(
    async (kind, call) => {
      setBusy(kind);
      setError("");
      try {
        const res = await call();
        goToServerScreen(res?.data?.currentScreen);
      } catch (err) {
        if (handleFlowError(err)) return;
        console.error(`Documents ${kind} failed:`, err);
        // 422 ONBOARDING_STEP_INCOMPLETE (missing DOCUMENT) / SCREEN_NOT_SKIPPABLE …
        setError(onboardingErrorMessage(err, "That didn't work. Please try again."));
      } finally {
        setBusy("");
      }
    },
    [goToServerScreen, handleFlowError],
  );

  const handleContinue = useCallback(() => move("continue", continueScreen), [move]);

  const handleSkip = useCallback(() => {
    if (docs.hints.includes("FSSAI") && !fssaiWarning) {
      setFssaiWarning(true);
      return;
    }
    move("skip", () => skipScreen(SCREENS.KYC_DOCUMENTS));
  }, [docs.hints, fssaiWarning, move]);

  const items = status?.items ?? {};
  const headerPills =
    kycPath === KYC_PATHS.UNREGISTERED ? (
      <StatusPill tone="warning">Not registered · no GST needed</StatusPill>
    ) : (
      <>
        {items.pan === "PROVIDED" && <StatusPill icon={Check}>PAN verified</StatusPill>}
        {items.gst === "PROVIDED" && <StatusPill icon={Check}>GST verified</StatusPill>}
      </>
    );

  let footerNote = hasDocuments ? `${docs.count} document${docs.count === 1 ? "" : "s"} saved` : "No documents yet — you can skip and add them later.";
  if (unsaved > 0) footerNote = `Save or discard ${unsaved === 1 ? "the new document" : `${unsaved} new documents`} first`;

  let actions;
  if (isViewingPast) {
    actions = (
      <Button onClick={closeScreen} disabled={unsaved > 0} icon={ArrowRight}>
        Done
      </Button>
    );
  } else if (hasDocuments) {
    actions = (
      <Button onClick={handleContinue} disabled={unsaved > 0} loading={busy === "continue"} icon={ArrowRight}>
        Continue to Bank
      </Button>
    );
  } else {
    actions = (
      <Button variant="secondary" onClick={handleSkip} disabled={unsaved > 0 || docs.loading} loading={busy === "skip"}>
        {fssaiWarning ? "Skip anyway" : "Skip for now"}
      </Button>
    );
  }

  return (
    <StepCard
      icon={FileText}
      title="Add your business documents"
      subtitle={documentsSubtitle(kycPath)}
      headerAside={headerPills}
      footer={
        <StepFooter start={<p className="text-xs font-bold text-gray-600 dark:text-gray-400">{footerNote}</p>}>{actions}</StepFooter>
      }
    >
      <DocumentsEditor docs={docs} canAdd={canAdd} canChange={canChange} onDraftsChange={setUnsaved} />

      {fssaiWarning && !hasDocuments && (
        <Notice tone="warning" icon={TriangleAlert} title="FSSAI licence">
          An FSSAI licence is legally required for a food business. You can still skip now and add it later from your profile.
        </Notice>
      )}

      <FormError message={error} />
    </StepCard>
  );
}
