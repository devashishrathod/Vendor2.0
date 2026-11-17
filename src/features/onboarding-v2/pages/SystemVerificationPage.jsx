import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleAlert,
  CircleMinus,
  Clock,
  Hourglass,
  LoaderCircle,
  RotateCw,
  Rocket,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggleButton from "@/components/common/ThemeToggleButton";
import { BRANCHES } from "../config/onboardingFlow";
import { ONBOARDING_ROUTES } from "../config/routes";
import { runSystemVerification } from "../services/onboardingApi";
import { useOnboardingV2Store } from "../store/onboardingStore";

// Result of GET /brands/onboarding/system-verify, cached so a refresh shows
// the same result instead of running the check again.
const CACHE_KEY = "v2-system-verify-result";
const readCache = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
  } catch {
    return null;
  }
};
const writeCache = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* storage full / blocked — the page still works without the cache */
  }
};
const clearCache = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The checks to show, from the API flags. Things the vendor's path doesn't
 * need (GST on a no-GST path) are "na"; things they skipped (bank) are
 * "skipped" — neither is shown as a failure.
 * @returns {{ key: string, label: string, status: "pass"|"warn"|"fail"|"skipped"|"na", detail: string }[]}
 */
function buildChecks(flags = {}, remarks = [], { branch, bankSkipped }) {
  const remark = (word) => remarks.find((r) => String(r).toLowerCase().includes(word)) || null;
  const hasGst = branch === BRANCHES.GST;
  const duplicate = flags.duplicatePAN || flags.duplicateGST || flags.duplicateBank || flags.duplicateWhatsapp;

  return [
    {
      key: "pan",
      label: "PAN verified",
      status: flags.panVerified ? "pass" : "fail",
      detail: flags.panVerified ? "Your PAN is valid and verified." : remark("pan") || "We couldn't verify your PAN.",
    },
    hasGst
      ? {
          key: "gst",
          label: "GST verified & active",
          status: !flags.gstVerified ? "fail" : !flags.gstActive ? "warn" : "pass",
          detail: !flags.gstVerified ? "GST couldn't be verified." : !flags.gstActive ? "Your GST registration isn't active." : "GSTIN is verified and active.",
        }
      : { key: "gst", label: "GST verified & active", status: "na", detail: "Not needed — you're registered without GST." },
    hasGst
      ? {
          key: "panGst",
          label: "PAN ↔ GST ↔ legal name match",
          status: flags.panMatchedWithGST ? "pass" : "warn",
          detail: flags.panMatchedWithGST ? "Names on PAN and GST match." : remark("name") || remark("pan") || "Names on PAN and GST don't fully match.",
        }
      : { key: "panGst", label: "PAN ↔ GST ↔ legal name match", status: "na", detail: "Not needed without GST." },
    bankSkipped
      ? { key: "bank", label: "Bank account matches business", status: "skipped", detail: "You skipped bank details — add them to receive payouts." }
      : {
          key: "bank",
          label: "Bank account matches business",
          status: !flags.bankVerified ? "fail" : !flags.bankMatched ? "warn" : "pass",
          detail: !flags.bankVerified
            ? "Bank account couldn't be verified."
            : !flags.bankMatched
              ? remark("bank") || "Account holder name doesn't match your business."
              : "Account holder matches your business.",
        },
    {
      key: "entity",
      label: "Business entity matches",
      status: flags.businessEntityMatched ? "pass" : "warn",
      detail: flags.businessEntityMatched ? "Business entity matches your registration." : "Business entity looks different from your registration.",
    },
    {
      key: "duplicate",
      label: "No duplicate accounts",
      status: duplicate ? "warn" : "pass",
      detail: duplicate ? remark("duplicate") || "These details are already used by another account." : "No other account uses these details.",
    },
  ];
}

const STATUS_STYLE = {
  pass: { icon: Check, iconBox: "bg-emerald-500 text-white", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30", text: "Passed" },
  warn: { icon: TriangleAlert, iconBox: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", badge: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30", text: "Needs review" },
  fail: { icon: X, iconBox: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300", badge: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30", text: "Failed" },
  skipped: { icon: CircleMinus, iconBox: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300", badge: "bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600", text: "Skipped" },
  na: { icon: CircleMinus, iconBox: "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400", badge: "bg-gray-50 text-gray-500 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700", text: "Not needed" },
};

function CheckRow({ check, state }) {
  // state: "pending" (not reached), "running" (spinner), "done" (shows result)
  const style = STATUS_STYLE[check.status];
  const Icon = style.icon;
  return (
    <li className={`flex items-start gap-3 px-4 py-3.5 transition-opacity duration-300 sm:px-5 ${state === "pending" ? "opacity-45" : "opacity-100"}`}>
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full transition-colors ${
          state === "done" ? style.iconBox : state === "running" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600"
        }`}
        aria-hidden="true"
      >
        {state === "done" ? <Icon size={15} strokeWidth={3} /> : state === "running" ? <LoaderCircle size={15} className="animate-spin" /> : <span className="size-2 rounded-full bg-current" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-gray-900 dark:text-gray-100">{check.label}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-gray-500 dark:text-gray-400">
          {state === "done" ? check.detail : state === "running" ? "Checking…" : "Waiting"}
        </p>
      </div>
      {state === "done" && (
        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ring-inset ${style.badge}`}>{style.text}</span>
      )}
    </li>
  );
}

