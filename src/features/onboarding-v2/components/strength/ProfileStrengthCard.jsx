import { BadgeCheck, ChevronRight, ShieldCheck } from "lucide-react";
import { BADGE_BLOCKER_LABELS, STRENGTH_LEVELS, openStrengthItems } from "./strengthLevels";

/**
 * Profile strength (guide §11), straight from the server's `profileStrength`
 * (GET /brands/onboarding/status or GET /brands/profile-strength): score,
 * level, the "+N" items still worth doing (never the `available: false`
 * ones) and the Verified badge state from `isVerified` + `badgeBlockers`.
 * The panel computes nothing — no local formula.
 * @param {{
 *   strength: import('../../types').ProfileStrength|null|undefined,
 *   isVerified?: boolean,
 *   title?: string,
 *   maxItems?: number,                         - show at most this many "+N" items
 *   onSelectItem?: (key: string) => void,      - "Add" on an item the caller can open
 *   selectableKeys?: string[],                 - which item keys get the "Add" button
 *   showBadge?: boolean,
 * }} props
 */
export default function ProfileStrengthCard({
  strength,
  isVerified = false,
  title = "Profile strength",
  maxItems,
  onSelectItem,
  selectableKeys = [],
  showBadge = true,
}) {
  if (!strength) return null;

  const level = STRENGTH_LEVELS[strength.level] ?? { bar: "bg-gray-400", text: "text-gray-600", label: strength.level };
  const items = openStrengthItems(strength);
  const shown = maxItems ? items.slice(0, maxItems) : items;
  const blockers = (strength.badgeBlockers ?? []).map((code) => BADGE_BLOCKER_LABELS[code] ?? code);

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-gray-200 sm:p-5 dark:bg-gray-900 dark:ring-gray-800" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-sm font-bold">
          <span className="text-gray-900 dark:text-gray-100">{strength.score}</span>
          <span className="text-gray-400"> / 100 · </span>
          <span className={level.text}>{level.label}</span>
        </p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
        role="progressbar"
        aria-valuenow={strength.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title}
      >
        <div className={`h-full rounded-full transition-[width] duration-500 ${level.bar}`} style={{ width: `${strength.score}%` }} />
      </div>

      {shown.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {shown.map((item) => {
            const canOpen = onSelectItem && selectableKeys.includes(item.key);
            const body = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-gray-900 dark:text-gray-100">{item.label}</span>
                  {item.action && <span className="block text-xs text-gray-500 dark:text-gray-400">{item.action}</span>}
                </span>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
                  +{item.points}
                </span>
                {canOpen && <ChevronRight size={16} className="shrink-0 text-gray-400" aria-hidden="true" />}
              </>
            );
            return (
              <li key={item.key}>
                {canOpen ? (
                  <button
                    type="button"
                    onClick={() => onSelectItem(item.key)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-gray-50 px-3 py-2 text-left ring-1 ring-inset ring-gray-200 transition hover:bg-emerald-50 hover:ring-emerald-200 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:bg-gray-800/50 dark:ring-gray-700 dark:hover:bg-emerald-500/10"
                  >
                    {body}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
          {maxItems && items.length > maxItems && (
            <li className="text-xs text-gray-500 dark:text-gray-400">+ {items.length - maxItems} more ways to strengthen your profile</li>
          )}
        </ul>
      ) : (
        <p className="mt-3 text-xs font-medium text-gray-600 dark:text-gray-400">Your profile has everything it can have right now.</p>
      )}

      {showBadge && (
        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
          {isVerified ? (
            <p className="flex items-center gap-2 text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
              <BadgeCheck size={16} aria-hidden="true" />
              Your brand has the Verified badge.
            </p>
          ) : strength.badgeEligible ? (
            <p className="flex items-start gap-2 text-[13px] text-gray-700 dark:text-gray-300">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
              You meet every condition for the Verified badge. Our team adds it after a check.
            </p>
          ) : (
            <div className="text-[13px] text-gray-700 dark:text-gray-300">
              <p className="flex items-center gap-2 font-bold">
                <ShieldCheck size={16} className="shrink-0 text-gray-400" aria-hidden="true" />
                For the Verified badge you still need:
              </p>
              <ul className="ml-6 mt-1 list-disc text-xs text-gray-600 dark:text-gray-400">
                {blockers.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
