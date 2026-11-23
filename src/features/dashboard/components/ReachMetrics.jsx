import { Eye, MessageCircle, MousePointerClick, Navigation, Target, TrendingUp, Users } from "lucide-react";
import AnimatedNumber from "@/components/common/AnimatedNumber";

// Row 1 — how often the brand is seen; row 2 — what customers do next.
const METRICS = Object.freeze([
  { key: "impressions", label: "Impression", icon: Eye },
  { key: "reached", label: "Reached", icon: Users },
  { key: "views", label: "View", icon: MousePointerClick },
  { key: "conversions", label: "Conversion", icon: Target },
  { key: "directions", label: "Direction", icon: Navigation },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
]);

const compactNumber = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

const hasValue = (value) => value !== null && value !== undefined && Number.isFinite(Number(value));

/**
 * 50000 → "50K", 50120 → "50.1K", 5 → "05".
 * @param {number} value
 * @returns {string}
 */
function formatMetric(value) {
  const n = Math.max(0, Math.round(Number(value)));
  return n < 10 ? String(n).padStart(2, "0") : compactNumber.format(n);
}

/**
 * Reach & engagement tiles on the dashboard: Impression, Reached, View,
 * Conversion, Direction, WhatsApp. Numbers count up to each new value; a
 * metric that grew shows a rising "+N" for that tick. A missing value is
 * "—", never a made-up 0.
 * @param {{
 *   values?: Partial<Record<'impressions'|'reached'|'views'|'conversions'|'directions'|'whatsapp', number>>,
 *   deltas?: Record<string, number>,  - what each metric gained on the latest update
 *   tick?: number,                    - changes on every update, replays the "+N"
 *   sample?: boolean,                 - the values are placeholders, not real data: shows a "Sample data" tag
 * }} props
 */
export default function ReachMetrics({ values = {}, deltas = {}, tick = 0, sample = false }) {
  return (
    <section className="bento-card p-5" aria-labelledby="reach-metrics-title">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <TrendingUp size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p id="reach-metrics-title" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Reach &amp; Engagement
          </p>
          <p className="text-[11px] text-gray-400">How customers find and contact your brand</p>
        </div>
        {sample && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-700 dark:text-gray-300">
            Sample data
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {METRICS.map(({ key, label, icon: Icon }) => {
          const known = hasValue(values[key]);
          const gained = deltas[key] > 0 ? deltas[key] : 0;
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-50/80 px-3 py-3 ring-1 ring-inset ring-emerald-100 transition-colors hover:bg-emerald-50 sm:px-4 sm:py-3.5 dark:bg-emerald-500/10 dark:ring-emerald-500/20"
              title={known ? undefined : "Not available yet"}
            >
              <dt className="flex min-w-0 items-center gap-2.5">
                <span className="hidden size-8 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm sm:grid dark:bg-gray-900/60 dark:text-emerald-400">
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className="truncate text-[13px] font-semibold text-gray-700 dark:text-gray-300">{label}</span>
              </dt>
              <dd className={`relative shrink-0 text-lg font-extrabold tabular-nums ${known ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}>
                {known ? <AnimatedNumber value={values[key]} format={formatMetric} /> : "—"}
                {gained > 0 && (
                  <span
                    key={tick}
                    className="animate-delta-float pointer-events-none absolute bottom-full right-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  >
                    +{formatMetric(gained)}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
