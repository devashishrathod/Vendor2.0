import { useEffect, useRef, useState } from "react";
import { addBrandFeature, getBrandFeatures } from "../../services/brandOutletApi";
import MediaPreviewModal from "./modals/MediaPreviewModal";
import ErrorToast from "../../../../../components/common/ErrorToast";
import SuccessToast from "../../../../../components/common/SuccessToast";


const MAX_ACTIVE_FEATURES = 10;
let featureIdCounter = 0;

export default function ListingFeaturesEditor({ features, onChange, brandId }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [previewFeature, setPreviewFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const iconInputRef = useRef(null);
  const hydratedRef = useRef(false); // guards against re-fetch / overwrite loops

  // ── Toast notifications ──
  // Pop-up layer on top of the inline states below — errors/success for
  // every network moment in this editor (load, add, remove).
  const [toastError, setToastError] = useState(null); // { status, message, txnId } | null
  const [toastSuccess, setToastSuccess] = useState("");

  const showError = (message, status, txnId) => {
    if (!message) return;
    setToastError({ status, message, txnId });
  };

  const showSuccess = (message) => {
    if (!message) return;
    setToastSuccess(message);
  };

  // ── Prefill already-saved features so the merchant doesn't retype ──
  useEffect(() => {
    if (!brandId) {
      setLoading(false);
      return;
    }
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    (async () => {
      try {
        const res = await getBrandFeatures(brandId);
        const list = res?.data.data ?? res ?? [];
        const mapped = (Array.isArray(list) ? list : []).map((f) => ({
          id: f._id || `f${featureIdCounter++}`,
          title: f.title || "",
          description: f.description || "",
          isActive: !!f.isActive,
          icon: f.icon || f.iconUrl || f.iconPath || null,
          persisted: true,
        }));
        if (mapped.length) onChange(mapped);
      } catch (err) {
        // Worst case the merchant sees an empty list and can still add
        // features fresh (see the "No features added yet" empty state
        // below) — a toast is enough of a heads-up, no need for a
        // permanent red banner sitting on the page.
        console.error("Couldn't load existing brand features:", err.message);
        showError("Couldn't load your previously saved features. You can still add new ones below.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const activeCount = features.filter((f) => f.isActive).length;
  const capReached = isActive && activeCount >= MAX_ACTIVE_FEATURES;

  const pickIcon = () => iconInputRef.current?.click();

  const handleIconChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearIcon = () => {
    setIconFile(null);
    setIconPreview(null);
  };

  const resetDraft = () => {
    setTitle("");
    setDescription("");
    setIsActive(true);
    clearIcon();
  };

  const addFeature = async () => {
    const value = title.trim();
    if (!value || capReached || saving) return;

    setSaving(true);
    setSaveError("");
    try {
      const res = await addBrandFeature({
        brandId,
        title: value,
        description: description.trim(),
        isActive,
        iconFile,
      });
      const saved = res?.data ?? res;
      onChange([
        ...features,
        {
          id: saved?._id || `f${featureIdCounter++}`,
          title: value,
          description: description.trim(),
          isActive,
          icon: iconPreview,
          persisted: true,
        },
      ]);
      showSuccess(`"${value}" added to your listing features.`);
      resetDraft();
    } catch (err) {
      const msg = err.message || "Couldn't save this feature. Try again.";
      setSaveError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const removeFeature = (id) => {
    // Local removal only — no delete endpoint has been shared yet, so this
    // just hides it from the list on this screen.
    const removed = features.find((f) => f.id === id);
    onChange(features.filter((f) => f.id !== id));
    if (removed?.title) showSuccess(`"${removed.title}" removed from this list.`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFeature();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Toasts */}
      <ErrorToast error={toastError} onDismiss={() => setToastError(null)} />
      <SuccessToast message={toastSuccess} onDismiss={() => setToastSuccess("")} />

      {/* ── LEFT: Add feature form ── */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="eg : Premium Quality"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors bg-white text-gray-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="eg : We provide premium quality products with carefully selected materials."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors bg-white text-gray-700 resize-none"
          />
        </div>

        <div className="flex items-center justify-between bg-[#f8fafc] border border-gray-100 rounded-xl px-3 py-2.5">
          <button
            type="button"
            onClick={pickIcon}
            className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {iconPreview ? (
              <span className="flex items-center gap-2">
                <img src={iconPreview} alt="icon" className="w-7 h-7 rounded-full object-cover border border-gray-300" />
                Change icon
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add icon
              </span>
            )}
          </button>

          {iconPreview && (
            <button
              type="button"
              onClick={clearIcon}
              className="text-[10px] font-semibold text-gray-400 hover:text-red-500 underline"
            >
              remove
            </button>
          )}

          <input
            ref={iconInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleIconChange}
          />

          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
            Active
          </label>
        </div>

        <button
          type="button"
          onClick={addFeature}
          disabled={!title.trim() || saving || capReached}
          className={`w-full px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            title.trim() && !saving && !capReached
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving…" : capReached ? "10 active features reached" : "Add Feature"}
        </button>

        {saveError && <p className="text-xs text-red-500">{saveError}</p>}
        <p className="text-xs text-gray-400 text-right">{activeCount}/{MAX_ACTIVE_FEATURES} active</p>
      </div>

      {/* ── RIGHT: Added features list ── */}
      <div className="lg:border-l lg:border-gray-100 lg:pl-6">
        <p className="text-xs font-semibold text-gray-500 mb-3">
          Added Features {features.length > 0 && `(${features.length})`}
        </p>

        {loading ? (
          <div className="h-full min-h-[140px] flex items-center justify-center border border-dashed border-gray-200 rounded-xl">
            <p className="text-xs text-gray-400">Loading saved features…</p>
          </div>
        ) : features.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-start gap-3 bg-[#f8fafc] border border-gray-100 rounded-xl px-3 py-2.5"
              >
                {feature.icon ? (
                  <button
                    onClick={() => setPreviewFeature(feature)}
                    className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-300 shrink-0"
                    title="View icon"
                  >
                    <img src={feature.icon} alt={feature.title} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="w-9 h-9 rounded-full border border-dashed border-gray-300 shrink-0 flex items-center justify-center text-gray-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 truncate">{feature.title}</span>
                    {!feature.isActive && (
                      <span className="shrink-0 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        inactive
                      </span>
                    )}
                  </div>
                  {feature.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{feature.description}</p>
                  )}
                </div>

                <button
                  onClick={() => removeFeature(feature.id)}
                  title="Remove feature"
                  className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-red-500 hover:text-white text-gray-600 text-xs leading-none transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full min-h-[140px] flex items-center justify-center border border-dashed border-gray-200 rounded-xl">
            <p className="text-xs text-gray-400 text-center px-4">
              No features added yet.<br />Fill the form and hit Add.
            </p>
          </div>
        )}
      </div>

      {previewFeature && (
        <MediaPreviewModal
          src={previewFeature.icon}
          type="image"
          onClose={() => setPreviewFeature(null)}
        />
      )}
    </div>
  );
}