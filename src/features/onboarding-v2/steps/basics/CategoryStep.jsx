import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronRight, Ellipsis, FileText, LayoutGrid, LoaderCircle, Lock, RotateCw, Search } from "lucide-react";
import { useCategories } from "@/features/oulet/New folder/hooks/useCategories";
import Button from "../../components/ui/Button";
import InfoPanel from "../../components/ui/InfoPanel";
import Notice from "../../components/ui/Notice";
import FormError from "../../components/ui/FormError";
import OptionCard from "../../components/ui/OptionCard";
import RemoteIcon from "../../components/ui/RemoteIcon";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { SCREENS } from "../../config/screens";
import { VISIBLE_CATEGORY_COUNT } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { addBasicDetails } from "../../services/onboardingApi";
import { useSavedBrand, useSavedBrandStore } from "../../store/brandStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { iconForCategory, toOption } from "./categoryHelpers";

const UNLOCKS = [
  { icon: Search, title: "Get discovered", text: "Customers browse vouchers by category." },
  { icon: FileText, title: "Right documents", text: "We suggest the licence you need, like FSSAI for food." },
];

function RetryButton({ onClick }) {
  return (
    <Button variant="secondary" icon={RotateCw} iconPosition="start" onClick={onClick} className="min-h-9 px-3 text-xs">
      Retry
    </Button>
  );
}

function CategoryTilesSkeleton() {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: VISIBLE_CATEGORY_COUNT + 1 }, (_, i) => (
        <div key={i} className="h-[88px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  );
}

