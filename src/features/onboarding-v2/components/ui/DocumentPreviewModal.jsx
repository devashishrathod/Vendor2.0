import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, FileText, X } from "lucide-react";

/**
 * Full-screen preview of a business document — a PDF in the browser's
 * viewer, or the image. Takes the File (kept locally) or a remote url.
 * @param {{ file?: File|Blob|null, url?: string|null, title: string, fileName?: string|null, onClose: () => void }} props
 */
export default function DocumentPreviewModal({ file, url, title, fileName, onClose }) {
  const src = useMemo(() => (file ? URL.createObjectURL(file) : url || null), [file, url]);
  const isPdf = file ? file.type === "application/pdf" : /\.pdf($|\?)/i.test(url || fileName || "");

  // Revoke the object URL once nothing shows it any more. StrictMode (dev)
  // runs this effect's cleanup and setup back to back with the same URL;
  // revoking straight away left the preview blank, so check after a tick.
  const shownSrcRef = useRef(null);
  useEffect(() => {
    shownSrcRef.current = src;
    return () => {
      shownSrcRef.current = null;
      if (!file || !src) return;
      setTimeout(() => {
        if (shownSrcRef.current !== src) URL.revokeObjectURL(src);
      }, 0);
    };
  }, [file, src]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Preview ${title}`}>
      <button type="button" aria-label="Close preview" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-gray-950/70 backdrop-blur-sm" />
      <div className="relative flex h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <FileText size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{title || "Document"}</p>
            {fileName && <p className="truncate text-[11.5px] text-gray-500 dark:text-gray-400">{fileName}</p>}
          </div>
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="hidden min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 sm:inline-flex dark:text-emerald-400 dark:hover:bg-emerald-500/10"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Open in new tab
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-100 dark:bg-gray-950">
          {!src ? (
            <p className="text-sm text-gray-500">Preview isn&apos;t available for this file.</p>
          ) : isPdf ? (
            <iframe src={src} title={title || "Document preview"} className="h-full w-full border-0 bg-white" />
          ) : (
            <img src={src} alt={title || "Document"} className="max-h-full max-w-full object-contain p-2" />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
