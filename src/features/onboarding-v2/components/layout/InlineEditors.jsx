import { useMemo, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { useCategories } from "@/features/oulet/New folder/hooks/useCategories";
import { BRANCHES } from "../../config/onboardingFlow";
import FormError from "../ui/FormError";
import { NAME_LIMITS } from "../../constants/onboardingOptions";
import { saveBusinessNames } from "../../services/onboardingApi";
import { saveCategorySelection } from "../../services/pendingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { selectStatusLocked } from "../../utils/statusLock";
import { toOption } from "../../steps/basics/categoryHelpers";
import { allPassed, brandNameRules } from "../../validation/rules";

// In-place editors for the review page: the vendor changes a value inside
// its review card, without leaving the page.

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


/** Brand name — same rules as the Brand name screen. */
export function BrandNameEditor({ onDone }) {
  const brandName = useOnboardingV2Store((s) => s.form.brandName);
  const legalName = useOnboardingV2Store((s) => s.form.legalName);
  const setField = useOnboardingV2Store((s) => s.setField);
  const [draft, setDraft] = useState(brandName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const rules = useMemo(() => brandNameRules(draft), [draft]);
  const failed = rules.find((r) => !r.passed);

  const save = async () => {
    const value = draft.trim();
    try {
      setSaving(true);
      setError("");
      // Names are already on the backend once the legal name is known.
      if (legalName) await saveBusinessNames({ legalName, brandName: value });
      setField("brandName", value);
      onDone();
    } catch (err) {
      setError(err?.message || "Couldn't save the brand name. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={NAME_LIMITS.brandMax}
        aria-label="Brand name"
        className={inputClass}
        autoFocus
      />
      <div className="mt-1 flex justify-between gap-3 text-[11px]">
        <span className={failed ? "text-amber-700 dark:text-amber-400" : "font-semibold text-emerald-700 dark:text-emerald-400"}>
          {failed ? failed.label : "Looks good"}
        </span>
        <span className="text-gray-400">
          {draft.length} / {NAME_LIMITS.brandMax}
        </span>
      </div>
      <FormError message={error} />
      <EditorActions onCancel={onDone} onSave={save} saving={saving} disabled={!allPassed(rules) || draft.trim() === brandName} />
    </div>
  );
}

/** Category + sub-categories, from the real categories API. */
export function CategoryEditor({ onDone }) {
  const categoryId = useOnboardingV2Store((s) => s.form.categoryId);
  const subCategories = useOnboardingV2Store((s) => s.form.subCategories);
  const setField = useOnboardingV2Store((s) => s.setField);
  const [draftCategory, setDraftCategory] = useState(categoryId);
  const [draftSubs, setDraftSubs] = useState(subCategories || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { categories, subCategories: subList, categoriesLoading, subCategoriesLoading } = useCategories(draftCategory);

  const categoryOptions = useMemo(() => categories.map(toOption).filter((c) => c.id && c.name), [categories]);
  const subOptions = useMemo(() => subList.map(toOption).filter((c) => c.id && c.name), [subList]);
  const needsSubs = subOptions.length > 0 && draftSubs.length === 0;

  const pickCategory = (id) => {
    setDraftCategory(id);
    setDraftSubs([]);
  };
  const toggleSub = (option) =>
    setDraftSubs((list) => (list.some((s) => s.id === option.id) ? list.filter((s) => s.id !== option.id) : [...list, option]));

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      await saveCategorySelection({ categoryId: draftCategory, subCategoryIds: draftSubs.map((s) => s.id) });
      setField("categoryId", draftCategory);
      setField("categoryName", categoryOptions.find((c) => c.id === draftCategory)?.name || "");
      setField("subCategories", draftSubs);
      onDone();
    } catch (err) {
      setError(err?.message || "Couldn't save the category. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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

      <p className="mb-1.5 mt-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Sub-categories · pick all that apply</p>
      {subCategoriesLoading ? (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
          Loading…
        </p>
      ) : subOptions.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">No sub-categories for this category.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {subOptions.map((option) => {
            const active = draftSubs.some((s) => s.id === option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleSub(option)}
                className={`inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition ${
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
      <EditorActions onCancel={onDone} onSave={save} saving={saving} disabled={!draftCategory || needsSubs} />
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: BRANCHES.GST, label: "I have GST", hint: "GSTIN for this business" },
  { value: BRANCHES.REG_NO_GST, label: "Registered, no GST", hint: "Company, LLP, firm, trust or society" },
  { value: BRANCHES.UNREGISTERED, label: "Not registered", hint: "Small shop, home business or new venture" },
];

/**
 * Business status. Changing it changes the verification path, so saving a
 * different option hands off to `onBranchChange` (which opens the new
 * path's first step) instead of staying on the review page.
 */
export function BusinessStatusEditor({ onDone, onBranchChange }) {
  const branch = useOnboardingV2Store((s) => s.branch);
  // Business verification done → status is fixed.
  const statusLocked = useOnboardingV2Store(selectStatusLocked);
  const [draft, setDraft] = useState(branch);
  const changed = draft !== branch;

  return (
    <div>
      <div role="radiogroup" aria-label="Business status" className="flex flex-col gap-1.5">
        {STATUS_OPTIONS.map((option) => {
          const active = draft === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setDraft(option.value)}
              disabled={statusLocked && option.value !== branch}
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
              <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{option.label}</span>
            </button>
          );
        })}
      </div>
      {statusLocked && (
        <p className="mt-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
          Locked because your business verification is done. Contact support to change it.
        </p>
      )}
      {changed && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
          You&apos;ll verify your business again on the new path.
        </p>
      )}
      <EditorActions onCancel={onDone} onSave={() => (changed ? onBranchChange(draft) : onDone())} saving={false} disabled={!changed} />
    </div>
  );
}
