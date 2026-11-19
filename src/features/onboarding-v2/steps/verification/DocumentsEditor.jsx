import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Eye, FileText, LoaderCircle, Pencil, Plus, RefreshCw, Save, Trash2, Upload, X } from "lucide-react";
import DocumentPreviewModal from "../../components/ui/DocumentPreviewModal";
import FormError from "../../components/ui/FormError";
import StatusPill from "../../components/ui/StatusPill";
import { DOCUMENT_RULES, OWNER_ID_TYPES, docTypeLabel } from "../../constants/onboardingOptions";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { checkDocumentFile, formatFileSize } from "../../validation/rules";

const SMALL_BUTTON =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[10px] px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
const OUTLINE = "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-800";
const PRIMARY = "bg-emerald-600 text-white hover:bg-emerald-700";

// Document review status (API doc #23b).
const STATUS_PILLS = {
  UPLOADED: { tone: "neutral", label: "Uploaded" },
  ACCEPTED: { tone: "success", label: "Accepted" },
  REJECTED: { tone: "danger", label: "Rejected" },
};

const titleValid = (title) => {
  const length = title.trim().length;
  return length >= DOCUMENT_RULES.minTitleLength && length <= DOCUMENT_RULES.maxTitleLength;
};

let draftSeq = 0;
const newDraft = (title = "", docType = null) => ({ id: `draft-${++draftSeq}`, title, docType, file: null });

/** Picks a file, checks type / size / resolution, then hands it over. */
function useFilePicker(onPicked) {
  const inputRef = useRef(null);
  const [checking, setChecking] = useState(false);
  const [fileError, setFileError] = useState("");

  const onChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      setChecking(true);
      setFileError("");
      const problem = await checkDocumentFile(file);
      setChecking(false);
      if (problem) setFileError(problem);
      else onPicked(file);
    },
    [onPicked],
  );

  const input = (
    <input ref={inputRef} type="file" accept={DOCUMENT_RULES.accept} onChange={onChange} className="sr-only" tabIndex={-1} aria-hidden="true" />
  );
  return { open: () => inputRef.current?.click(), checking, fileError, input };
}

/** The owner's ID (unregistered path) — shown first, changed only in Owner verification. */
function OwnerIdRow({ document, onPreview }) {
  const pill = STATUS_PILLS[document.status];
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3.5 ring-1 ring-inset ring-gray-200 sm:flex-row sm:items-center dark:bg-gray-800/50 dark:ring-gray-700">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Owner ID</p>
        <p className="truncate text-sm font-extrabold text-gray-900 dark:text-gray-100">
          {OWNER_ID_TYPES.find((t) => t.value === document.idType)?.label ?? document.title}
        </p>
        <p className="text-[11.5px] text-gray-500 dark:text-gray-400">Change it in Owner verification.</p>
      </div>
      <div className="flex items-center gap-1.5">
        {pill && <StatusPill tone={pill.tone}>{pill.label}</StatusPill>}
        <button type="button" onClick={onPreview} className={`${SMALL_BUTTON} ${OUTLINE}`}>
          <Eye size={14} aria-hidden="true" />
          Preview
        </button>
      </div>
    </div>
  );
}

