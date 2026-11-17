import { useCallback, useId, useRef, useState } from "react";
import { Check, Eye, FileImage, FileText, LoaderCircle, Pencil, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import { DOCUMENT_RULES } from "../../constants/onboardingOptions";
import { checkDocumentFile, formatFileSize } from "../../validation/rules";
import StatusPill from "./StatusPill";

const ROW_TONES = {
  empty: "bg-gray-50 ring-[1.5px] ring-gray-300 dark:bg-gray-800/50 dark:ring-gray-700",
  selected: "bg-white ring-[1.5px] ring-amber-300 dark:bg-gray-900 dark:ring-amber-500/40",
  uploading: "bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700",
  uploaded: "bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30",
};

const SMALL_BUTTON =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[10px] px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
const OUTLINE = "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-800";

/**
 * One business document row: a title plus its file, in one of four states —
 * empty ("Choose file", only once there's a title), selected (file chosen
 * but not uploaded: Preview · Save · Change), uploading (progress + Cancel)
 * or uploaded (Preview · Replace). Nothing uploads until Save. The file is
 * checked here (type, size, image resolution) before it's accepted.
 * @param {{
 *   document: import('../../store/onboardingStore').BusinessDocument,
 *   placeholder?: string,
 *   error?: string,
 *   onTitleChange: (title: string) => void,
 *   onFileSelected: (file: File) => void,   - stage the file (no upload)
 *   onSave: () => void,                     - upload the staged file
 *   onPreview: () => void,
 *   onCancel: () => void,                   - stop an upload in flight
 *   onRemove: () => void,
 * }} props
 */
export default function DocumentRow({
  document,
  placeholder = "e.g. Trade licence 2026",
  error = "",
  onTitleChange,
  onFileSelected,
  onSave,
  onPreview,
  onCancel,
  onRemove,
}) {
  const titleId = useId();
  const fileInputRef = useRef(null);
  const [checking, setChecking] = useState(false);
  const [fileError, setFileError] = useState("");
  // A row with a title shows it as text with a pencil; the pencil (or an
  // empty title) switches to the input.
  const [editingTitle, setEditingTitle] = useState(false);

  const status = document.status;
  const isSelected = status === "selected";
  const isUploading = status === "uploading";
  const isUploaded = status === "uploaded";
  const hasFile = Boolean(document.fileName);
  const hasTitle = Boolean(document.title.trim());
  const missingTitle = hasFile && !hasTitle;
  const isImage = /\.(jpe?g|png)$/i.test(document.fileName ?? "");
  const FileIcon = hasFile ? (isImage ? FileImage : FileText) : Upload;
  const progress = Math.round(document.progress || 0);

  const handleFile = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      setChecking(true);
      setFileError("");
      try {
        const problem = await checkDocumentFile(file);
        setFileError(problem);
        if (!problem) onFileSelected(file);
      } catch (checkError) {
        console.error("Document file check failed:", checkError);
        setFileError("We couldn't read this file. Try another one.");
      } finally {
        setChecking(false);
      }
    },
    [onFileSelected],
  );

  const openPicker = useCallback(() => fileInputRef.current?.click(), []);
  const message = fileError || error || (missingTitle ? "Add a title so our team knows what this document is." : "");

  return (
    <div className={`rounded-xl p-3.5 ring-inset ${ROW_TONES[status] ?? ROW_TONES.empty}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${
              isUploaded
                ? "bg-white text-emerald-600 dark:bg-gray-900"
                : "bg-white text-gray-500 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700"
            }`}
          >
            <FileIcon size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <label
              htmlFor={editingTitle || !hasTitle ? titleId : undefined}
              className={`block text-xs ${isUploaded ? "font-semibold text-emerald-700 dark:text-emerald-400" : "font-medium text-gray-500 dark:text-gray-400"}`}
            >
              Document title <span className="text-red-500">*</span>
            </label>
            {editingTitle || !hasTitle ? (
              <div className="mt-0.5 flex items-center gap-1.5">
                <input
                  id={titleId}
                  type="text"
                  value={document.title}
                  maxLength={DOCUMENT_RULES.maxTitleLength}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onBlur={() => hasTitle && setEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && hasTitle) setEditingTitle(false);
                  }}
                  placeholder={placeholder}
                  aria-invalid={missingTitle || undefined}
                  autoFocus={editingTitle}
                  className="w-full min-w-0 border-0 bg-transparent p-0 py-1 text-base font-extrabold text-gray-900 shadow-none outline-none ring-0 placeholder:font-semibold placeholder:text-gray-400 focus:border-0 focus:outline-none focus:ring-0 sm:text-sm dark:text-gray-100"
                />
                {editingTitle && hasTitle && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setEditingTitle(false)}
                    aria-label="Done editing title"
                    className="grid size-7 shrink-0 place-items-center rounded-md text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                  >
                    <Check size={15} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-0.5 flex min-w-0 items-center gap-1">
                <p id={titleId} className="truncate py-1 text-base font-extrabold text-gray-900 sm:text-sm dark:text-gray-100">
                  {document.title}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingTitle(true)}
                  aria-label={`Edit title ${document.title}`}
                  title="Edit title"
                  className="grid size-7 shrink-0 place-items-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-800 dark:hover:text-emerald-400"
                >
                  <Pencil size={13} aria-hidden="true" />
                </button>
              </div>
            )}
            {hasFile && !isUploading && (
              <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11.5px] text-gray-600 dark:text-gray-400">
                <span className="truncate" title={document.fileName ?? ""}>
                  {document.fileName}
                </span>
                {document.fileSize ? <span className="shrink-0">· {formatFileSize(document.fileSize)}</span> : null}
              </p>
            )}
          </div>
        </div>

        {isUploading ? (
          <div className="flex items-center gap-2 sm:w-auto">
            <div className="min-w-0 flex-1 sm:w-48 sm:flex-none" role="status">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-semibold text-gray-700 dark:text-gray-300" title={document.fileName ?? ""}>
                  Uploading…
                </span>
                <span className="shrink-0 font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{progress}%</span>
              </div>
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={`Uploading ${document.fileName ?? "document"}`}
              >
                <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button type="button" onClick={onCancel} className={`${SMALL_BUTTON} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
            {isUploaded && <StatusPill>Saved</StatusPill>}
            {isSelected && <StatusPill tone="warning">Not saved</StatusPill>}
            <div className="ml-auto flex items-center gap-1.5">
              {hasFile && (
                <button type="button" onClick={onPreview} className={`${SMALL_BUTTON} ${OUTLINE}`}>
                  <Eye size={14} aria-hidden="true" />
                  Preview
                </button>
              )}
              {isSelected ? (
                <>
                  <button
                    type="button"
                    onClick={openPicker}
                    disabled={checking}
                    title="Choose a different file"
                    className={`${SMALL_BUTTON} ${OUTLINE}`}
                  >
                    {checking ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}
                    {checking ? "Checking…" : "Replace"}
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={!hasTitle}
                    title={hasTitle ? undefined : "Type a document title first"}
                    className={`${SMALL_BUTTON} bg-emerald-600 text-white hover:bg-emerald-700`}
                  >
                    <Save size={14} aria-hidden="true" />
                    Save
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openPicker}
                  disabled={checking || !hasTitle}
                  title={hasTitle ? undefined : "Type a document title first"}
                  className={`${SMALL_BUTTON} ${isUploaded ? OUTLINE : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                >
                  {checking ? (
                    <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
                  ) : isUploaded ? (
                    <RefreshCw size={14} aria-hidden="true" />
                  ) : (
                    <Upload size={14} aria-hidden="true" />
                  )}
                  {checking ? "Checking…" : isUploaded ? "Replace" : "Choose file"}
                </button>
              )}
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
        )}
      </div>

      <input ref={fileInputRef} type="file" accept={DOCUMENT_RULES.accept} onChange={handleFile} className="sr-only" tabIndex={-1} aria-hidden="true" />

      {!hasTitle && !hasFile && !message && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Type a title first, then choose the file.</p>
      )}
      {isSelected && !message && (
        <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">Check it with Preview, then press Save to upload.</p>
      )}
      {message && (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
