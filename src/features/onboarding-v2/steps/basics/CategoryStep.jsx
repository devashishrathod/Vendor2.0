import { useCallback, useMemo, useState } from "react";
import { ArrowRight, ChevronRight, FileText, LayoutGrid, Lock, RotateCw, Search, X } from "lucide-react";
import { useCategories } from "@/features/outlets/setup/hooks/useCategories";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import InfoPanel from "../../components/ui/InfoPanel";
import Notice from "../../components/ui/Notice";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { SCREENS } from "../../config/screens";
import { SUBCATEGORY_SEARCH_MIN, VISIBLE_CATEGORY_COUNT } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { addBasicDetails } from "../../services/onboardingApi";
import { useSavedBrand, useSavedBrandStore } from "../../store/brandStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { CategoryTile, MoreCategoriesTile, SectionHeading, SubCategoryOption } from "./CategoryOptions";
import { iconForCategory, toOption } from "./categoryHelpers";

const UNLOCKS = [
  { icon: Search, title: "Get discovered", text: "Customers browse vouchers by category." },
  { icon: FileText, title: "Right documents", text: "We suggest the licence you need, like FSSAI for food." },
];

const CATEGORY_GRID = "grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4";
const SUB_GRID = "grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3";

function RetryButton({ onClick }) {
  return (
    <Button variant="secondary" icon={RotateCw} iconPosition="start" onClick={onClick} className="min-h-9 px-3 text-xs">
      Retry
    </Button>
  );
}

function CategoryTilesSkeleton() {
  return (
    <div className={`mt-3 ${CATEGORY_GRID}`} aria-hidden="true">
      {Array.from({ length: VISIBLE_CATEGORY_COUNT + 1 }, (_, i) => (
        <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  );
}

function SubCategoriesSkeleton() {
  return (
    <div className={`mt-3 ${SUB_GRID}`} aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  );
}

/** @param {{ onRetry: () => void }} props */
function CategoryStepContent({ onRetry }) {
  const { goToServerScreen, handleFlowError } = useOnboardingFlow();
  const { brand } = useSavedBrand();
  const mergeBrand = useSavedBrandStore((s) => s.mergeBrand);

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
  const categoryIcon = iconForCategory(categoryName);
  const selectedSubs = useMemo(() => subOptions.filter((s) => selectedIds.includes(s.id)), [selectedIds, subOptions]);

  // Keep the picked category visible even when it sits behind "More".
  const selectedIndex = categoryOptions.findIndex((c) => c.id === categoryId);
  const collapsed = !showAll && categoryOptions.length > VISIBLE_CATEGORY_COUNT + 1 && selectedIndex < VISIBLE_CATEGORY_COUNT;
  const visibleCategories = collapsed ? categoryOptions.slice(0, VISIBLE_CATEGORY_COUNT) : categoryOptions;

  const showSearch = subOptions.length >= SUBCATEGORY_SEARCH_MIN;
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
      setDraftSubIds(isSelected ? selectedIds.filter((id) => id !== option.id) : [...selectedIds, option.id]);
      setSaveError("");
    },
    [selectedIds],
  );

  const clearSubs = useCallback(() => {
    setDraftSubIds([]);
    setSaveError("");
  }, []);

  const showMore = useCallback(() => setShowAll(true), []);
  const handleSearch = useCallback((event) => setSearch(event.target.value), []);
  const clearSearch = useCallback(() => setSearch(""), []);

  // The server needs one or more sub-categories of the chosen category (#20).
  const subsLoaded = Boolean(categoryId) && !subCategoriesLoading && !subCategoriesError;
  const noSubsAvailable = subsLoaded && subOptions.length === 0;
  const isValid = Boolean(categoryId) && selectedIds.length > 0;

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
      <div className="mt-3">
        <Notice tone="error" action={<RetryButton onClick={onRetry} />}>
          {categoriesError}
        </Notice>
      </div>
    );
  } else if (!categoryOptions.length) {
    categoryBody = (
      <div className="mt-3">
        <Notice action={<RetryButton onClick={onRetry} />}>No categories are available right now.</Notice>
      </div>
    );
  } else {
    categoryBody = (
      <div className={`mt-3 ${CATEGORY_GRID}`}>
        {visibleCategories.map((c) => (
          <CategoryTile
            key={c.id}
            icon={iconForCategory(c.name)}
            imageUrl={c.image}
            title={c.name}
            selected={c.id === categoryId}
            onSelect={() => selectCategory(c)}
          />
        ))}
        {collapsed && <MoreCategoriesTile hiddenCount={categoryOptions.length - VISIBLE_CATEGORY_COUNT} onClick={showMore} />}
      </div>
    );
  }

  let subBody = null;
  if (categoryId) {
    if (subCategoriesLoading) {
      subBody = <SubCategoriesSkeleton />;
    } else if (subCategoriesError) {
      subBody = (
        <div className="mt-3">
          <Notice tone="error" action={<RetryButton onClick={onRetry} />}>
            {subCategoriesError}
          </Notice>
        </div>
      );
    } else if (noSubsAvailable) {
      subBody = (
        <div className="mt-3">
          <Notice>This category has no sub-categories yet, so it can&apos;t be picked. Please choose another category.</Notice>
        </div>
      );
    } else {
      subBody = (
        <>
          {showSearch && (
            <div className="relative mt-3">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={handleSearch}
                placeholder={`Search ${subOptions.length} sub-categories`}
                aria-label="Search sub-categories"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-base font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 sm:text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          {filteredSubs.length ? (
            <div className={`mt-3 ${SUB_GRID}`}>
              {filteredSubs.map((sub) => (
                <SubCategoryOption
                  key={sub.id}
                  title={sub.name}
                  icon={categoryIcon}
                  imageUrl={sub.image}
                  selected={selectedIds.includes(sub.id)}
                  onToggle={() => toggleSub(sub)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-gray-50 px-3.5 py-3 text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              No sub-categories match &ldquo;{search}&rdquo;.
            </p>
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
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selectedIds.length} selected</p>
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
      <div role="group" aria-labelledby="category-heading">
        <SectionHeading
          id="category-heading"
          number={1}
          title="Category"
          hint="Pick the one that best describes your business."
          done={Boolean(categoryId)}
        />
        {categoryBody}
      </div>

      {categoryId && (
        <div role="group" aria-labelledby="subcategory-heading" className="border-t border-gray-100 pt-5 dark:border-gray-800">
          <SectionHeading
            id="subcategory-heading"
            number={2}
            title="Sub-categories"
            hint={categoryName ? `Pick everything you offer in ${categoryName}.` : "Pick everything you offer."}
            done={selectedIds.length > 0}
            aside={
              selectedIds.length > 0 && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25">
                    {selectedIds.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={clearSubs}
                    className="rounded-full px-2 py-1 text-[11px] font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    Clear
                  </button>
                </div>
              )
            }
          />
          {subBody}
        </div>
      )}

      <Notice icon={Lock}>Category is a legal detail. After you submit for review it can only be changed through support.</Notice>

      <FormError message={saveError} />
    </StepCard>
  );
}

/**
 * BUSINESS_CATEGORY (guide §4.2): one category + any number of its
 * sub-categories, saved with
 * `add-basic-details { step: BUSINESS_CATEGORY, categoryId, subCategoryIds }`.
 * Retry remounts the content so the category hook loads again.
 */
export default function CategoryStep() {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return <CategoryStepContent key={attempt} onRetry={retry} />;
}
