import { useId, useRef, useState } from "react";
import { FileImage, FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import { DOCUMENT_RULES } from "../../constants/onboardingOptions";
import { checkDocumentFile, formatFileSize } from "../../validation/rules";
import StatusPill from "./StatusPill";

/**
 * One business document: editable title + its file. Empty rows show a
 * "Choose file" button; filled rows show the file with Replace / Remove.
 * Stacks into a card on phones.
 * @param {{
 *   document: import('../../store/onboardingStore').BusinessDocument,
 *   onChange: (patch: Partial<import('../../store/onboardingStore').BusinessDocument>) => void,
 *   onRemove: () => void,
 * }} props
 */
export default function DocumentRow({ document, onChange, onRemove }) {
  const titleId = useId();
  const fileInputRef = useRef(null);
  const [checking, setChecking] = useState(false);
  const [fileError, setFileError] = useState("");

  const hasFile = Boolean(document.fileName);
  const missingTitle = hasFile && !document.title.trim();
  const isImage = /\.(jpe?g|png)$/i.test(document.fileName ?? "");
  const FileIcon = hasFile ? (isImage ? FileImage : FileText) : Upload;

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setChecking(true);
    const problem = await checkDocumentFile(file);
    setChecking(false);
    setFileError(problem);
    if (!problem) onChange({ fileName: file.name, fileSize: file.size });
  };

  const openPicker = () => fileInputRef.current?.click();

  return (
    <div
      className={`rounded-xl p-3.5 ring-1 ring-inset ${
        hasFile
          ? "bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30"
          : "bg-gray-50 ring-gray-300 dark:bg-gray-800/50 dark:ring-gray-700"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white text-emerald-600 dark:bg-gray-900">
            <FileIcon size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <label htmlFor={titleId} className={`block text-xs ${hasFile ? "font-semibold text-emerald-700 dark:text-emerald-400" : "font-medium text-gray-500"}`}>
              Document title <span className="text-red-500">*</span>
            </label>
            <input
              id={titleId}
              type="text"
              value={document.title}
              maxLength={DOCUMENT_RULES.maxTitleLength}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Trade licence 2026"
              aria-invalid={missingTitle || undefined}
              className="mt-0.5 w-full rounded-md bg-transparent py-1 text-base font-extrabold text-gray-900 outline-none placeholder:font-semibold placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-emerald-500/40 sm:text-sm dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          {hasFile && (
            <>
              <span className="min-w-0 truncate text-xs font-semibold text-gray-700 sm:max-w-48 dark:text-gray-300" title={document.fileName}>
                {document.fileName} · {formatFileSize(document.fileSize)}
              </span>
              <StatusPill>Added</StatusPill>
            </>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={openPicker}
              disabled={checking}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-[10px] px-3.5 text-xs font-bold transition disabled:opacity-60 ${
                hasFile
                  ? "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {checking && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}
              {checking ? "Checking…" : hasFile ? "Replace" : "Choose file"}
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${document.title || "document"}`}
              className="grid size-10 place-items-center rounded-[10px] text-red-700 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={DOCUMENT_RULES.accept}
        onChange={handleFile}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {(fileError || missingTitle) && (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {fileError || "Add a title so our team knows what this document is."}
        </p>
      )}
    </div>
  );
}
