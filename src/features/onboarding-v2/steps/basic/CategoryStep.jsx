import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Ellipsis, FileText, LayoutGrid, Lock, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import InfoPanel from "../../components/ui/InfoPanel";
import Notice from "../../components/ui/Notice";
import OptionCard from "../../components/ui/OptionCard";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { SelectField } from "../../components/ui/TextField";
import { LICENCE_HINTS, SAMPLE_CATEGORIES, VISIBLE_CATEGORY_COUNT } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";

const UNLOCKS = [
  { icon: Search, title: "Get discovered", text: "Customers browse vouchers by category." },
  { icon: FileText, title: "Right documents", text: "We suggest the licence you need, like FSSAI for food." },
];

// Sub-categories offered as one-tap chips; the select lists them all.
const QUICK_SUB_COUNT = 5;

export default function CategoryStep() {
  const { next } = useOnboardingFlow();
  const categoryId = useOnboardingV2Store((s) => s.form.categoryId);
  const subCategory = useOnboardingV2Store((s) => s.form.subCategory);
  const setField = useOnboardingV2Store((s) => s.setField);

  const selectedIndex = SAMPLE_CATEGORIES.findIndex((c) => c.id === categoryId);
  // Keep the picked category visible even when it sits behind "More".
  const [showAll, setShowAll] = useState(selectedIndex >= VISIBLE_CATEGORY_COUNT);
  const category = SAMPLE_CATEGORIES[selectedIndex] ?? null;

  const visibleCategories = showAll ? SAMPLE_CATEGORIES : SAMPLE_CATEGORIES.slice(0, VISIBLE_CATEGORY_COUNT);
  const hasMore = !showAll && SAMPLE_CATEGORIES.length > VISIBLE_CATEGORY_COUNT;

  const subOptions = useMemo(
    () => (category?.subCategories ?? []).map((name) => ({ value: name, label: name })),
    [category],
  );

  const selectCategory = (id) => {
    if (id === categoryId) return;
    setField("categoryId", id);
    setField("subCategory", null);
  };

  const isValid = Boolean(category && subCategory);

  return (
    <StepCard
      icon={LayoutGrid}
      title="What does your business do?"
      subtitle="Pick the category that fits best. Customers find you through it, and we suggest the right documents from it."
      aside={
        <>
          <InfoPanel title="What this unlocks" tone="emerald" items={UNLOCKS} />
          <InfoPanel title="Licence you'll be asked for">
            <div>
              <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                {category ? category.licence : "Pick a category to see it"}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
                {category ? LICENCE_HINTS[category.licence] : "Food needs FSSAI, pharmacy a drug licence, others Udyam, Shop & Establishment or Trade licence."}
              </p>
            </div>
          </InfoPanel>
        </>
      }
      footer={
        <StepFooter
          start={
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Your selection</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-gray-900 dark:text-gray-100">
                {category ? (
                  <>
                    {category.name}
                    <ChevronRight size={14} className="text-gray-400" aria-hidden="true" />
                    {subCategory ?? <span className="font-medium text-gray-500">Choose a sub-category</span>}
                  </>
                ) : (
                  <span className="font-medium text-gray-500">Nothing selected yet</span>
                )}
              </p>
            </div>
          }
        >
          <Button onClick={next} disabled={!isValid} icon={ArrowRight}>
            Continue
          </Button>
        </StepFooter>
      }
    >
      <fieldset>
        <legend className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
          Category <span className="text-red-500">*</span>
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
          {visibleCategories.map((c) => (
            <OptionCard
              key={c.id}
              variant="tile"
              icon={c.icon}
              title={c.name}
              selected={c.id === categoryId}
              onSelect={() => selectCategory(c.id)}
            />
          ))}
          {hasMore && (
            <OptionCard variant="tile" icon={Ellipsis} title="More" selected={false} onSelect={() => setShowAll(true)} />
          )}
        </div>
      </fieldset>

      {category && (
        <div>
          <SelectField
            id="sub-category"
            label="Sub-category"
            required
            placeholder="Choose a sub-category"
            options={subOptions}
            value={subCategory ?? ""}
            onChange={(e) => setField("subCategory", e.target.value)}
          />
          <div className="mt-2.5 flex flex-wrap gap-2" aria-label="Popular sub-categories">
            {category.subCategories.slice(0, QUICK_SUB_COUNT).map((name) => {
              const active = name === subCategory;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setField("subCategory", name)}
                  className={`min-h-9 rounded-full px-3.5 text-xs transition ${
                    active
                      ? "bg-emerald-500 font-bold text-white"
                      : "bg-gray-100 font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Notice icon={Lock}>Category is a legal detail. After approval it can only be changed through support.</Notice>
    </StepCard>
  );
}
