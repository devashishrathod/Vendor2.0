import { BRANCHES } from "../../config/onboardingFlow";
import { documentsForCategory } from "../../constants/categoryDocuments";
import { PRIMARY_ENTITY_TYPES } from "../../constants/onboardingOptions";
import { useOnboardingV2Store } from "../../store/onboardingStore";

// Shared by DocumentsEditor, the Documents step and the outlet review popup.

export const DOCUMENT_COPY = {
  registered: {
    subtitle: "Add as many as you have. Give each one a title so our team knows what it is.",
    placeholder: "e.g. Trade licence 2026",
  },
  unregistered: {
    subtitle: "Licence and shop proof help us approve you faster. Your ID is already verified in Owner KYC.",
    placeholder: "e.g. FSSAI licence or Electricity bill",
  },
};

const listNames = (names) =>
  names.length <= 1 ? names[0] || "" : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/**
 * The Documents screen's subtitle, written for this vendor: their category
 * (and sub-category) and business entity, and the main documents that
 * match them — so they know exactly what to upload.
 * @param {{ categoryName?: string, subCategories?: { name: string }[], entityType?: string|null, branch?: string|null }} input
 * @returns {string}
 */
export function documentsSubtitle({ categoryName = "", subCategories = [], entityType = null, branch = null }) {
  const subNames = subCategories.map((s) => s.name).filter(Boolean);
  const docs = documentsForCategory({ categoryName, subCategoryNames: subNames, entityType });
  const main = [...docs.required, ...docs.optional].slice(0, 3);
  const entityLabel = PRIMARY_ENTITY_TYPES.find((t) => t.value === entityType)?.label;

  const business = [
    categoryName && (subNames[0] ? `${categoryName} › ${subNames[0]}${subNames.length > 1 ? ` +${subNames.length - 1}` : ""}` : categoryName),
  ].filter(Boolean)[0];
  const who = business ? `your ${business} business` : "your business";
  const asEntity = entityLabel ? ` (${entityLabel})` : branch === BRANCHES.UNREGISTERED ? " (not registered)" : "";

  if (!main.length) return `Upload the licences and registration proof for ${who}${asEntity}. Give each one a title so our team knows what it is.`;
  return `For ${who}${asEntity}, upload mainly your ${listNames(main)}. Give each one a title so our team knows what it is.`;
}

/**
 * Upload state of the vendor's documents, for a Continue / Done button.
 * @param {{ fileName: string|null, title: string, status: string }[]} documents
 */
export function documentsStatus(documents) {
  const uploadedCount = documents.filter((d) => d.status === "uploaded").length;
  const anyUploading = documents.some((d) => d.status === "uploading");
  const missingTitle = documents.some((d) => d.fileName && !d.title.trim());
  // A file chosen but not saved yet (no upload until Save).
  const unsavedCount = documents.filter((d) => d.status === "selected").length;
  return { uploadedCount, anyUploading, missingTitle, unsavedCount, canFinish: !anyUploading && !missingTitle && unsavedCount === 0 };
}

/** Drops rows that were never filled in (no title, no file). */
export function dropEmptyDocumentRows() {
  const { form, removeDocument } = useOnboardingV2Store.getState();
  form.documents.filter((d) => !d.fileName && !d.title.trim()).forEach((d) => removeDocument(d.id));
}

