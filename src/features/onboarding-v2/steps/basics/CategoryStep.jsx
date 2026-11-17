import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronRight, Ellipsis, FileText, LayoutGrid, LoaderCircle, Lock, RotateCw, Search } from "lucide-react";
import { useCategories } from "@/features/oulet/New folder/hooks/useCategories";
import Button from "../../components/ui/Button";
import InfoPanel from "../../components/ui/InfoPanel";
import Notice from "../../components/ui/Notice";
import FormError from "../../components/ui/FormError";
import OptionCard from "../../components/ui/OptionCard";
import RemoteIcon from "../../components/ui/RemoteIcon";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { VISIBLE_CATEGORY_COUNT } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { fetchRequiredDocuments, saveCategorySelection } from "../../services/pendingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { iconForCategory, toOption } from "./categoryHelpers";

const UNLOCKS = [
  { icon: Search, title: "Get discovered", text: "Customers browse vouchers by category." },
  { icon: FileText, title: "Right documents", text: "We suggest the licence you need, like FSSAI for food." },
];

const OPTIONAL_DOCUMENT_POINTS = 5;

function RetryButton({ onClick }) {
  return (
    <Button variant="secondary" icon={RotateCw} iconPosition="start" onClick={onClick} className="min-h-9 px-3 text-xs">
      Retry
    </Button>
  );
}

function SectionLabel({ children }) {
  return <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{children}</p>;
}

/** "Documents you'll need" aside, for the selected category + sub-categories. */
function RequiredDocumentsPanel({ subCategoryIds, categoryName, subCategoryNames }) {
  const [docs, setDocs] = useState({ required: [], optional: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const idsKey = subCategoryIds.join(",");
  const namesKey = [categoryName, ...subCategoryNames].join("|");
  const hasSelection = subCategoryIds.length > 0;

  useEffect(() => {
    if (!idsKey) return undefined;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [category, ...subs] = namesKey.split("|");
        const result = await fetchRequiredDocuments({ categoryName: category, subCategoryNames: subs });
        if (!cancelled) setDocs({ required: result?.required ?? [], optional: result?.optional ?? [] });
      } catch (err) {
        console.error("Required documents fetch failed:", err);
        if (!cancelled) setError("Couldn't load the document list.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [idsKey, namesKey, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  let body;
  if (!hasSelection) {
    body = <p className="text-xs text-gray-500 dark:text-gray-400">Pick your sub-categories to see the list.</p>;
  } else if (loading) {
    body = (
      <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
        Loading documents…
      </p>
    );
  } else if (error) {
    body = (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
        <RetryButton onClick={retry} />
      </div>
    );
  } else {
    body = (
      <>
        <div className="flex flex-col gap-2">
          <SectionLabel>Required to go live</SectionLabel>
          {docs.required.length ? (
            docs.required.map((title) => (
              <div key={title} className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{title}</span>
                <StatusPill tone="danger">Required</StatusPill>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-600 dark:text-gray-400">No licence required for your selection.</p>
          )}
        </div>
        {docs.optional.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel>Optional · adds profile strength</SectionLabel>
            {docs.optional.map((title) => (
              <div key={title} className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{title}</span>
                <StatusPill>+{OPTIONAL_DOCUMENT_POINTS}</StatusPill>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <InfoPanel title="Documents you'll need">
      <div className="flex flex-col gap-3" aria-live="polite">
        {body}
      </div>
      <p className="border-t border-gray-200 pt-2.5 text-[11px] leading-relaxed text-gray-500 dark:border-gray-700 dark:text-gray-400">
        List comes from your sub-categories. You can upload later, but you can&apos;t go live without the required ones.
      </p>
    </InfoPanel>
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
  const { next } = useOnboardingFlow();
  const categoryId = useOnboardingV2Store((s) => s.form.categoryId);
  const categoryName = useOnboardingV2Store((s) => s.form.categoryName);
  const selectedSubs = useOnboardingV2Store((s) => s.form.subCategories);
  const setField = useOnboardingV2Store((s) => s.setField);

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
  const selectedIds = useMemo(() => selectedSubs.map((s) => s.id), [selectedSubs]);

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
      setField("categoryId", option.id);
      setField("categoryName", option.name);
      setField("subCategories", []);
      setSearch("");
      setSaveError("");
    },
    [categoryId, setField],
  );

  const toggleSub = useCallback(
    (option) => {
      const isSelected = selectedSubs.some((s) => s.id === option.id);
      setField("subCategories", isSelected ? selectedSubs.filter((s) => s.id !== option.id) : [...selectedSubs, option]);
      setSaveError("");
    },
    [selectedSubs, setField],
  );

  const showMore = useCallback(() => setShowAll(true), []);
  const handleSearch = useCallback((event) => setSearch(event.target.value), []);

  // A category the backend lists with no sub-categories can still continue.
  const subsLoaded = Boolean(categoryId) && !subCategoriesLoading && !subCategoriesError;
  const noSubsAvailable = subsLoaded && subOptions.length === 0;
  const isValid = Boolean(categoryId) && (selectedSubs.length > 0 || noSubsAvailable);

  const handleContinue = useCallback(async () => {
    if (!isValid) return;
    try {
      setSaving(true);
      setSaveError("");
      await saveCategorySelection({ categoryId, subCategoryIds: selectedIds });
      next();
    } catch (err) {
      console.error("Category save failed:", err);
      setSaveError(err?.message || "Couldn't save your category. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [categoryId, isValid, next, selectedIds]);

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
          <Notice>This category has no sub-categories yet. You can continue with the category alone.</Notice>
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
                    onClick={() => toggleSub(sub)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:min-h-8 ${
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
      aside={
        <>
          <InfoPanel title="What this unlocks" tone="emerald" items={UNLOCKS} />
          <RequiredDocumentsPanel
            subCategoryIds={selectedIds}
            categoryName={categoryName}
            subCategoryNames={selectedSubs.map((s) => s.name)}
          />
        </>
      }
      footer={
        <StepFooter
          start={
            <div className="rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Your selection</p>
                {selectedSubs.length > 0 && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selectedSubs.length} selected</p>
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
            <span className="font-normal text-gray-500"> · pick all that apply</span>
          </legend>
          {subBody}
        </fieldset>
      )}

      <Notice icon={Lock}>Category is a legal detail. After approval it can only be changed through support.</Notice>

      <FormError message={saveError} />
    </StepCard>
  );
}

/**
 * Screen 04 · Category + multiple sub-categories, from the real categories
 * API. Retry remounts the content so the category hook loads again.
 */
export default function CategoryStep() {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return <CategoryStepContent key={attempt} onRetry={retry} />;
}