/** A business document saved on the server: preview, rename, replace, delete. */
function SavedRow({ document, canChange, onPreview, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(async (kind, action) => {
    setBusy(kind);
    setError("");
    try {
      await action();
      return true;
    } catch (err) {
      console.error(`Document ${kind} failed:`, err);
      setError(onboardingErrorMessage(err, "That didn't work. Please try again."));
      return false;
    } finally {
      setBusy("");
    }
  }, []);

  const replace = useFilePicker(useCallback((file) => run("replace", () => onUpdate(document._id, { file })), [document._id, onUpdate, run]));
  const saveTitle = async () => {
    if (!titleValid(title) || title.trim() === document.title) {
      setEditing(false);
      setTitle(document.title);
      return;
    }
    if (await run("rename", () => onUpdate(document._id, { title: title.trim() }))) setEditing(false);
  };

  const pill = STATUS_PILLS[document.status];
  const message = replace.fileError || error;

  return (
    <div className="rounded-xl bg-emerald-50 p-3.5 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white text-emerald-600 dark:bg-gray-900">
            <FileText size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={DOCUMENT_RULES.maxTitleLength}
                  aria-label="Document title"
                  autoFocus
                  className="w-full min-w-0 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <button type="button" onClick={saveTitle} disabled={busy === "rename"} aria-label="Save title" className={`${SMALL_BUTTON} ${PRIMARY} min-h-8 px-2`}>
                  {busy === "rename" ? <LoaderCircle size={13} className="animate-spin" aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}
                </button>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-1">
                <p className="truncate text-sm font-extrabold text-gray-900 dark:text-gray-100">{document.title}</p>
                {canChange && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    aria-label={`Rename ${document.title}`}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-gray-400 hover:bg-white hover:text-emerald-600 dark:hover:bg-gray-800"
                  >
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
            <p className="truncate text-[11.5px] text-gray-600 dark:text-gray-400">
              {[docTypeLabel(document.docType), document.file?.originalName, document.file?.sizeBytes ? formatFileSize(document.file.sizeBytes) : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {pill && <StatusPill tone={pill.tone}>{pill.label}</StatusPill>}
          <button type="button" onClick={onPreview} className={`${SMALL_BUTTON} ${OUTLINE}`}>
            <Eye size={14} aria-hidden="true" />
            Preview
          </button>
          {canChange && (
            <>
              <button type="button" onClick={replace.open} disabled={Boolean(busy) || replace.checking} className={`${SMALL_BUTTON} ${OUTLINE}`}>
                {busy === "replace" || replace.checking ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}
                Replace
              </button>
              <button
                type="button"
                onClick={() => run("delete", () => onRemove(document._id))}
                disabled={Boolean(busy)}
                aria-label={`Delete ${document.title}`}
                className="grid size-10 place-items-center rounded-[10px] text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                {busy === "delete" ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
              </button>
            </>
          )}
        </div>
      </div>
      {document.status === "REJECTED" && document.reason && (
        <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-400">Rejected: {document.reason}. Upload a new document.</p>
      )}
      {message && (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {message}
        </p>
      )}
      {replace.input}
    </div>
  );
}

/** A new document being added: title + file, uploaded on Save. */
function DraftRow({ draft, onChange, onSave, onDiscard, onPreview }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const picker = useFilePicker(useCallback((file) => onChange({ file }), [onChange]));
  const ready = titleValid(draft.title) && Boolean(draft.file);

  const save = async () => {
    if (!ready || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave();
    } catch (err) {
      console.error("Document upload failed:", err);
      // KYC_DOCUMENT_LIMIT, KYC_FILE_TYPE, KYC_IMAGE_TOO_SMALL, 413, KYC_STORAGE_UNAVAILABLE …
      setError(onboardingErrorMessage(err, "Upload failed. Please try again."));
      setSaving(false);
    }
  };

  const message = picker.fileError || error;

  return (
    <div className="rounded-xl bg-white p-3.5 ring-[1.5px] ring-inset ring-amber-300 dark:bg-gray-900 dark:ring-amber-500/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400" htmlFor={draft.id}>
            Document title <span className="text-red-500">*</span>
          </label>
          <input
            id={draft.id}
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            maxLength={DOCUMENT_RULES.maxTitleLength}
            placeholder="e.g. Trade licence 2026"
            className="w-full min-w-0 border-0 bg-transparent p-0 py-1 text-base font-extrabold text-gray-900 outline-none placeholder:font-semibold placeholder:text-gray-400 sm:text-sm dark:text-gray-100"
          />
          {draft.file && (
            <p className="truncate text-[11.5px] text-gray-600 dark:text-gray-400">
              {draft.file.name} · {formatFileSize(draft.file.size)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {draft.file && (
            <button type="button" onClick={onPreview} className={`${SMALL_BUTTON} ${OUTLINE}`}>
              <Eye size={14} aria-hidden="true" />
              Preview
            </button>
          )}
          <button type="button" onClick={picker.open} disabled={picker.checking || saving} className={`${SMALL_BUTTON} ${draft.file ? OUTLINE : PRIMARY}`}>
            {picker.checking ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : draft.file ? <RefreshCw size={14} aria-hidden="true" /> : <Upload size={14} aria-hidden="true" />}
            {draft.file ? "Change file" : "Choose file"}
          </button>
          {draft.file && (
            <button type="button" onClick={save} disabled={!ready || saving} className={`${SMALL_BUTTON} ${PRIMARY}`}>
              {saving ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
              {saving ? "Uploading…" : "Save"}
            </button>
          )}
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            aria-label="Discard this document"
            className="grid size-10 place-items-center rounded-[10px] text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      {!message && draft.file && !titleValid(draft.title) && (
        <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          Give it a title ({DOCUMENT_RULES.minTitleLength}–{DOCUMENT_RULES.maxTitleLength} characters) so our team knows what it is.
        </p>
      )}
      {message && (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {message}
        </p>
      )}
      {picker.input}
    </div>
  );
}

/**
 * Business documents editor (guide §4.8), server-backed through
 * useKycDocuments: recommended chips from `hints` (docType codes → labels),
 * the owner ID first and apart, saved documents (preview / rename / replace /
 * delete when `canChange`), and new ones added with a title. The add limit is
 * the server's `limit` / `count`. Used by the KYC_DOCUMENTS screen and the
 * outlet review's "Add documents" popup.
 * @param {{
 *   docs: ReturnType<typeof import('../../hooks/useKycDocuments').useKycDocuments>,
 *   canAdd?: boolean, canChange?: boolean,
 *   onDraftsChange?: (unsavedCount: number) => void,
 * }} props
 */
export default function DocumentsEditor({ docs, canAdd = true, canChange = true, onDraftsChange }) {
  const [drafts, setDrafts] = useState([]);
  const [preview, setPreview] = useState(null); // { title, file?, url?, fileName? }

  useEffect(() => {
    onDraftsChange?.(drafts.length);
  }, [drafts.length, onDraftsChange]);

  const atLimit = docs.limit != null && docs.count + drafts.length >= docs.limit;
  const usedTypes = new Set([...docs.businessDocuments.map((d) => d.docType), ...drafts.map((d) => d.docType)].filter(Boolean));

  const addDraft = (title, docType) => {
    if (!canAdd || atLimit) return;
    setDrafts((list) => [...list, newDraft(title, docType)]);
  };
  const patchDraft = (id, patch) => setDrafts((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const dropDraft = (id) => setDrafts((list) => list.filter((d) => d.id !== id));

  const saveDraft = async (draft) => {
    await docs.add({ title: draft.title.trim(), docType: draft.docType, file: draft.file });
    dropDraft(draft.id);
  };

  // Signed links are short-lived (#23a note 3): a missing link → read again.
  const previewSaved = async (document) => {
    if (!document.fileUrl) {
      await docs.reload();
      return;
    }
    setPreview({ title: document.title, url: document.fileUrl, fileName: document.file?.originalName });
  };

  if (docs.loading) {
    return (
      <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" role="status">
        <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
        Loading your documents…
      </p>
    );
  }

  return (
    <>
      {docs.error && (
        <div className="flex flex-wrap items-center gap-2">
          <FormError message={onboardingErrorMessage(docs.error, "We couldn't load your documents.")} />
          <button type="button" onClick={docs.reload} className={`${SMALL_BUTTON} ${OUTLINE}`}>
            Retry
          </button>
        </div>
      )}

      {docs.hints.length > 0 && canAdd && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3.5 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
          <span className="w-full text-[11px] font-bold text-gray-600 sm:w-auto dark:text-gray-400">Recommended for your business:</span>
          {docs.hints.map((code) =>
            usedTypes.has(code) ? (
              <span
                key={code}
                className="inline-flex min-h-9 items-center rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              >
                ✓ {docTypeLabel(code)}
              </span>
            ) : (
              <button
                key={code}
                type="button"
                onClick={() => addDraft(docTypeLabel(code), code)}
                disabled={atLimit}
                className="min-h-9 rounded-full bg-emerald-50 px-3 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30"
              >
                + {docTypeLabel(code)}
              </button>
            ),
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {docs.ownerId && <OwnerIdRow document={docs.ownerId} onPreview={() => previewSaved(docs.ownerId)} />}
        {docs.businessDocuments.map((document) => (
          <SavedRow
            key={document._id}
            document={document}
            canChange={canChange}
            onPreview={() => previewSaved(document)}
            onUpdate={docs.update}
            onRemove={docs.remove}
          />
        ))}
        {drafts.map((draft) => (
          <DraftRow
            key={draft.id}
            draft={draft}
            onChange={(patch) => patchDraft(draft.id, patch)}
            onSave={() => saveDraft(draft)}
            onDiscard={() => dropDraft(draft.id)}
            onPreview={() => setPreview({ title: draft.title || "Document", file: draft.file, fileName: draft.file?.name })}
          />
        ))}

        {canAdd &&
          (atLimit ? (
            <p className="rounded-xl bg-gray-50 px-3.5 py-3 text-center text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:ring-gray-700">
              You&apos;ve reached the limit of {docs.limit} documents.{canChange ? " Delete one to add another." : ""}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => addDraft("", null)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-emerald-700 ring-[1.5px] ring-inset ring-emerald-200 transition hover:bg-emerald-50 dark:text-emerald-400 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/10"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              {docs.count ? `Add another document${docs.limit != null ? ` (${docs.count}/${docs.limit})` : ""}` : "Add a document"}
            </button>
          ))}
      </div>

      <p className="text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-400">
        PDF preferred — JPG or PNG also work (at least {DOCUMENT_RULES.minImageSidePx} px on the short side). Up to 5 MB each.
        {docs.limit != null ? ` Up to ${docs.limit} documents.` : ""} Give each a title, choose the file, check it with Preview, then
        press Save.
      </p>

      {preview && (
        <DocumentPreviewModal file={preview.file} url={preview.url} title={preview.title} fileName={preview.fileName} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
