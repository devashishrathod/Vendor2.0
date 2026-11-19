import ScoreBar from "./ScoreBar";
import { LOW_SCORE_COPY, RESULT_BANNER, RUNNING_BANNER } from "./verificationTheme";

const MAX_REMARKS = 3;
// Score / progress panel width beside the title on wide screens.
const SIDE_PANEL = "lg:w-[360px] lg:shrink-0";

/** Title + text for the phase; a low-score rejection gets its own wording. */
function bannerCopy(phase, { hasIssues, error }) {
  if (phase === "error") return { title: RESULT_BANNER.error.title, text: error || RESULT_BANNER.error.text };
  if (phase === "failed" && !hasIssues) return LOW_SCORE_COPY;
  return RESULT_BANNER[phase];
}

/** Progress while the checks run, with a moving shimmer. */
function RunningProgress({ done, total, starting }) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className={`rounded-xl bg-gray-50/80 px-3.5 py-3 ring-1 ring-inset ring-gray-100 dark:bg-gray-800/50 dark:ring-gray-700/60 ${SIDE_PANEL}`}>
      <div className="flex justify-between text-[11.5px] font-semibold text-gray-500 dark:text-gray-400" aria-live="polite">
        <span>{starting ? "Starting checks…" : `Checking ${Math.min(done + 1, total)} of ${total}`}</span>
        <span className="tabular-nums text-emerald-700 dark:text-emerald-400">{percent}%</span>
      </div>
      <div
        className="relative mt-2 h-2 overflow-hidden rounded-full bg-gray-200/70 dark:bg-gray-700/70"
        role="progressbar"
        aria-label="Verification progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
        <span
          className="absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent motion-reduce:hidden dark:via-white/20"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/** The backend's own reasons as one wrapping row of chips. */
function Remarks({ remarks, tone }) {
  const Icon = tone.remarkIcon;
  return (
    <div className="flex animate-fade-up flex-wrap items-center gap-1.5 border-t border-gray-100 px-4 py-3 sm:px-5 dark:border-gray-800">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Why</span>
      {remarks.slice(0, MAX_REMARKS).map((remark) => (
        <span
          key={remark}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700"
        >
          <Icon size={13} className={`shrink-0 ${tone.remarkIconClass}`} aria-hidden="true" />
          {remark}
        </span>
      ))}
    </div>
  );
}

/**
 * Top of the page: what's happening (or what came out), the real score from
 * the API and — when it isn't a clean approval — the backend's own remarks.
 * Title on the left, score on the right from lg up; stacked on phones.
 * @param {{
 *   phase: string, isRunning: boolean, done: number, total: number,
 *   hasIssues: boolean, summary: { score: number|null, remarks: string[] }, error: string,
 * }} props
 */
export default function ResultBanner({ phase, isRunning, done, total, hasIssues, summary, error }) {
  const tone = isRunning ? RUNNING_BANNER : RESULT_BANNER[phase];
  const copy = isRunning ? RUNNING_BANNER : bannerCopy(phase, { hasIssues, error });
  const Icon = tone.icon;
  const isResult = !isRunning && phase !== "error";
  const showRemarks = isResult && phase !== "approved" && summary.remarks.length > 0;
  // One key for this phase; each animated child gets its own prefix so
  // siblings never share a key (shared keys left the old icon on screen).
  const phaseKey = isRunning ? "running" : phase;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_16px_32px_-24px_rgba(16,24,40,0.18)] transition-colors duration-500 dark:bg-gray-900 dark:shadow-none ${tone.surface}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.accent}`} aria-hidden="true" />
      <span className={`pointer-events-none absolute -right-16 -top-16 size-44 rounded-full blur-3xl ${tone.glow}`} aria-hidden="true" />

      <div className="relative flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <span
            key={`icon-${phaseKey}`}
            className={`relative grid size-11 shrink-0 place-items-center ${tone.iconBox} ${isRunning ? "rounded-full" : "animate-check-pop rounded-xl"}`}
          >
            {isRunning && (
              <span className="absolute -inset-1 animate-spin rounded-full border-2 border-transparent border-t-emerald-500 border-r-emerald-500/40" aria-hidden="true" />
            )}
            <Icon size={21} strokeWidth={2} aria-hidden="true" />
          </span>

          <div key={`text-${phaseKey}`} className="min-w-0 flex-1 animate-fade-up">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-gray-50" aria-live="polite">
                {copy.title}
              </h1>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ring-inset ${tone.pill}`}>
                {tone.eyebrow}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">{copy.text}</p>
          </div>
        </div>

        {isRunning && <RunningProgress done={done} total={total} starting={phase === "loading"} />}
        {isResult && summary.score !== null && (
          <ScoreBar score={summary.score} barClass={tone.bar} scoreClass={tone.scoreText} className={SIDE_PANEL} />
        )}
      </div>

      {showRemarks && <Remarks remarks={summary.remarks} tone={tone} />}
    </section>
  );
}
