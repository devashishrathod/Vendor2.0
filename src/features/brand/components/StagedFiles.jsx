import { useEffect, useRef, useState } from "react";
import { Eye, RefreshCw, Trash2, Plus, X, Film } from "lucide-react";

// Picked-but-not-uploaded files for the showcase modals: a thumbnail per
// file (with View / Replace / Remove on hover), a "+ Add more" tile, and a
// full-size viewer. Same behaviour as the admin panel's Add Media modal.

const isVideo = (file) => Boolean(file?.type?.startsWith("video/"));

// Preview of a local File. The object URL is made inside the effect (not
// useMemo) so StrictMode's mount → cleanup → mount gets a fresh URL instead
// of a revoked one. `contain` = large preview (whole frame, video controls).
export function LocalFileThumb({ file, contain = false }) {
  const ref = useRef(null);
  const video = isVideo(file);
  const fit = contain ? "object-contain" : "object-cover";

  useEffect(() => {
    const url = URL.createObjectURL(file);
    // #t=0.1 makes the browser paint a real frame instead of a black box.
    if (ref.current) ref.current.src = video && !contain ? `${url}#t=0.1` : url;
    return () => URL.revokeObjectURL(url);
  }, [file, video, contain]);

  return video ? (
    <>
      <video ref={ref} className={`h-full w-full ${fit}`} muted playsInline preload="metadata" controls={contain} />
      {!contain && <Film size={11} className="absolute bottom-1 right-1 text-white drop-shadow" />}
    </>
  ) : (
    <img ref={ref} alt="" className={`h-full w-full ${fit}`} />
  );
}

// Full-size look at a picked file before it's uploaded.
export function LocalFileViewer({ file, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={16} />
      </button>
      <div onClick={(e) => e.stopPropagation()} className="relative flex h-[75vh] w-full max-w-3xl items-center justify-center">
        <LocalFileThumb file={file} contain />
      </div>
      <p className="absolute bottom-4 left-1/2 max-w-[90vw] -translate-x-1/2 truncate text-xs text-white/70">{file.name}</p>
    </div>
  );
}

const tileBtn =
  "flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90";

/**
 * Editable grid of staged files.
 * @param {{ files: File[], onChange: (files: File[]) => void, disabled?: boolean, accept?: string }} props
 */
export function StagedFilesGrid({ files, onChange, disabled = false, accept = "image/*,video/*" }) {
  const [viewing, setViewing] = useState(null);
  const replaceInputRef = useRef(null);
  const replaceIndexRef = useRef(null);
  const addInputRef = useRef(null);

  const startReplace = (index) => {
    replaceIndexRef.current = index;
    replaceInputRef.current?.click();
  };

  const handleReplacePick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const index = replaceIndexRef.current;
    if (!file || index == null) return;
    onChange(files.map((f, i) => (i === index ? file : f)));
  };

  // New files go on the end.
  const handleAddMore = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length) onChange([...files, ...picked]);
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {files.map((file, i) => (
          <div
            key={`${file.name}-${file.lastModified}-${i}`}
            title={file.name}
            className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700"
          >
            <LocalFileThumb file={file} />
            {!disabled && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <button type="button" onClick={() => setViewing(file)} aria-label="View" title="View" className={tileBtn}>
                  <Eye size={12} />
                </button>
                <button type="button" onClick={() => startReplace(i)} aria-label="Replace" title="Replace" className={tileBtn}>
                  <RefreshCw size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
                  aria-label="Remove"
                  title="Remove"
                  className={`${tileBtn} hover:bg-rose-600`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addInputRef.current?.click()}
          disabled={disabled}
          title="Add more photos or videos"
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 text-gray-500 transition-colors hover:border-emerald-400 hover:text-emerald-600 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:text-emerald-400"
        >
          <Plus size={16} />
          <span className="text-[10.5px] font-medium">{files.length ? "Add more" : "Add files"}</span>
        </button>
      </div>

      <input ref={addInputRef} type="file" accept={accept} multiple onChange={handleAddMore} className="hidden" />
      <input ref={replaceInputRef} type="file" accept={accept} onChange={handleReplacePick} className="hidden" />
      {viewing && <LocalFileViewer file={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

/**
 * Thumbnail picker for a batch that contains videos: shows the videos it
 * applies to (so it's clear which poster is being added) + the chosen image.
 */
export function BatchThumbnailField({ files, thumbnail, onChange, required, disabled = false }) {
  const inputRef = useRef(null);
  const videos = files.filter(isVideo);

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
        {required ? (
          <>
            Video thumbnail <span className="text-rose-500">(required)</span>
          </>
        ) : (
          "Thumbnail for clips (optional)"
        )}
      </p>
      <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
        {videos.length > 0 && (
          <div className="flex shrink-0 -space-x-2">
            {videos.slice(0, 3).map((v, i) => (
              <div
                key={`${v.name}-${i}`}
                title={v.name}
                className="relative h-10 w-14 overflow-hidden rounded-lg bg-gray-200 ring-2 ring-white dark:bg-gray-700 dark:ring-gray-800"
              >
                <LocalFileThumb file={v} />
              </div>
            ))}
          </div>
        )}
        <span className="min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400">
          {videos.length > 1 ? `${videos.length} videos` : videos[0]?.name || "Image batch"}
        </span>
        {thumbnail && (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-2 ring-emerald-400/60" title="Thumbnail">
            <LocalFileThumb file={thumbnail} />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-dashed px-3 text-xs font-medium transition-colors disabled:opacity-50 ${
            thumbnail
              ? "border-emerald-400/60 text-emerald-600 dark:text-emerald-400"
              : "border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-400"
          }`}
        >
          {thumbnail ? "Change" : "Add thumbnail"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onChange(file);
          }}
        />
      </div>
    </div>
  );
}
