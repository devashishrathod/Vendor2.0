import { BadgeCheck, Building2, IdCard, Landmark, Receipt } from "lucide-react";

const BILLING_FIELDS = [
  { key: "legalBusinessName", label: "Legal business name", icon: Landmark },
  { key: "gstin", label: "GSTIN", icon: Receipt },
  { key: "pan", label: "PAN", icon: IdCard },
];

// Columns for however many values came back: the legal name gets the most
// room when it's shown alongside GSTIN / PAN.
const GRID_BY_COUNT = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]",
};

const clean = (value) => (typeof value === "string" ? value.trim() : value) || null;

/**
 * Billing Details — the verified identity printed on invoices (legal name,
 * GSTIN, PAN). Read-only: these come from KYC, not from this page. Only
 * values that actually came back are shown; with none, the card is hidden.
 * @param {{ details: { legalBusinessName?: string, brandName?: string, gstin?: string, pan?: string }|null }} props
 */
export default function BillingDetailsCard({ details }) {
  const values = {
    legalBusinessName: clean(details?.legalBusinessName) || clean(details?.brandName),
    gstin: clean(details?.gstin),
    pan: clean(details?.pan),
  };
  const fields = BILLING_FIELDS.filter((f) => values[f.key]);
  if (fields.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200/70 dark:bg-gray-800 dark:ring-gray-700">
      <header className="flex items-center gap-2.5 px-4 pb-1 pt-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Building2 size={14} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Billing Details</h3>
          <p className="truncate text-[11.5px] text-gray-500 dark:text-gray-400">From your verified business KYC · changed only through support</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <BadgeCheck size={12} aria-hidden="true" />
          Verified
        </span>
      </header>

      <dl className={`grid grid-cols-1 gap-2.5 p-3 ${GRID_BY_COUNT[fields.length]}`}>
        {fields.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="flex min-w-0 items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-3 dark:bg-gray-900/40"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 shadow-[0_1px_2px_rgba(16,24,40,0.06)] dark:bg-gray-800 dark:text-emerald-400">
              <Icon size={15} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</dt>
              <dd
                className={`text-[13px] font-bold leading-snug text-gray-900 dark:text-gray-100 ${
                  key === "legalBusinessName" ? "break-words" : "truncate font-mono tracking-wider"
                }`}
                title={values[key]}
              >
                {values[key]}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
