import { useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";
import { updateBasicDetails } from "@/features/onboarding/services/api/brand.api";
import Button from "@/features/onboarding-v2/components/ui/Button";
import FormError from "@/features/onboarding-v2/components/ui/FormError";
import { SelectField, TextField } from "@/features/onboarding-v2/components/ui/TextField";
import { NAME_LIMITS } from "@/features/onboarding-v2/constants/onboardingOptions";
import { toOption } from "@/features/onboarding-v2/steps/basics/categoryHelpers";
import { brandNameRules } from "@/features/onboarding-v2/validation/rules";
import { useCategories } from "../../hooks/useCategories";
import { updateBrandDetails } from "../../services/brandOutletApi";
import {
  ENTITY_OPTIONS,
  STATUS_OPTIONS,
  entityFullLabel,
  idOf,
  isPickableEntity,
  registrationStatusOf,
} from "./correctionHelpers";

const toSelectOptions = (items) =>
  items
    .map(toOption)
    .filter((o) => o.id && o.name)
    .map((o) => ({ value: o.id, label: o.name }));

/** Read-only field with the same label / hint / box layout as the inputs. */
function LockedField({ label, hint, value }) {
  return (
    <div>
      <p className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      <p className="mt-1.5 flex h-12 items-center gap-2 rounded-[10px] border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-200">
        <Lock size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

/**
 * Basic details for a rejected brand, the same fields as the wizard's Basic
 * Details step, with its rules:
 * - brand name: same checks as the Brand name screen
 * - business status: locked once that path's verification is saved (wizard rule)
 * - category + sub-category: the backend keeps one sub-category, its category follows
 * - business entity: the wizard's 5 options; locked when the GST registration decides it
 * Saves only what changed: names / status / entity through
 * PUT /brands/onboarding/update-basic-details (API doc #27), the
 * sub-category through PUT /brands/update (API doc #32).
 * @param {{
 *   brand: object, brandId: string, branch: string, statusLocked: boolean,
 *   onBranchChange: (branch: string) => void, lockedEntity: string|null,
 *   suggestedEntity: string|null, onSaved: (message: string) => void,
 * }} props
 */
export default function BasicDetailsCorrection({
  brand,
  brandId,
  branch,
  statusLocked,
  onBranchChange,
  lockedEntity,
  suggestedEntity,
  onSaved,
}) {
  const initialEntity = isPickableEntity(brand?.businessEntityType) ? brand.businessEntityType : "";
  const [brandName, setBrandName] = useState(brand?.brandName || "");
  const [savedBrandName, setSavedBrandName] = useState(brand?.brandName || "");
  const [status, setStatus] = useState(branch);
  const [savedStatus, setSavedStatus] = useState(branch);
  const [categoryId, setCategoryId] = useState(idOf(brand?.categoryId));
  const [savedCategoryId, setSavedCategoryId] = useState(idOf(brand?.categoryId));
  const [subCategoryId, setSubCategoryId] = useState(idOf(brand?.subCategoryId));
  const [savedSubCategoryId, setSavedSubCategoryId] = useState(idOf(brand?.subCategoryId));
  const [entity, setEntity] = useState(initialEntity);
  const [savedEntity, setSavedEntity] = useState(initialEntity);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const { categories, subCategories, categoriesLoading, subCategoriesLoading, categoriesError, subCategoriesError } =
    useCategories(categoryId);
  const categoryOptions = useMemo(() => toSelectOptions(categories), [categories]);
  const subCategoryOptions = useMemo(() => toSelectOptions(subCategories), [subCategories]);

  const trimmed = brandName.trim();
  const rules = useMemo(() => brandNameRules(brandName), [brandName]);
  const brandChanged = trimmed !== savedBrandName.trim();
  const brandError = brandChanged ? rules.find((rule) => !rule.passed)?.label : "";
  const statusChanged = !statusLocked && status !== savedStatus;
  const categoryChanged = categoryId !== savedCategoryId || subCategoryId !== savedSubCategoryId;
  // The backend stores the sub-category (its category follows), so a changed
  // category needs a sub-category picked.
  const subCategoryMissing = categoryChanged && !subCategoryId;
  const entityChanged = !lockedEntity && Boolean(entity) && entity !== savedEntity;
  const anyChange = brandChanged || statusChanged || categoryChanged || entityChanged;
  const canSave = anyChange && !brandError && !subCategoryMissing && !saving;

  const touch = () => {
    setError("");
    setJustSaved(false);
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const basics = {
        ...(brandChanged ? { brandName: trimmed } : {}),
        ...(entityChanged ? { businessEntityType: entity } : {}),
        ...(statusChanged && registrationStatusOf(status) !== registrationStatusOf(savedStatus)
          ? { businessRegistrationStatus: registrationStatusOf(status) }
          : {}),
      };
      if (Object.keys(basics).length) await updateBasicDetails(basics);
      if (categoryChanged) await updateBrandDetails(brandId, { subCategoryId });

      if (brandChanged) setSavedBrandName(trimmed);
      if (entityChanged) setSavedEntity(entity);
      if (categoryChanged) {
        setSavedCategoryId(categoryId);
        setSavedSubCategoryId(subCategoryId);
      }
      if (statusChanged) {
        setSavedStatus(status);
        onBranchChange(status);
      }
      setJustSaved(true);
      onSaved("Basic details saved.");
    } catch (err) {
      setError(err?.message || "Couldn't save your basic details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // One-line hints under every label, so fields side by side line up.
  const entityHint =
    suggestedEntity && suggestedEntity !== entity
      ? `Recommended from your PAN: ${entityFullLabel(suggestedEntity)}`
      : "Must match your business registration";
  let subCategoryHint = "Pick the closest match";
  if (subCategoriesError) subCategoryHint = subCategoriesError;
  else if (categoryId && !subCategoriesLoading && subCategoryOptions.length === 0) subCategoryHint = "No sub-categories for this category";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <TextField
          id="fix-brand-name"
          label="Brand name"
          hint="Shown on vouchers and your outlet page"
          value={brandName}
          onChange={(e) => {
            setBrandName(e.target.value);
            touch();
          }}
          maxLength={NAME_LIMITS.brandMax}
          error={brandError || undefined}
          counter={`${trimmed.length} / ${NAME_LIMITS.brandMax}`}
          valid={brandChanged && !brandError}
        />

        {statusLocked ? (
          <LockedField
            label="Business status"
            hint="Locked — your business verification is done for this status"
            value={STATUS_OPTIONS.find((o) => o.value === status)?.label ?? ""}
          />
        ) : (
          <SelectField
            id="fix-status"
            label="Business status"
            hint="How your business is registered"
            placeholder="Select business status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              touch();
            }}
          />
        )}

        <SelectField
          id="fix-category"
          label="Category"
          hint={categoriesError || "What your business offers"}
          placeholder={categoriesLoading ? "Loading categories…" : "Select category"}
          options={categoryOptions}
          value={categoryId}
          disabled={categoriesLoading}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setSubCategoryId("");
            touch();
          }}
        />

        <SelectField
          id="fix-sub-category"
          label="Sub-category"
          hint={subCategoryHint}
          placeholder={subCategoriesLoading ? "Loading…" : "Select sub-category"}
          options={subCategoryOptions}
          value={subCategoryId}
          disabled={!categoryId || subCategoriesLoading || subCategoryOptions.length === 0}
          onChange={(e) => {
            setSubCategoryId(e.target.value);
            touch();
          }}
        />

        {lockedEntity ? (
          <LockedField label="Business entity" hint="Taken from your GST registration" value={entityFullLabel(lockedEntity)} />
        ) : (
          <SelectField
            id="fix-entity"
            label="Business entity"
            hint={entityHint}
            placeholder="Select business entity"
            options={ENTITY_OPTIONS}
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              touch();
            }}
          />
        )}
      </div>

      <FormError message={error || (subCategoryMissing && subCategoryOptions.length > 0 ? "Pick a sub-category to save the new category." : "")} />

      <div className="flex items-center justify-end gap-3">
        {justSaved && !anyChange && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <Check size={13} strokeWidth={3} aria-hidden="true" />
            Saved
          </span>
        )}
        <Button onClick={save} disabled={!canSave} loading={saving}>
          {saving ? "Saving…" : "Save basic details"}
        </Button>
      </div>
    </div>
  );
}
