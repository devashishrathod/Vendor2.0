import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, FileText, X } from "lucide-react";
import Toaster from "@/features/onboarding-v2/components/ui/Toaster";
import { useOnboardingV2Store } from "@/features/onboarding-v2/store/onboardingStore";
import DocumentsEditor from "@/features/onboarding-v2/steps/verification/DocumentsEditor";
import {
  documentsStatus,
  documentsSubtitle,
  dropEmptyDocumentRows,
} from "@/features/onboarding-v2/steps/verification/documentsHelpers";

/**
 * "Add business documents" popup on the outlet review — the same editor the
 * onboarding Documents step uses, so documents added here land in the same
 * onboarding store the review reads.
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function AddDocumentsModal({ open, onClose }) {
  const branch = useOnboardingV2Store((s) => s.branch);
  const documents = useOnboardingV2Store((s) => s.form.documents);
  const { uploadedCount, anyUploading, unsavedCount, canFinish } = documentsStatus(documents);
  const categoryName = useOnboardingV2Store((s) => s.form.categoryName);
  const subCategories = useOnboardingV2Store((s) => s.form.subCategories);
  const entityType = useOnboardingV2Store((s) => s.form.entityType);
  const subtitle = documentsSubtitle({ categoryName, subCategories, entityType, branch });

  // Closing never loses an upload in flight: wait until it finishes.
  const close = useCallback(() => {
    if (anyUploading) return;
    dropEmptyDocumentRows();
    onClose();
  }, [anyUploading, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, close]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="add-docs-title">
      <Toaster />
      <button type="button" aria-label="Close" onClick={close} className="absolute inset-0 h-full w-full cursor-default bg-gray-900/50 backdrop-blur-sm" />

      <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-gray-800">
        <header className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 sm:px-6 dark:border-gray-700">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
            <FileText size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="add-docs-title" className="text-base font-extrabold text-gray-900 dark:text-gray-50">
              Add business documents
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-snug text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={anyUploading}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:hover:bg-gray-700"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6">
          <DocumentsEditor />
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3.5 sm:px-6 dark:border-gray-700 dark:bg-gray-900/40">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
            {anyUploading
              ? "Uploading…"
              : unsavedCount > 0
                ? `Save ${unsavedCount === 1 ? "the chosen file" : `${unsavedCount} chosen files`} first`
                : uploadedCount === 1
                  ? "1 document saved"
                  : `${uploadedCount} documents saved`}
          </p>
          <button
            type="button"
            onClick={close}
            disabled={!canFinish}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={16} strokeWidth={2.5} aria-hidden="true" />
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
