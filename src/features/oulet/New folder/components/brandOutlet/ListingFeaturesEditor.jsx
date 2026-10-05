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
  const [showAddModal, setShowAddModal] = useState(false);
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
        // A brand-new outlet with nothing saved yet gets back `data: null`
        // here (not an empty array) — `res?.data.data` (missing the second
        // `?.`) threw on that null, landing in the catch below and showing
        // a scary "couldn't load" error for what's just a normal empty state.
        const list = res?.data?.data ?? res ?? [];
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
        // A brand-new outlet with nothing saved yet legitimately fails
        // this fetch (backend has nothing to return) — that's a normal,
        // expected state, not an error worth alarming the merchant over.
        // The "No features added yet" empty state below already covers
        // it silently; logged for debugging only, no user-facing toast.
        console.error("Couldn't load existing brand features:", err.message);
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

  // Returns whether the save succeeded, so the Add Feature modal knows
  // whether it's safe to close itself.
  const addFeature = async () => {
    const value = title.trim();
    if (!value || capReached || saving) return false;

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
      return true;
    } catch (err) {
      const msg = err.message || "Couldn't save this feature. Try again.";
      setSaveError(msg);
      showError(msg);
      return false;
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

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => {
    setShowAddModal(false);
    resetDraft();
    setSaveError("");
  };
  const handleAddClick = async () => {
    const ok = await addFeature();
    if (ok) setShowAddModal(false);
  };

  return (
    <div>
      {/* Toasts */}
      <ErrorToast error={toastError} onDismiss={() => setToastError(null)} />
      <SuccessToast message={toastSuccess} onDismiss={() => setToastSuccess("")} />

      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-semibold text-gray-500">
          {activeCount}/{MAX_ACTIVE_FEATURES} active
        </p>
        <button
          type="button"
          onClick={openAddModal}
          disabled={capReached}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${capReached
              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {capReached ? "10 active features reached" : "Add Feature"}
        </button>
      </div>

      {/* ── Added features — shown as compact rounded chips ── */}
      {loading ? (
        <p className="text-xs text-gray-400">Loading saved features…</p>
      ) : features.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-[#f8fafc] dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700"
            >
              {feature.icon ? (
                <button
                  type="button"
                  onClick={() => setPreviewFeature(feature)}
                  className="w-6 h-6 rounded-full overflow-hidden shrink-0"
                  title="View icon"
                >
                  <img src={feature.icon} alt={feature.title} className="w-full h-full object-cover" />
                </button>
              ) : (
                <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-gray-300 bg-white dark:bg-gray-800">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              )}
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{feature.title}</span>
              {!feature.isActive && (
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">inactive</span>
              )}
              <button
                type="button"
                onClick={() => removeFeature(feature.id)}
                title="Remove feature"
                className="shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-red-500 hover:text-white text-gray-600 dark:text-gray-300 text-[10px] leading-none transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No features added yet. Tap "Add Feature" to add one.</p>
      )}

      {previewFeature && (
        <MediaPreviewModal
          src={previewFeature.icon}
          type="image"
          onClose={() => setPreviewFeature(null)}
        />
      )}

      {/* ── Add Feature modal ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={closeAddModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Add Listing Feature</h3>
              <button
                type="button"
                onClick={closeAddModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="eg : Premium Quality"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-50 transition-colors bg-emerald-50 dark:bg-emerald-500/10 text-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="eg : We provide premium quality products with carefully selected materials."
                  rows={3}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-50 transition-colors bg-emerald-50 dark:bg-emerald-500/10 text-gray-700 dark:text-gray-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-between bg-[#f8fafc] dark:bg-gray-700/40 rounded-xl px-3 py-2.5">
                <button
                  type="button"
                  onClick={pickIcon}
                  className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {iconPreview ? (
                    <span className="flex items-center gap-2">
                      <img src={iconPreview} alt="icon" className="w-7 h-7 rounded-full object-cover" />
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

                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                  Active
                </label>
              </div>

              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
            </div>

            <div className="px-6 py-4">
              <button
                type="button"
                onClick={handleAddClick}
                disabled={!title.trim() || saving || capReached}
                className={`w-full px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${title.trim() && !saving && !capReached
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {saving ? "Saving…" : capReached ? "10 active features reached" : "Add Feature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
