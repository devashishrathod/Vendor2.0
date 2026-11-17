import { SCREENS } from "../config/onboardingFlow";

// Profile strength (out of 100). Onboarding itself is worth 45 points;
// the other 55 come from optional items that show as dashboard to-dos.

export const STRENGTH_LEVELS = [
  { min: 90, label: "Excellent" },
  { min: 75, label: "Good" },
  { min: 50, label: "Medium" },
  { min: 0, label: "Low" },
];

/** @param {number} score */
export const strengthLevel = (score) => STRENGTH_LEVELS.find((l) => score >= l.min).label;

const DESCRIPTION_MIN = 50;

const hasDocument = (documents, keyword) =>
  documents.some((d) => d.status === "uploaded" && d.title.toLowerCase().includes(keyword));

/**
 * @typedef {Object} StrengthItem
 * @property {string} id
 * @property {string} title
 * @property {string} note
 * @property {number} points
 * @property {boolean} done
 * @property {'core'|'block'|'opt'} kind - core = part of onboarding, block = needed to go live
 * @property {string} [badge]
 * @property {string} [cta]
 */

/**
 * Every item that counts towards profile strength, with whether it's done.
 * @param {{ form: object, completed: string[] }} state
 * @returns {StrengthItem[]}
 */
export function getStrengthItems({ form, completed }) {
  const docs = form.documents || [];
  const outlet = form.outlet || {};
  const identityDone = Boolean(form.gstDetails || form.panDetails || form.ownerKyc?.panDetails);

  return [
    { id: "basics", title: "Brand and category", note: "", points: 10, kind: "core",
      done: Boolean(form.brandName && form.categoryId && form.subCategories?.length) },
    { id: "identity", title: "Identity", note: "", points: 15, kind: "core", done: identityDone },
    { id: "kyc", title: "Owner PAN / KYC", note: "", points: 10, kind: "core", done: completed.includes(SCREENS.OWNER_KYC) || completed.includes(SCREENS.OWNER_PAN_REVIEW) },
    { id: "contract", title: "Contract and plan", note: "", points: 5, kind: "core",
      done: Boolean(form.contractAcceptedAt && form.payment) },
    { id: "outlet", title: "Outlet location and hours", note: "", points: 5, kind: "core",
      done: Boolean(outlet.locationSaved && outlet.hoursSaved) },

    { id: "bank", title: "Add bank account", note: "Needed to sell vouchers and get payouts", points: 15,
      kind: "block", badge: "Blocks selling", cta: "Add bank", done: Boolean(form.bankDetails) },
    { id: "licence", title: "Upload required licence", note: "Required for your category before you go live",
      points: 10, kind: "block", badge: "Required", cta: "Upload", done: hasDocument(docs, "licen") },
    { id: "shopProof", title: "Shop or address proof", note: "Electricity bill, rent agreement or Shop Act",
      points: 5, kind: "opt", badge: "Optional", cta: "Upload",
      done: ["shop", "electricity", "rent"].some((k) => hasDocument(docs, k)) },
    { id: "logo", title: "Add logo", note: "Square, at least 500 × 500", points: 5, kind: "opt",
      badge: "Optional", cta: "Upload", done: Boolean(outlet.logoUrl) },
    { id: "cover", title: "Add cover image", note: "Shown at the top of your outlet page", points: 5, kind: "opt",
      badge: "Optional", cta: "Upload", done: Boolean(outlet.coverUrl) },
    { id: "description", title: "Write a description", note: `${DESCRIPTION_MIN}+ characters about your brand`,
      points: 5, kind: "opt", badge: "Optional", cta: "Write",
      done: (outlet.description || "").trim().length >= DESCRIPTION_MIN },
    { id: "photos", title: "Add 3 outlet photos", note: "Front, inside and products", points: 5, kind: "opt",
      badge: "Optional", cta: "Upload", done: (outlet.photoCount || 0) >= 3 },
    { id: "showcase", title: "Add a showcase item", note: "At least one offer or product", points: 5, kind: "opt",
      badge: "Optional", cta: "Add", done: (outlet.showcaseCount || 0) > 0 },
  ];
}

/**
 * @param {{ form: object, completed: string[] }} state
 * @returns {{ score: number, level: string, items: StrengthItem[] }}
 */
export function getProfileStrength(state) {
  const items = getStrengthItems(state);
  const score = items.reduce((sum, item) => sum + (item.done ? item.points : 0), 0);
  return { score, level: strengthLevel(score), items };
}
