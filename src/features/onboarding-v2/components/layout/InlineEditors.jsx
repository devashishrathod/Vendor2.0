import { useMemo, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { useCategories } from "@/features/outlets/setup/hooks/useCategories";
import FormError from "../ui/FormError";
import { KYC_PATH_LABELS } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { editBasicDetails } from "../../services/onboardingApi";
import { useSavedBrand, useSavedBrandStore } from "../../store/brandStore";
import { toOption } from "../../steps/basics/categoryHelpers";
import { STATUS_OPTIONS } from "../../steps/basics/businessStatusOptions";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { allPassed, brandNameLimits, brandNameRules } from "../../validation/rules";

// In-place editors for the Basic Details preview (guide §4.3): the vendor
// changes a value inside its preview card. All of them save with
// PUT /brands/onboarding/update-basic-details, which keeps the server's screen
// — except a business-status switch before submit, whose response opens the
// new path's first screen. `onSaved(data)` gets the response `data`.

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-[13px] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100";

function EditorActions({ onCancel, onSave, saving, disabled }) {
  return (
    <div className="mt-2.5 flex justify-end gap-1.5">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="min-h-8 rounded-lg px-3 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={disabled || saving}
        className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? <LoaderCircle size={13} className="animate-spin" aria-hidden="true" /> : <Check size={13} strokeWidth={3} aria-hidden="true" />}
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

/**
 * Saves `fields` with update-basic-details, keeps the brand cache current.
 * @returns {{ save: (fields: object) => Promise<void>, saving: boolean, error: string }}
 */
function useBasicDetailsSave({ onDone, onSaved, fallback }) {
  const { handleFlowError } = useOnboardingFlow();
  const mergeBrand = useSavedBrandStore((s) => s.mergeBrand);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (fields) => {
    try {
      setSaving(true);
      setError("");
      const res = await editBasicDetails(fields);
      mergeBrand(res?.data?.brand);
      onDone();
      onSaved?.(res?.data);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Basic details edit failed:", err);
      setError(onboardingErrorMessage(err, fallback));
    } finally {
      setSaving(false);
    }
  };

  return { save, saving, error };
}

/** Brand name — the server's length limits (status.limits). */
export function BrandNameEditor({ onDone, onSaved }) {
  const { limits } = useOnboardingFlow();
  const { brand } = useSavedBrand();
  const savedName = brand?.brandName ?? "";
  const [draft, setDraft] = useState(savedName);
  const nameLimits = useMemo(() => brandNameLimits(limits), [limits]);
  const rules = useMemo(() => brandNameRules(draft, nameLimits), [draft, nameLimits]);
  const failed = rules.find((r) => !r.passed);
  const { save, saving, error } = useBasicDetailsSave({ onDone, onSaved, fallback: "Couldn't save the brand name. Please try again." });

  return (
    <div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={nameLimits.max ?? undefined}
        aria-label="Brand name"
        className={inputClass}
        autoFocus
      />
      <div className="mt-1 flex justify-between gap-3 text-[11px]">
        <span className={failed ? "text-amber-700 dark:text-amber-400" : "font-semibold text-emerald-700 dark:text-emerald-400"}>
          {failed ? failed.label : "Looks good"}
        </span>
        {nameLimits.max && (
          <span className="text-gray-400">
            {draft.trim().length} / {nameLimits.max}
          </span>
        )}
      </div>
      <FormError message={error} />
      <EditorActions
        onCancel={onDone}
        onSave={() => save({ brandName: draft.trim() })}
        saving={saving}
        disabled={!allPassed(rules) || draft.trim() === savedName}
      />
    </div>
  );
}

/** Category + sub-categories (always saved together), up to the server's limit. */
export function CategoryEditor({ onDone, onSaved }) {
  const { limits } = useOnboardingFlow();
  const { brand } = useSavedBrand();
  const maxSubs = limits?.maxSubCategories ?? null;
  const [draftCategory, setDraftCategory] = useState(brand?.categoryId ?? null);
  const [draftSubIds, setDraftSubIds] = useState(brand?.subCategoryIds ?? []);
  const { categories, subCategories: subList, categoriesLoading, subCategoriesLoading } = useCategories(draftCategory);
  const { save, saving, error } = useBasicDetailsSave({ onDone, onSaved, fallback: "Couldn't save the category. Please try again." });

  const categoryOptions = useMemo(() => categories.map(toOption).filter((c) => c.id && c.name), [categories]);
  const subOptions = useMemo(() => subList.map(toOption).filter((c) => c.id && c.name), [subList]);
  const atLimit = maxSubs != null && draftSubIds.length >= maxSubs;

  const pickCategory = (id) => {
    setDraftCategory(id);
    setDraftSubIds([]);
  };
  const toggleSub = (id) =>
    setDraftSubIds((list) => (list.includes(id) ? list.filter((s) => s !== id) : atLimit ? list : [...list, id]));

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300" htmlFor="inline-category">
        Category
      </label>
      <select
        id="inline-category"
        value={draftCategory || ""}
        onChange={(e) => pickCategory(e.target.value)}
        disabled={categoriesLoading}
        className={inputClass}
      >
        <option value="" disabled>
          {categoriesLoading ? "Loading categories…" : "Choose a category"}
        </option>
        {categoryOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <p className="mb-1.5 mt-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
        Sub-categories{maxSubs != null ? ` · up to ${maxSubs}` : " · pick all that apply"}
      </p>
      {subCategoriesLoading ? (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
          Loading…
        </p>
      ) : subOptions.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">No sub-categories for this category — choose another one.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {subOptions.map((option) => {
            const active = draftSubIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                disabled={!active && atLimit}
                onClick={() => toggleSub(option.id)}
                className={`inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {active && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                {option.name}
              </button>
            );
          })}
        </div>
      )}
      <FormError message={error} />
      <EditorActions
        onCancel={onDone}
        onSave={() => save({ categoryId: draftCategory, subCategoryIds: draftSubIds })}
        saving={saving}
        disabled={!draftCategory || draftSubIds.length === 0}
      />
    </div>
  );
}

/**
 * Business status. Changeable only while `editable.registrationStatus` and
 * not `registrationStatusLocked`; a change before submit opens the new path's
 * verification screens (guide §4.3 exception).
 */
export function BusinessStatusEditor({ onDone, onSaved }) {
  const { status } = useOnboardingFlow();
  const savedPath = status?.kycPath ?? null;
  const locked = Boolean(status?.registrationStatusLocked) || status?.editable?.registrationStatus === false;
  const [draft, setDraft] = useState(savedPath);
  const changed = draft !== savedPath;
  const { save, saving, error } = useBasicDetailsSave({ onDone, onSaved, fallback: "Couldn't change the business status. Please try again." });

  return (
    <div>
      <div role="radiogroup" aria-label="Business status" className="flex flex-col gap-1.5">
        {STATUS_OPTIONS.map((option) => {
          const active = draft === option.kycPath;
          return (
            <button
              key={option.kycPath}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setDraft(option.kycPath)}
              disabled={locked && option.kycPath !== savedPath}
              className={`flex min-h-9 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                active
                  ? "bg-emerald-50 ring-1 ring-emerald-500 dark:bg-emerald-500/10"
                  : "bg-white ring-1 ring-gray-200 hover:ring-gray-300 dark:bg-gray-900 dark:ring-gray-700"
              }`}
            >
              <span
                className={`grid size-3.5 shrink-0 place-items-center rounded-full ${active ? "bg-emerald-500" : "ring-2 ring-inset ring-gray-300 dark:ring-gray-600"}`}
                aria-hidden="true"
              >
                {active && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{KYC_PATH_LABELS[option.kycPath]}</span>
            </button>
          );
        })}
      </div>
      {locked && (
        <p className="mt-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
          Locked because your GST / PAN is saved. Contact support to change it.
        </p>
      )}
      {changed && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
          You&apos;ll go through the new path&apos;s verification, then come back here.
        </p>
      )}
      <FormError message={error} />
      <EditorActions onCancel={onDone} onSave={() => save({ kycPath: draft })} saving={saving} disabled={!changed || !draft} />
    </div>
  );
}