/** @param {{ onRetry: () => void }} props */
function CategoryStepContent({ onRetry }) {
  const { limits, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const { brand } = useSavedBrand();
  const mergeBrand = useSavedBrandStore((s) => s.mergeBrand);
  // Server limit (owner answer 8) — never hardcoded.
  const maxSubs = limits?.maxSubCategories ?? null;

  // null = untouched: the saved category / sub-categories show once loaded.
  const [draftCategoryId, setDraftCategoryId] = useState(null);
  const [draftSubIds, setDraftSubIds] = useState(null);
  const categoryId = draftCategoryId ?? brand?.categoryId ?? null;
  const selectedIds = useMemo(() => draftSubIds ?? brand?.subCategoryIds ?? [], [brand?.subCategoryIds, draftSubIds]);

  const {
    categories,
    subCategories,
    categoriesLoading,
    subCategoriesLoading,
    categoriesError,
    subCategoriesError,
  } = useCategories(categoryId);

  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const categoryOptions = useMemo(() => categories.map(toOption).filter((c) => c.id && c.name), [categories]);
  const subOptions = useMemo(() => subCategories.map(toOption).filter((c) => c.id && c.name), [subCategories]);
  const categoryName = categoryOptions.find((c) => c.id === categoryId)?.name ?? "";
  const selectedSubs = useMemo(() => subOptions.filter((s) => selectedIds.includes(s.id)), [selectedIds, subOptions]);
  const atLimit = maxSubs != null && selectedIds.length >= maxSubs;

  // Keep the picked category visible even when it sits behind "More".
  const selectedIndex = categoryOptions.findIndex((c) => c.id === categoryId);
  const collapsed = !showAll && categoryOptions.length > VISIBLE_CATEGORY_COUNT + 1 && selectedIndex < VISIBLE_CATEGORY_COUNT;
  const visibleCategories = collapsed ? categoryOptions.slice(0, VISIBLE_CATEGORY_COUNT) : categoryOptions;

  const filteredSubs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? subOptions.filter((s) => s.name.toLowerCase().includes(query)) : subOptions;
  }, [search, subOptions]);

  const selectCategory = useCallback(
    (option) => {
      if (option.id === categoryId) return;
      setDraftCategoryId(option.id);
      setDraftSubIds([]);
      setSearch("");
      setSaveError("");
    },
    [categoryId],
  );

  const toggleSub = useCallback(
    (option) => {
      const isSelected = selectedIds.includes(option.id);
      if (!isSelected && atLimit) return;
      setDraftSubIds(isSelected ? selectedIds.filter((id) => id !== option.id) : [...selectedIds, option.id]);
      setSaveError("");
    },
    [atLimit, selectedIds],
  );

  const showMore = useCallback(() => setShowAll(true), []);
  const handleSearch = useCallback((event) => setSearch(event.target.value), []);

  // The server needs one or more sub-categories of the chosen category (#20).
  const subsLoaded = Boolean(categoryId) && !subCategoriesLoading && !subCategoriesError;
  const noSubsAvailable = subsLoaded && subOptions.length === 0;
  const isValid = Boolean(categoryId) && selectedIds.length > 0 && (maxSubs == null || selectedIds.length <= maxSubs);

  const handleContinue = useCallback(async () => {
    if (!isValid || saving) return;
    try {
      setSaving(true);
      setSaveError("");
      const res = await addBasicDetails(SCREENS.BUSINESS_CATEGORY, { categoryId, subCategoryIds: selectedIds });
      mergeBrand(res?.data?.brand);
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Category save failed:", err);
      // 422 SUBCATEGORY_LIMIT carries details.limit (owner answer 8).
      setSaveError(onboardingErrorMessage(err, "Couldn't save your category. Please try again."));
    } finally {
      setSaving(false);
    }
  }, [categoryId, goToServerScreen, handleFlowError, isValid, mergeBrand, saving, selectedIds]);

  let categoryBody;
  if (categoriesLoading) {
    categoryBody = <CategoryTilesSkeleton />;
  } else if (categoriesError) {
    categoryBody = (
      <div className="mt-2">
        <Notice tone="error" action={<RetryButton onClick={onRetry} />}>
          {categoriesError}
        </Notice>
      </div>
    );
  } else if (!categoryOptions.length) {
    categoryBody = (
      <div className="mt-2">
        <Notice action={<RetryButton onClick={onRetry} />}>No categories are available right now.</Notice>
      </div>
    );
  } else {
    categoryBody = (
      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
        {visibleCategories.map((c) => (
          <OptionCard
            key={c.id}
            variant="tile"
            icon={iconForCategory(c.name)}
            imageUrl={c.image}
            title={c.name}
            selected={c.id === categoryId}
            onSelect={() => selectCategory(c)}
          />
        ))}
        {collapsed && <OptionCard variant="tile" icon={Ellipsis} title="More" selected={false} onSelect={showMore} />}
      </div>
    );
  }

  let subBody = null;
  if (categoryId) {
    if (subCategoriesLoading) {
      subBody = (
        <p className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
          Loading sub-categories…
        </p>
      );
    } else if (subCategoriesError) {
      subBody = (
        <div className="mt-2">
          <Notice tone="error" action={<RetryButton onClick={onRetry} />}>
            {subCategoriesError}
          </Notice>
        </div>
      );
    } else if (noSubsAvailable) {
      subBody = (
        <div className="mt-2">
          <Notice>This category has no sub-categories yet, so it can't be picked. Please choose another category.</Notice>
        </div>
      );
    } else {
      subBody = (
        <>
          <div className="relative mt-2">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={handleSearch}
              placeholder="Search sub-categories"
              aria-label="Search sub-categories"
              className="h-12 w-full rounded-[10px] border border-gray-300 bg-white pl-10 pr-3.5 text-base font-semibold text-gray-900 shadow-xs outline-none transition placeholder:font-medium placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 sm:text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>
          {filteredSubs.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {filteredSubs.map((sub) => {
                const active = selectedIds.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    aria-pressed={active}
                    disabled={!active && atLimit}
                    onClick={() => toggleSub(sub)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-8 ${
                      active
                        ? "bg-emerald-500 font-bold text-white"
                        : "bg-gray-100 font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {active ? (
                      <Check size={12} strokeWidth={3} aria-hidden="true" />
                    ) : (
                      sub.image && (
                        <span className="-ml-1.5 grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
                          <RemoteIcon src={sub.image} className="size-full p-0.5" />
                        </span>
                      )
                    )}
                    {sub.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">No sub-categories match &ldquo;{search}&rdquo;.</p>
          )}
        </>
      );
    }
  }

  return (
    <StepCard
      icon={LayoutGrid}
      title="What does your business do?"
      subtitle="Pick one category, then every sub-category you offer. We use them to list exactly the documents you need."
      aside={<InfoPanel title="What this unlocks" tone="emerald" items={UNLOCKS} />}
      footer={
        <StepFooter
          start={
            <div className="rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Your selection</p>
                {selectedIds.length > 0 && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {maxSubs != null ? `${selectedIds.length} / ${maxSubs} selected` : `${selectedIds.length} selected`}
                  </p>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] font-bold text-gray-900 dark:text-gray-100">
                {categoryId ? (
                  <>
                    {categoryName}
                    <ChevronRight size={14} className="mx-1 inline text-gray-400" aria-hidden="true" />
                    {selectedSubs.length ? (
                      selectedSubs.map((s) => s.name).join(", ")
                    ) : (
                      <span className="font-medium text-gray-500">Choose sub-categories</span>
                    )}
                  </>
                ) : (
                  <span className="font-medium text-gray-500">Nothing selected yet</span>
                )}
              </p>
            </div>
          }
        >
          <Button onClick={handleContinue} disabled={!isValid} loading={saving} icon={ArrowRight}>
            Continue
          </Button>
        </StepFooter>
      }
    >
      <fieldset>
        <legend className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
          Category <span className="text-red-500">*</span>
        </legend>
        {categoryBody}
      </fieldset>

      {categoryId && (
        <fieldset>
          <legend className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
            Sub-categories <span className="text-red-500">*</span>
            <span className="font-normal text-gray-500">{maxSubs != null ? ` · pick up to ${maxSubs}` : " · pick all that apply"}</span>
          </legend>
          {subBody}
        </fieldset>
      )}

      <Notice icon={Lock}>Category is a legal detail. After you submit for review it can only be changed through support.</Notice>

      <FormError message={saveError} />
    </StepCard>
  );
}

/**
 * BUSINESS_CATEGORY (guide §4.2): one category + up to
 * `status.limits.maxSubCategories` of its sub-categories, saved with
 * `add-basic-details { step: BUSINESS_CATEGORY, categoryId, subCategoryIds }`.
 * Retry remounts the content so the category hook loads again.
 */
export default function CategoryStep() {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return <CategoryStepContent key={attempt} onRetry={retry} />;
}
