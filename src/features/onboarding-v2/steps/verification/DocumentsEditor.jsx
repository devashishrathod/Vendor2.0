import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import DocumentPreviewModal from "../../components/ui/DocumentPreviewModal";
import DocumentRow from "../../components/ui/DocumentRow";
import FormError from "../../components/ui/FormError";
import { BRANCHES } from "../../config/onboardingFlow";
import { DOCUMENT_RULES } from "../../constants/onboardingOptions";
import { fetchRequiredDocuments, uploadBusinessDocument } from "../../services/pendingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { deleteDocumentFile, getDocumentFile, putDocumentFile } from "../../utils/documentFileStore";
import { DOCUMENT_COPY } from "./documentsHelpers";


const EMPTY_FILE = { fileName: null, fileSize: null, status: "empty", progress: 0, url: null };

const normalizeTitle = (title) => title.trim().toLowerCase();

/**
 * The business documents editor: suggestion chips (required / optional),
 * titled rows with real upload progress, and "Add a document". Used by the
 * onboarding Documents step and by the outlet review's "Add documents"
 * popup. File objects never reach the persisted store — only name, size,
 * status and the uploaded url.
 */
export default function DocumentsEditor() {
  const branch = useOnboardingV2Store((s) => s.branch);
  const documents = useOnboardingV2Store((s) => s.form.documents);
  const subCategories = useOnboardingV2Store((s) => s.form.subCategories);
  const categoryName = useOnboardingV2Store((s) => s.form.categoryName);
  const entityType = useOnboardingV2Store((s) => s.form.entityType);
  const addDocument = useOnboardingV2Store((s) => s.addDocument);
  const updateDocument = useOnboardingV2Store((s) => s.updateDocument);
  const removeDocument = useOnboardingV2Store((s) => s.removeDocument);

  const isUnregistered = branch === BRANCHES.UNREGISTERED;
  const copy = isUnregistered ? DOCUMENT_COPY.unregistered : DOCUMENT_COPY.registered;

  const [suggested, setSuggested] = useState({ required: [], optional: [] });
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [uploadErrors, setUploadErrors] = useState({});
  // docId → token of the upload in flight; a stale token means it was cancelled.
  const uploadsRef = useRef(new Map());

  // Suggestions follow the category picked in Basic Details — nothing else.
  const selectionKey = useMemo(
    () => [entityType || "", categoryName, ...subCategories.map((s) => s.name)].join("|"),
    [categoryName, entityType, subCategories],
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [entity, category, ...subs] = selectionKey.split("|");
        const result = await fetchRequiredDocuments({ categoryName: category, subCategoryNames: subs, entityType: entity || null });
        if (active) {
          setSuggested({ required: result?.required ?? [], optional: result?.optional ?? [] });
          setSuggestionsError("");
        }
      } catch (error) {
        console.error("Required documents fetch failed:", error);
        if (active) setSuggestionsError("We couldn't load document suggestions. You can still add documents yourself.");
      } finally {
        if (active) setSuggestionsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [selectionKey, reloadKey]);

  // After a reload: an interrupted upload goes back to "chosen, not saved"
  // if its file is still kept locally, otherwise to empty; same for a chosen
  // file that was lost.
  useEffect(() => {
    const { form, updateDocument: update } = useOnboardingV2Store.getState();
    form.documents
      .filter((d) => d.status === "uploading" || d.status === "selected")
      .forEach(async (d) => {
        const file = await getDocumentFile(d.id);
        update(d.id, file ? { status: "selected", progress: 0 } : EMPTY_FILE);
      });
  }, []);

  const retrySuggestions = useCallback(() => {
    setSuggestionsLoading(true);
    setSuggestionsError("");
    setReloadKey((k) => k + 1);
  }, []);

  const atLimit = documents.length >= DOCUMENT_RULES.maxDocuments;

  const addedTitles = useMemo(() => new Set(documents.map((d) => normalizeTitle(d.title))), [documents]);

  const optionalTitles = useMemo(() => {
    const required = new Set(suggested.required.map(normalizeTitle));
    const seen = new Set();
    return suggested.optional.filter((title) => {
      const key = normalizeTitle(title);
      if (required.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [suggested]);

  const requiredFor = categoryName || "your category";

  const setUploadError = useCallback((id, message) => {
    setUploadErrors((prev) => {
      if (!message && !prev[id]) return prev;
      const nextErrors = { ...prev };
      if (message) nextErrors[id] = message;
      else delete nextErrors[id];
      return nextErrors;
    });
  }, []);

  // Choosing a file only stages it (kept locally for Preview); nothing is
  // uploaded until the vendor presses Save on that row.
  const stageFile = useCallback(
    async (doc, file) => {
      setUploadError(doc.id, "");
      await putDocumentFile(doc.id, file);
      updateDocument(doc.id, { fileName: file.name, fileSize: file.size, status: "selected", progress: 0, url: null });
    },
    [setUploadError, updateDocument],
  );

  const saveDocument = useCallback(
    async (doc) => {
      const file = await getDocumentFile(doc.id);
      if (!file) {
        updateDocument(doc.id, EMPTY_FILE);
        setUploadError(doc.id, "We lost this file — please choose it again.");
        return;
      }
      const token = {};
      uploadsRef.current.set(doc.id, token);
      setUploadError(doc.id, "");
      updateDocument(doc.id, { status: "uploading", progress: 0 });

      const isCurrent = () => uploadsRef.current.get(doc.id) === token;
      try {
        const result = await uploadBusinessDocument({ file, title: doc.title }, (percent) => {
          if (isCurrent()) updateDocument(doc.id, { progress: percent });
        });
        if (!isCurrent()) return;
        updateDocument(doc.id, { status: "uploaded", progress: 100, url: result?.url ?? null });
      } catch (error) {
        console.error("Document upload failed:", error);
        if (!isCurrent()) return;
        updateDocument(doc.id, { status: "selected", progress: 0 });
        setUploadError(doc.id, error?.message || "Upload failed. Please try again.");
      } finally {
        if (isCurrent()) uploadsRef.current.delete(doc.id);
      }
    },
    [setUploadError, updateDocument],
  );

  // Stopping an upload keeps the chosen file, ready to Save again.
  const cancelUpload = useCallback(
    (id) => {
      uploadsRef.current.delete(id);
      updateDocument(id, { status: "selected", progress: 0 });
    },
    [updateDocument],
  );

  const handleRemove = useCallback(
    (id) => {
      uploadsRef.current.delete(id);
      setUploadError(id, "");
      deleteDocumentFile(id);
      removeDocument(id);
    },
    [removeDocument, setUploadError],
  );

  const [preview, setPreview] = useState(null); // { doc, file }
  const openPreview = useCallback(
    async (doc) => {
      const file = await getDocumentFile(doc.id);
      if (file || doc.url) setPreview({ doc, file });
      else setUploadError(doc.id, "Preview isn't available for this file — choose it again to see it.");
    },
    [setUploadError],
  );

  const renderChip = (title, required) => {
    const added = addedTitles.has(normalizeTitle(title));
    if (added) {
      return (
        <span
          key={title}
          className="inline-flex min-h-9 items-center rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400"
        >
          ✓ {title}
        </span>
      );
    }
    return (
      <button
        key={title}
        type="button"
        onClick={() => addDocument(title)}
        disabled={atLimit}
        className={`min-h-9 rounded-full px-3 text-xs font-bold ring-1 ring-inset transition disabled:cursor-not-allowed disabled:opacity-40 ${
          required
            ? "bg-red-50 text-red-700 ring-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30"
            : "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30"
        }`}
      >
        + {title}
      </button>
    );
  };

  return (
    <>
      {/* Suggestion chips */}
      <div className="flex flex-col gap-3 rounded-xl bg-gray-50 p-3.5 ring-1 ring-inset ring-gray-200 sm:flex-row sm:flex-wrap sm:items-center dark:bg-gray-800/50 dark:ring-gray-700">
        {suggestionsLoading ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" role="status">
            Loading suggestions…
          </p>
        ) : (
          <>
            {suggested.required.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-full text-[11px] font-bold text-gray-600 sm:w-auto dark:text-gray-400">
                  Required for {requiredFor}:
                </span>
                {suggested.required.map((title) => renderChip(title, true))}
              </div>
            )}
            {suggested.required.length > 0 && optionalTitles.length > 0 && (
              <span className="hidden h-6 w-px bg-gray-300 sm:block dark:bg-gray-700" aria-hidden="true" />
            )}
            {optionalTitles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-full text-[11px] font-bold text-gray-600 sm:w-auto dark:text-gray-400">
                  Recommended for {requiredFor}:
                </span>
                {optionalTitles.map((title) => renderChip(title, false))}
              </div>
            )}
          </>
        )}
      </div>
      <FormError message={suggestionsError} />
      {suggestionsError && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Suggestions didn&apos;t load.</p>
          <Button variant="secondary" onClick={retrySuggestions} className="min-h-9 px-3 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Document rows */}
      <div className="flex flex-col gap-2.5">
        {documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            placeholder={copy.placeholder}
            error={uploadErrors[doc.id]}
            onTitleChange={(title) => updateDocument(doc.id, { title })}
            onFileSelected={(file) => stageFile(doc, file)}
            onSave={() => saveDocument(doc)}
            onPreview={() => openPreview(doc)}
            onCancel={() => cancelUpload(doc.id)}
            onRemove={() => handleRemove(doc.id)}
          />
        ))}
        {atLimit ? (
          <p className="rounded-xl bg-gray-50 px-3.5 py-3 text-center text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:ring-gray-700">
            You&apos;ve added the maximum of {DOCUMENT_RULES.maxDocuments} documents. Remove one to add another.
          </p>
        ) : (
        <button
          type="button"
          onClick={() => addDocument()}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-emerald-700 ring-[1.5px] ring-inset ring-emerald-200 transition hover:bg-emerald-50 dark:text-emerald-400 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/10"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          {documents.length ? `Add another document (${documents.length}/${DOCUMENT_RULES.maxDocuments})` : "Add a document"}
        </button>
        )}
      </div>

      <p className="text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-400">
        PDF preferred — JPG or PNG also work (at least 800 px on the short side). Up to 5 MB each, {DOCUMENT_RULES.maxDocuments} documents max. Add a title, choose
        the file, check it with Preview, then press Save.
      </p>

      {preview && (
        <DocumentPreviewModal
          file={preview.file}
          url={preview.doc.url}
          title={preview.doc.title}
          fileName={preview.doc.fileName}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
