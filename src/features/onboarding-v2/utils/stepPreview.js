import { KYC_PATHS, SCREEN_LABELS, SCREENS } from "../config/screens";
import { ENTITY_LABELS, KYC_PATH_LABELS, docTypeLabel } from "../constants/onboardingOptions";

// Read-only summary of a completed sidebar group, built from what the SERVER
// has saved: GET /brands/get (brand), GET /brands/onboarding/documents and the
// onboarding status. Shown by StepPreviewPage.

/**
 * @typedef {Object} PreviewSection
 * @property {string} screenId
 * @property {string} title
 * @property {{ label: string, value: string|null, wide?: boolean }[]} rows
 * @property {boolean} [compact]   one big value
 * @property {'documents'} [kind]
 * @property {string} [note]
 * @property {boolean} [skipped]   the screen's status is SKIPPED
 */

const formatDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const maskAccount = (account) => (account ? `XXXX XXXX ${String(account).slice(-4)}` : null);

const OWNER_METHOD_LABELS = { PAN: "Owner PAN verified", ID_DOCUMENT: "Owner ID document uploaded" };

const SKIPPED_NOTE = "Skipped — you can add this later.";

/**
 * @param {string} screen
 * @param {{ status: object, brand: object|null, documents: object|null }} data
 * @returns {Omit<PreviewSection, 'screenId'|'title'>}
 */
function sectionBody(screen, { status, brand, documents }) {
  const b = brand ?? {};
  switch (screen) {
    case SCREENS.BRAND_NAME:
      return { compact: true, rows: [{ label: "Brand name", value: b.brandName ?? null }] };
    case SCREENS.BUSINESS_CATEGORY:
      return {
        rows: [
          { label: "Category", value: b.category?.name ?? null },
          { label: "Sub-categories", value: (b.subCategories ?? []).map((s) => s.name).join(", ") || null },
        ],
      };
    case SCREENS.REGISTRATION_STATUS:
      return { compact: true, rows: [{ label: "Business status", value: KYC_PATH_LABELS[status?.kycPath] ?? null }] };
    case SCREENS.GST_VERIFICATION:
      return {
        rows: [
          { label: "GSTIN", value: b.gst?.gstNumber ?? null },
          { label: "Legal business name", value: b.legalBusinessName ?? null },
        ],
      };
    case SCREENS.PAN_VERIFICATION:
      return {
        rows: [
          { label: status?.kycPath === KYC_PATHS.UNREGISTERED ? "Owner PAN" : "PAN", value: b.pan?.pan ?? null },
          { label: "Legal business name", value: b.legalBusinessName ?? null },
        ],
      };
    case SCREENS.REGISTRATION_ENTITY_TYPE:
      return { compact: true, rows: [{ label: "Business entity", value: ENTITY_LABELS[b.businessEntityType] ?? null }] };
    case SCREENS.OWNER_VERIFICATION:
      return {
        rows: [
          { label: "Method", value: OWNER_METHOD_LABELS[status?.items?.ownerVerificationMethod] ?? null },
          { label: "Owner PAN", value: status?.items?.ownerVerificationMethod === "PAN" ? b.pan?.pan ?? null : null },
          { label: "Legal business name", value: b.legalBusinessName ?? null },
        ],
      };
    case SCREENS.KYC_DOCUMENTS: {
      const rows = (documents?.documents ?? [])
        .filter((d) => d.purpose === "BUSINESS")
        .map((d) => ({ label: d.title, value: [docTypeLabel(d.docType), d.file?.originalName].filter(Boolean).join(" · ") || null }));
      return { kind: "documents", rows, note: status?.items?.documents === "SKIPPED" ? SKIPPED_NOTE : undefined };
    }
    case SCREENS.BANK_VERIFICATION:
      return {
        rows: [
          { label: "Account", value: maskAccount(b.bank?.accountNumber) },
          { label: "IFSC", value: b.bank?.ifscCode ?? null },
        ],
        note: status?.items?.bank === "SKIPPED" ? SKIPPED_NOTE : undefined,
      };
    case SCREENS.PARTNERSHIP_DEED: {
      const deed = status?.deed ?? {};
      return {
        rows: [
          { label: "Partner contract", value: deed.accepted ? "Accepted" : null },
          // Legacy (pre-v2) accepts have no date (guide §3).
          { label: "Accepted on", value: deed.isLegacy ? null : formatDate(deed.acceptedAt) },
        ],
      };
    }
    case SCREENS.SUBSCRIBE_PLAN:
      return {
        rows: [
          { label: "Plan", value: b.subscribed?.status ?? null },
          { label: "Valid till", value: formatDate(b.subscribed?.endDate) },
        ],
      };
    default:
      return { rows: [] };
  }
}

/**
 * Preview sections of one sidebar group, in the server's screen order.
 * @param {string} groupKey
 * @param {{ status: import('../types').OnboardingStatus, brand: object|null, documents: import('../types').DocumentsList|null }} data
 * @returns {PreviewSection[]}
 */
export function getGroupPreview(groupKey, data) {
  const group = data.status?.groups?.find((g) => g.key === groupKey);
  return (group?.screens ?? [])
    .filter((s) => s.status !== "MISSING")
    .map(({ screen, status }) => {
      const body = sectionBody(screen, data);
      return {
        screenId: screen,
        title: SCREEN_LABELS[screen] ?? screen,
        ...body,
        skipped: status === "SKIPPED",
        note: status === "SKIPPED" ? SKIPPED_NOTE : body.note,
      };
    });
}
