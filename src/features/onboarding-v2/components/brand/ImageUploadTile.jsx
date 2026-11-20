import { useCallback, useRef, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Click-to-upload image tile with preview — the 120px square logo tile and
 * the wide cover tile on Brand Details. Validates type and size before
 * handing the file up; the parent owns the File and the preview URL.
 * @param {{
 *   label: string,
 *   hint: string,
 *   previewUrl?: string|null,
 *   shape?: 'square'|'wide',
 *   maxSizeMb: number,
 *   onSelect: (file: File|null) => void,
 *   onError?: (message: string) => void,
 * }} props
 */
export default function ImageUploadTile({ label, hint, previewUrl, shape = "square", maxSizeMb, onSelect, onError }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const handleChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      let message = "";
      if (!ACCEPTED_TYPES.includes(file.type)) message = "Use a JPG, PNG, WebP or GIF image.";
      else if (file.size > maxSizeMb * 1024 * 1024) message = `Image must be ${maxSizeMb} MB or smaller.`;
      setError(message);
      if (message) {
        onError?.(message);
        return;
      }
      onSelect(file);
    },
    [maxSizeMb, onError, onSelect],
  );

  const sizeClass = shape === "square" ? "size-[120px]" : "h-[120px] w-full";

  return (
    <div className={shape === "square" ? "w-[120px] shrink-0" : "min-w-0 flex-1"}>
      <div className={`group relative overflow-hidden rounded-2xl ${sizeClass}`}>
        <button
          type="button"
          onClick={openPicker}
          aria-label={previewUrl ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
          className={`flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            previewUrl
              ? "bg-gray-100 dark:bg-gray-700"
              : "border-[1.5px] border-dashed border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/60 dark:border-gray-600 dark:bg-gray-700/40 dark:hover:border-emerald-500 dark:hover:bg-emerald-500/10"
          }`}
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/45 py-1.5 text-[11px] font-semibold text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <RefreshCw size={12} aria-hidden="true" />
                Replace
              </span>
            </>
          ) : (
            <>
              <ImagePlus size={22} strokeWidth={1.8} className="text-gray-400" aria-hidden="true" />
              <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200">{label}</span>
              <span className="px-3 text-[11px] leading-snug text-gray-500 dark:text-gray-400">{hint}</span>
            </>
          )}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={() => {
              setError("");
              onSelect(null);
            }}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white dark:bg-gray-900/90 dark:text-gray-200"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
