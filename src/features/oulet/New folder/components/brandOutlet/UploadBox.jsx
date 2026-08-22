import { useRef, useState } from "react";
import MediaPreviewModal from "./modals/MediaPreviewModal";

let mediaIdCounter = 0;

// Multi-file upload box with preview (supports maxFiles).
// `onFileSelect` is called on every add/remove so the parent can keep its
// own file state in sync:
//   - maxFiles === 1  → called with a single File, or null when cleared
//   - maxFiles > 1    → called with an array of Files (current full set)
export default function UploadBox({
  accept = "image/*",
  mediaType = "image",
  sizeRule,
  sizeLimit,
  extraCols = [],
  maxFiles = 1,
  onFileSelect,
}) {
  const [items, setItems] = useState([]); // [{id, file, preview}]
  const [previewItem, setPreviewItem] = useState(null);
  const inputRef = useRef();

  const remainingSlots = maxFiles - items.length;

  const notifyParent = (nextItems) => {
    if (!onFileSelect) return;
    if (maxFiles === 1) {
      onFileSelect(nextItems[0]?.file ?? null);
    } else {
      onFileSelect(nextItems.map((it) => it.file));
    }
  };

  const handleFile = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    const allowed = picked.slice(0, remainingSlots);
    const newItems = allowed.map((f) => ({
      id: `m${mediaIdCounter++}`,
      file: f,
      preview: URL.createObjectURL(f),
    }));

    setItems((prev) => {
      // maxFiles === 1 replaces the existing pick rather than appending,
      // so re-picking a logo swaps it instead of silently being ignored
      // once remainingSlots hits 0.
      const next = maxFiles === 1 ? newItems : [...prev, ...newItems];
      notifyParent(next);
      return next;
    });
    e.target.value = ""; // allow re-selecting same file later
  };

  const removeItem = (id) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      notifyParent(next);
      return next;
    });
  };

  return (
    <>
      <div className="bg-[#f3f6fb] rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          {/* Info cols */}
          <div className="grid gap-1 text-sm min-w-[120px]">
            <span className="font-semibold text-gray-700">Pixel Size Rules</span>
            <span className="text-gray-500">{sizeRule || "3:4 ratio (50×50 px)"}</span>
          </div>
          <div className="grid gap-1 text-sm min-w-[100px]">
            <span className="font-semibold text-gray-700">Upload Size Limit</span>
            <span className="text-gray-500">{sizeLimit || "1.5 MB"}</span>
          </div>
          {extraCols.map((col, i) => (
            <div key={i} className="grid gap-1 text-sm min-w-[80px]">
              <span className="font-semibold text-gray-700">{col.label}</span>
              <span className="text-gray-500">{col.value}</span>
            </div>
          ))}
          {maxFiles > 1 && (
            <div className="grid gap-1 text-sm min-w-[80px]">
              <span className="font-semibold text-gray-700">Max Files</span>
              <span className="text-gray-500">{items.length} / {maxFiles}</span>
            </div>
          )}

          <div className="ml-auto shrink-0">
            <button
              onClick={() => inputRef.current.click()}
              disabled={remainingSlots <= 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                remainingSlots > 0
                  ? "bg-[#1a1a2e] text-white hover:bg-[#2d2d5e]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {items.length > 0 ? "Add More" : "Upload"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              multiple={maxFiles > 1}
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>

        {/* Thumbnails grid */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {items.map((it) => (
              <div key={it.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                {mediaType === "video" ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                ) : (
                  <img src={it.preview} alt="thumb" className="w-full h-full object-cover" />
                )}

                <button
                  onClick={() => setPreviewItem(it)}
                  title="Preview"
                  className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>

                <button
                  onClick={() => removeItem(it.id)}
                  title="Remove"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs leading-none hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewItem && (
        <MediaPreviewModal src={previewItem.preview} type={mediaType} onClose={() => setPreviewItem(null)} />
      )}
    </>
  );
}