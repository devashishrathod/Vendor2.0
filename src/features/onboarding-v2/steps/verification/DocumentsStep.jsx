import { useCallback } from "react";
import { ArrowRight, Check, FileText } from "lucide-react";
import Button from "../../components/ui/Button";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { BRANCHES } from "../../config/onboardingFlow";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import DocumentsEditor from "./DocumentsEditor";
import { documentsStatus, documentsSubtitle, dropEmptyDocumentRows } from "./documentsHelpers";

/**
 * Screen 09 / 09u · Business documents. The editor itself (chips, rows,
 * uploads) is DocumentsEditor, shared with the outlet review's "Add
 * documents" popup; this screen adds the step frame, skip and Continue.
 */
export default function DocumentsStep() {
  const { next, skip, branch } = useOnboardingFlow();
  const documents = useOnboardingV2Store((s) => s.form.documents);
  const panDetails = useOnboardingV2Store((s) => s.form.panDetails);
  const gstDetails = useOnboardingV2Store((s) => s.form.gstDetails);

  const isUnregistered = branch === BRANCHES.UNREGISTERED;
  const categoryName = useOnboardingV2Store((s) => s.form.categoryName);
  const subCategories = useOnboardingV2Store((s) => s.form.subCategories);
  const entityType = useOnboardingV2Store((s) => s.form.entityType);
  const subtitle = documentsSubtitle({ categoryName, subCategories, entityType, branch });
  const { uploadedCount, anyUploading, unsavedCount, canFinish } = documentsStatus(documents);

  const handleContinue = useCallback(() => {
    dropEmptyDocumentRows();
    next();
  }, [next]);

  const headerPills = isUnregistered ? (
    <StatusPill tone="warning">Unregistered · no GST needed</StatusPill>
  ) : (
    <>
      {panDetails && <StatusPill icon={Check}>PAN verified</StatusPill>}
      {branch === BRANCHES.GST && gstDetails && <StatusPill icon={Check}>GST verified</StatusPill>}
    </>
  );

  return (
    <StepCard
      icon={FileText}
      title="Add your business documents"
      subtitle={subtitle}
      headerAside={headerPills}
      footer={
        <StepFooter
          start={
            <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
              {unsavedCount > 0
                ? `Save ${unsavedCount === 1 ? "the chosen document" : `${unsavedCount} chosen documents`} to continue`
                : uploadedCount === 1
                  ? "1 document saved"
                  : `${uploadedCount} documents saved`}
            </p>
          }
        >
          <Button variant="secondary" onClick={skip} disabled={anyUploading}>
            Skip for now
          </Button>
          <Button onClick={handleContinue} disabled={!canFinish} icon={ArrowRight}>
            Continue to Bank
          </Button>
        </StepFooter>
      }
    >
      <DocumentsEditor />
    </StepCard>
  );
}
