import { KYC_PATHS, SCREEN_LABELS, SCREENS } from "../config/screens";
import { ENTITY_LABELS, KYC_PATH_LABELS, docTypeLabel } from "../constants/onboardingOptions";

// Read-only summary of a completed sidebar group, built from what the SERVER
// has saved: GET /brands/get (brand), GET /brands/onboarding/documents,
// outlets / features when loaded, and the onboarding status. Shown by
// StepPreviewPage and the review page.

/**
 * @typedef {Object} PreviewSection
 * @property {string} screenId
 * @property {string} title
 * @property {{ label: string, value: string|null, wide?: boolean, images?: string[], imageShape?: 'square'|'wide', caption?: string }[]} rows
 *   `images` = thumbnails shown under the label (logo, cover, album photos), `caption` = a line under them
 * @property {boolean} [compact]   one big value
 * @property {'documents'} [kind]
 * @property {string} [note]
 * @property {boolean} [skipped]   the screen's status is SKIPPED
 */

/**
 * @typedef {Object} PreviewData
 * @property {import('../types').OnboardingStatus} status
 * @property {object|null} brand          GET /brands/get
 * @property {object|null} documents      GET /brands/onboarding/documents
 * @property {object[]|null} [outlets]    GET /subBrands/get-all
 * @property {object[]|null} [features]   GET /brandFeatures/get-all
 * @property {object[]|null} [showcase]   albums with photo URLs (getShowcaseAlbumsWithPhotos)
 */

const formatDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// Only the last 4 digits are ever shown (the server sends them separately).
const maskAccount = (bank) => {
  const last4 = bank?.accountLast4Digits || bank?.maskedAccountNumber?.slice(-4);
  return last4 ? `XXXX XXXX ${last4}` : null;
};

const OWNER_METHOD_LABELS = { PAN: "Owner PAN verified", ID_DOCUMENT: "Owner ID document uploaded" };

const SKIPPED_NOTE = "Skipped — you can add this later.";

const OUTLET_STATE_LABELS = { VERIFIED: "Verified", NEVER_VERIFIED: "Waiting for the manager's code", REVERIFY: "Manager must verify again" };

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** One line per outlet: type + id, verification, and what it still needs. */
function outletRow(outlet, index) {
  const missing = [!outlet.locationId && "location", !outlet.workHoursId && "work hours"].filter(Boolean);
  const address = outlet.location?.formattedAddress;
  return {
    label: `${outlet.outletType === "FRANCHISE" ? "Franchise" : "Outlet"} ${index + 1}${outlet.uniqueId ? ` · ${outlet.uniqueId}` : ""}`,
    value: [OUTLET_STATE_LABELS[outlet.verificationState] ?? null, missing.length ? `needs ${missing.join(" and ")}` : address].filter(Boolean).join(" · "),
    wide: true,
  };
}

/**
 * @param {string} screen
 * @param {PreviewData} data
 * @returns {Omit<PreviewSection, 'screenId'|'title'>}
 */
function sectionBody(screen, { status, brand, documents, outlets = null, features = null, showcase = null }) {
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
          { label: "Account", value: maskAccount(b.bank) },
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
    case SCREENS.BRAND_BASIC_DETAILS:
      return {
        rows: [
          { label: "Logo", value: b.logo ? "Logo" : null, images: b.logo ? [b.logo] : undefined, imageShape: "square" },
          { label: "Cover image", value: b.coverImage ? "Cover image" : null, images: b.coverImage ? [b.coverImage] : undefined, imageShape: "wide" },
          { label: "Email", value: b.email ?? null },
          { label: "Contact number", value: b.mobile ?? null },
          { label: "Description", value: b.description ?? null, wide: true },
        ],
      };
    case SCREENS.BRAND_PROFESSIONAL_DETAILS: {
      const featureRow = { label: "Listing features", value: features ? (features.length ? features.map((f) => f.title).join(", ") : "None yet") : null, wide: true };
      // Each album with its photos once loaded; otherwise just the count.
      const albumRows = showcase
        ? showcase.length
          ? showcase.map((album) => {
              const counts = [plural(album.photoCount, "photo"), album.videoCount ? plural(album.videoCount, "video") : null].filter(Boolean).join(" · ");
              return {
                label: `Showcase · ${album.title}`,
                value: counts,
                caption: counts,
                images: album.photos.length ? album.photos : album.coverImage ? [album.coverImage] : undefined,
                imageShape: "square",
                wide: true,
              };
            })
          : [{ label: "Showcase albums", value: "None yet" }]
        : [{ label: "Showcase albums", value: b.showcaseUsed != null ? plural(b.showcaseUsed, "album") : null }];
      return { rows: [featureRow, ...albumRows] };
    }
    case SCREENS.OUTLET_DETAILS:
      return { rows: (outlets ?? []).map(outletRow) };
    default:
      return { rows: [] };
  }
}

/** Rows that actually have a value — empty fields aren't shown as "—". */
export const filledRows = (section) => section.rows.filter((row) => row.value || row.images?.length);

/** Sections with several fields (GST, PAN, bank…) take a full row of the grid. */
export function isWideSection(section) {
  if (section.compact || section.kind === "documents") return false;
  const rows = filledRows(section);
  return rows.length > 3 || rows.some((row) => row.wide);
}

/**
 * Preview sections of one sidebar group, in the server's screen order.
 * @param {string} groupKey
 * @param {PreviewData} data
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
