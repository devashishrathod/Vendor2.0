import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Plus, Sparkles, Trash2, X } from "lucide-react";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import RemoteIcon from "../../components/ui/RemoteIcon";
import { TextField } from "../../components/ui/TextField";
import { addBrandFeature, deleteBrandFeature, getBrandFeatures } from "../../services/brandSetupApi";
import { onboardingErrorMessage } from "../../utils/errorMessages";

const TITLE_MIN = 2;
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 500;
const ICON_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ICON_MAX_MB = 2;

/**
 * Listing features (guide §4.12, API doc #61–#65), saved on the server as
 * they're added. The active limit is the server's
 * (`status.limits.maxActiveFeatures`); over it → 400 FEATURE_LIMIT. Under
 * review (`setup.change: false`) features can be added but not deleted.
 * @param {{
 *   brandId: string,
 *   limit?: number|null,
 *   canAdd?: boolean,
 *   canChange?: boolean,
 *   onCountChange?: (count: number) => void,
 * }} props
 */
export default function FeaturesEditor({ brandId, limit = null, canAdd = true, canChange = true, onCountChange }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null); // feature being confirmed
  const [deleteBusy, setDeleteBusy] = useState(false);
  const iconInputRef = useRef(null);

  const iconPreview = useMemo(() => (icon ? URL.createObjectURL(icon) : null), [icon]);
  useEffect(() => () => iconPreview && URL.revokeObjectURL(iconPreview), [iconPreview]);

  // State is only set once the request settles.
  const load = useCallback(
    () =>
      getBrandFeatures(brandId)
        .then((list) => {
          setFeatures(list);
          setLoadError("");
        })
        .catch((err) => {
          console.error("Loading brand features failed:", err);
          setLoadError(onboardingErrorMessage(err, "We couldn't load your features."));
        })
        .finally(() => setLoading(false)),
    [brandId],
  );

  useEffect(() => {
    if (brandId) load();
  }, [brandId, load]);

  useEffect(() => {
    onCountChange?.(features.length);
  }, [features.length, onCountChange]);

  const activeCount = features.filter((f) => f.isActive).length;
  const atLimit = limit != null && activeCount >= limit;
  const titleOk = title.trim().length >= TITLE_MIN;

  const resetDraft = () => {
    setAdding(false);
    setTitle("");
    setDescription("");
    setIcon(null);
    setError("");
  };

  const pickIcon = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ICON_TYPES.includes(file.type)) return setError("Use a JPG, PNG, WebP or GIF icon.");
    if (file.size > ICON_MAX_MB * 1024 * 1024) return setError(`The icon must be ${ICON_MAX_MB} MB or smaller.`);
    setError("");
    setIcon(file);
  };

  const save = async () => {
    if (!titleOk || !icon || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await addBrandFeature({ brandId, title: title.trim(), description: description.trim(), icon });
      const saved = res?.data;
      setFeatures((list) => (saved?._id ? [...list, saved] : list));
      if (!saved?._id) load();
      resetDraft();
    } catch (err) {
      console.error("Adding a brand feature failed:", err);
      setError(onboardingErrorMessage(err, "We couldn't add this feature. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteBrandFeature(deleting._id);
      setFeatures((list) => list.filter((f) => f._id !== deleting._id));
      setDeleting(null);
    } catch (err) {
      console.error("Deleting a brand feature failed:", err);
      setLoadError(onboardingErrorMessage(err, "We couldn't delete this feature."));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" role="status">
        <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
        Loading your features…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          {limit != null ? `${activeCount} of ${limit} active` : `${activeCount} active`}
        </p>
      </div>

      {loadError && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {loadError}{" "}
          <button type="button" onClick={load} className="font-bold underline">
            Retry
          </button>
        </p>
      )}

      {features.length > 0 ? (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {features.map((feature) => (
            <li
              key={feature._id}
              className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700"
            >
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white dark:bg-gray-900">
                <RemoteIcon src={feature.icon} fallback={Sparkles} size={16} className="h-full w-full object-cover" iconClassName="text-emerald-600" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-gray-900 dark:text-gray-100">{feature.title}</span>
                {feature.description && <span className="line-clamp-2 block text-xs text-gray-500 dark:text-gray-400">{feature.description}</span>}
                {!feature.isActive && <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Inactive</span>}
              </span>
              {canChange && (
                <button
                  type="button"
                  onClick={() => setDeleting(feature)}
                  aria-label={`Delete ${feature.title}`}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">No features yet — add what makes you special (e.g. “Free Wi-Fi”, “Pure veg”).</p>
      )}

      {canAdd &&
        (adding ? (
          <div className="flex flex-col gap-3 rounded-xl bg-white p-3.5 ring-[1.5px] ring-inset ring-emerald-200 dark:bg-gray-900 dark:ring-emerald-500/30">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => iconInputRef.current?.click()}
                aria-label={icon ? "Change icon" : "Choose an icon"}
                className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border-[1.5px] border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-emerald-400 dark:border-gray-600 dark:bg-gray-800"
              >
                {iconPreview ? <img src={iconPreview} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={18} aria-hidden="true" />}
              </button>
              <div className="min-w-0 flex-1">
                <TextField
                  id="feature-title"
                  label="Feature"
                  required
                  placeholder="e.g. Free Wi-Fi"
                  maxLength={TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>
            <TextField
              id="feature-description"
              label="Short description"
              optional
              placeholder="e.g. High-speed internet for every guest"
              maxLength={DESCRIPTION_MAX}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-[11.5px] text-gray-500 dark:text-gray-400">An icon is needed — tap the square to choose one.</p>
            {error && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetDraft} disabled={saving} icon={X} iconPosition="start">
                Cancel
              </Button>
              <Button onClick={save} disabled={!titleOk || !icon} loading={saving} icon={Plus} iconPosition="start">
                Add feature
              </Button>
            </div>
            <input ref={iconInputRef} type="file" accept={ICON_TYPES.join(",")} onChange={pickIcon} className="sr-only" tabIndex={-1} aria-hidden="true" />
          </div>
        ) : atLimit ? (
          <p className="rounded-xl bg-gray-50 px-3.5 py-3 text-center text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:ring-gray-700">
            You&apos;ve reached the limit of {limit} active features.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-emerald-700 ring-[1.5px] ring-inset ring-emerald-200 transition hover:bg-emerald-50 dark:text-emerald-400 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/10"
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            Add a feature
          </button>
        ))}

      {deleting && (
        <ConfirmDialog
          title="Delete this feature?"
          message={`“${deleting.title}” will be removed from your listing.`}
          busy={deleteBusy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
