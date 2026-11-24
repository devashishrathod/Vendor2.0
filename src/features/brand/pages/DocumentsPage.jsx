import { FileText } from "lucide-react";
import { useKycDocuments } from "@/features/onboarding-v2/hooks/useKycDocuments";
import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";
import DocumentsEditor from "@/features/onboarding-v2/steps/verification/DocumentsEditor";

/**
 * "Documents" tab — the brand's business documents (GET / POST / PUT /
 * DELETE /brands/onboarding/documents). After approval new ones can be
 * added; replacing or deleting an existing one is support's job (409
 * DETAIL_ALREADY_PROVIDED), so it's offered only while
 * `status.editable.documents.change` is true. A rejected document shows the
 * reason; upload a new one.
 */
const DocumentsPage = () => {
  const docs = useKycDocuments();
  const editable = useOnboardingStatusStore((s) => s.status?.editable?.documents);
  const canAdd = editable?.add !== false;
  const canChange = editable?.change === true;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
          <FileText className="h-4 w-4 text-emerald-500 dark:text-emerald-400" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Business Documents</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Licences and registration proof. {canChange ? "" : "You can add new ones — replacing or removing a saved one goes through support."}
          </p>
        </div>
      </div>
      <DocumentsEditor docs={docs} canAdd={canAdd} canChange={canChange} />
    </section>
  );
};

export default DocumentsPage;