const OUTCOME = {
  approved: {
    icon: BadgeCheck,
    ring: "bg-emerald-50 text-emerald-600 ring-emerald-200 shadow-[0_0_0_10px_rgba(16,185,129,0.08)] dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
    title: "You're verified!",
    text: "Every automatic check passed. Our team will do a final look and your outlet goes live shortly.",
  },
  review: {
    icon: Users,
    ring: "bg-amber-50 text-amber-600 ring-amber-200 shadow-[0_0_0_10px_rgba(245,158,11,0.08)] dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
    title: "Sent to our team for a quick review",
    text: "Most checks passed. A few need a human look — usually done within 24–48 hours. No action needed right now.",
  },
  failed: {
    icon: ShieldX,
    ring: "bg-red-50 text-red-600 ring-red-200 shadow-[0_0_0_10px_rgba(239,68,68,0.08)] dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
    title: "A few things need fixing",
    text: "Some details didn't pass. You can continue — fix them from your status page and re-submit, or our team will reach out.",
  },
};

const NEXT_STEPS = [
  { icon: ShieldCheck, title: "System verification", text: "Automatic checks on PAN, GST and bank" },
  { icon: Users, title: "Team review", text: "Usually within 24–48 hours" },
  { icon: Rocket, title: "Go live", text: "Your outlet appears to customers" },
];

/**
 * Last onboarding page, after "Review all details" is submitted: runs the
 * backend system verification, ticks the checks one by one, then shows the
 * outcome and continues to the Under review page.
 */
