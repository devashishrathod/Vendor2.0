// `profileStrength.level` from the server (guide §11): LOW < 50 · MEDIUM 50–74 ·
// STRONG ≥ 75. The panel never computes the score — it only colours it.
export const STRENGTH_LEVELS = Object.freeze({
  LOW: { bar: "bg-amber-400", text: "text-amber-700 dark:text-amber-400", label: "Low" },
  MEDIUM: { bar: "bg-sky-500", text: "text-sky-700 dark:text-sky-400", label: "Medium" },
  STRONG: { bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", label: "Strong" },
});

// `badgeBlockers` codes → what the vendor still needs for the Verified badge.
export const BADGE_BLOCKER_LABELS = Object.freeze({
  NOT_APPROVED: "Approval from our team",
  STRENGTH_BELOW_75: "Profile strength of 75 or more",
  BANK_NOT_VERIFIED: "A verified bank account",
  NO_IDENTITY_PROOF: "A verified PAN, or an owner ID our team has accepted",
});

/**
 * Items still worth doing: not done, possible for this brand
 * (`available: false` is never shown), most points first.
 * @param {import('../../types').ProfileStrength|null|undefined} strength
 * @returns {{ key: string, label: string, points: number, action: string|null, section: string }[]}
 */
export function openStrengthItems(strength) {
  return (strength?.sections ?? [])
    .flatMap((section) => (section.items ?? []).map((item) => ({ ...item, section: section.key })))
    .filter((item) => item.available !== false && !item.done && item.points > 0)
    .sort((a, b) => b.points - a.points);
}