export default function SystemVerificationPage() {
  const navigate = useNavigate();
  const branch = useOnboardingV2Store((s) => s.branch);
  const bankSkipped = useOnboardingV2Store((s) => !s.form.bankDetails);

  const [phase, setPhase] = useState("running"); // running | approved | review | failed | error
  const [checks, setChecks] = useState([]);
  const [revealed, setRevealed] = useState(-1); // index of the check being shown
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  const outcomeOf = (status, built) => {
    if (status === "APPROVED") return "approved";
    if (status === "REVIEW" || status === "MANUAL_REVIEW") return "review";
    // No explicit status: decide from the checks themselves.
    if (!status) return built.some((c) => c.status === "fail") ? "failed" : built.some((c) => c.status === "warn") ? "review" : "approved";
    return "failed";
  };

  const run = useCallback(
    async ({ fresh = false } = {}) => {
      setError("");
      setPhase("running");
      setRevealed(-1);
      const options = { branch, bankSkipped };

      const cached = fresh ? null : readCache();
      if (cached) {
        const built = buildChecks(cached.flags, cached.remarks, options);
        setChecks(built);
        setRevealed(built.length);
        setPhase(outcomeOf(cached.status, built));
        return;
      }

      // Show the list right away so the vendor sees what's being checked.
      setChecks(buildChecks({}, [], options).map((c) => ({ ...c })));
      setRevealed(0); // first check spins while the API runs
      try {
        const [data] = await Promise.all([runSystemVerification(), sleep(600)]);
        const result = data?.data ?? data ?? {};
        writeCache(result);
        const built = buildChecks(result.flags, result.remarks, options);
        setChecks(built);
        for (let i = 0; i < built.length; i += 1) {
          setRevealed(i);
          await sleep(550);
        }
        setRevealed(built.length);
        setPhase(outcomeOf(result.status, built));
      } catch (err) {
        console.error("System verification failed:", err);
        setError(err?.message || "We couldn't run verification right now.");
        setPhase("error");
      }
    },
    [bankSkipped, branch],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
  }, [run]);

  const retry = () => {
    clearCache();
    run({ fresh: true });
  };

  const total = checks.length || 6;
  const doneCount = Math.max(0, Math.min(revealed, total));
  const percent = phase === "running" ? Math.round((doneCount / total) * 100) : 100;
  const outcome = OUTCOME[phase];
  const OutcomeIcon = outcome?.icon;
  const counts = checks.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {});

  return (
    <div className="min-h-dvh bg-app font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8 dark:border-gray-800 dark:bg-gray-900/95">
        <span className="flex items-center gap-2.5">
          <span className="grid size-[34px] place-items-center rounded-[10px] bg-emerald-600 text-[17px] font-extrabold text-white">T</span>
          <span>
            <span className="block text-[16px] font-extrabold leading-tight tracking-tight">Trydood</span>
            <span className="block text-[11px] font-medium text-gray-500">Vendor Panel</span>
          </span>
        </span>
        <ThemeToggleButton className="size-10! ring-1 ring-inset ring-gray-200 dark:ring-gray-600" />
      </header>

      <main className="mx-auto w-full max-w-[1040px] px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Main card */}
          <section className="min-w-0 flex-1 overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.10)] dark:border-gray-800 dark:bg-gray-900">
            {/* Hero */}
            <div className="flex flex-col items-center px-5 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
              {phase === "running" ? (
                <span className="relative grid size-20 place-items-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" aria-hidden="true" />
                  <span className="relative grid size-20 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
                    <ShieldCheck size={36} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                </span>
              ) : phase === "error" ? (
                <span className="grid size-20 place-items-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30">
                  <CircleAlert size={36} strokeWidth={1.8} aria-hidden="true" />
                </span>
              ) : (
                <span className={`grid size-20 animate-fade-in place-items-center rounded-full ring-1 ${outcome.ring}`}>
                  <OutcomeIcon size={36} strokeWidth={1.8} aria-hidden="true" />
                </span>
              )}

              <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-[26px] dark:text-gray-50" aria-live="polite">
                {phase === "running" ? "Verifying your business…" : phase === "error" ? "Couldn't run verification" : outcome.title}
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {phase === "running"
                  ? "We're matching your PAN, GST and bank details. This takes a few seconds — please don't close this page."
                  : phase === "error"
                    ? error
                    : outcome.text}
              </p>

              {/* Progress */}
              <div className="mt-6 w-full max-w-sm">
                <div className="flex justify-between text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                  <span>{phase === "running" ? `Check ${Math.min(doneCount + 1, total)} of ${total}` : `${total} checks complete`}</span>
                  <span className="text-emerald-700 dark:text-emerald-400">{percent}%</span>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Verification progress"
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${phase === "failed" || phase === "error" ? "bg-red-500" : phase === "review" ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {phase !== "running" && phase !== "error" && (
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {["pass", "warn", "fail", "skipped"].map(
                    (key) =>
                      counts[key] > 0 && (
                        <span key={key} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${STATUS_STYLE[key].badge}`}>
                          {counts[key]} {STATUS_STYLE[key].text.toLowerCase()}
                        </span>
                      ),
                  )}
                </div>
              )}
            </div>

            {/* Checks */}
            {checks.length > 0 && (
              <ul className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                {checks.map((check, i) => (
                  <CheckRow key={check.key} check={check} state={i < revealed || revealed >= checks.length ? "done" : i === revealed ? "running" : "pending"} />
                ))}
              </ul>
            )}

            {/* Actions */}
            {phase !== "running" && (
              <footer className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-[#FCFDFC] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:border-gray-800 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-800"
                >
                  <RotateCw size={15} aria-hidden="true" />
                  Run checks again
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ONBOARDING_ROUTES.STATUS, { replace: true })}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  {phase === "failed" ? "Continue & fix later" : phase === "error" ? "Skip for now" : "Continue"}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </footer>
            )}
          </section>

          {/* Side: what happens next */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:w-[300px] lg:shrink-0">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">What happens next</p>
              <ol className="mt-4 flex flex-col">
                {NEXT_STEPS.map(({ icon: Icon, title, text }, i) => {
                  const active = i === 0 ? phase === "running" : i === 1 ? phase !== "running" : false;
                  const done = i === 0 && phase !== "running" && phase !== "error";
                  return (
                    <li key={title} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-full ${
                            done
                              ? "bg-emerald-500 text-white"
                              : active
                                ? "bg-white text-emerald-700 ring-2 ring-emerald-500 dark:bg-gray-900 dark:text-emerald-400"
                                : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                          }`}
                          aria-hidden="true"
                        >
                          {done ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                        </span>
                        {i < NEXT_STEPS.length - 1 && (
                          <span className={`my-1 min-h-6 w-0.5 flex-1 rounded-full ${done ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`} aria-hidden="true" />
                        )}
                      </div>
                      <div className="pb-4 pt-1">
                        <p className={`text-[13px] font-bold ${active || done ? "text-gray-900 dark:text-gray-100" : "text-gray-500"}`}>{title}</p>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">{text}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl bg-sky-50 p-4 text-[12px] leading-relaxed text-sky-900 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30">
              {phase === "running" ? <Hourglass size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> : <Clock size={15} className="mt-0.5 shrink-0" aria-hidden="true" />}
              <span>
                Your outlet is saved and submitted. You can track its status any time from the Under review page.
              </span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
