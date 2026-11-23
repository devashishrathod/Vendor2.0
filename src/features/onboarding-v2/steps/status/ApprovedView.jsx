import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, BarChart3, LoaderCircle, MessageSquareText, Store, Ticket } from "lucide-react";
import FormError from "../../components/ui/FormError";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { acknowledgeBrandApproval, getVerificationHistory } from "../../services/onboardingApi";
import { useSavedBrand } from "../../store/brandStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";

// What the dashboard opens up — information only; the dashboard is reached
// through the button (acknowledging the approval first).
const NEXT_STEPS = Object.freeze([
  { icon: Ticket, title: "Create vouchers", text: "Publish offers customers can claim" },
  { icon: Store, title: "Manage outlets", text: "Hours, photos and details" },
  { icon: BarChart3, title: "Track your growth", text: "Sales, redemptions and settlements" },
]);

// The confetti falls on the coloured panel, so no accent-green pieces.
const CONFETTI_COLORS = ["bg-white", "bg-amber-300", "bg-sky-300", "bg-pink-300", "bg-violet-300", "bg-yellow-200"];

// Fixed pseudo-random layout (same on every render): position, size, timing,
// sideways drift and spin for each piece.
const CONFETTI = Array.from({ length: 32 }, (_, i) => {
  const rand = (n) => {
    const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: rand(1) * 100,
    width: 5 + rand(2) * 4,
    height: 7 + rand(3) * 7,
    delay: rand(4) * 0.9,
    duration: 2.2 + rand(5) * 1.4,
    drift: (rand(6) - 0.5) * 140,
    spin: 360 + rand(7) * 540,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    round: i % 5 === 0,
  };
});

const formatDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "T";

/**
 * Staggered entrance — pair with the `animate-fade-up` class. An inline
 * delay, since Tailwind only generates class names written out in full.
 * @param {number} ms
 */
const delay = (ms) => ({ animationDelay: `${ms}ms` });

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {CONFETTI.map((piece, i) => (
        <span
          key={i}
          className={`absolute -top-4 animate-confetti ${piece.color} ${piece.round ? "rounded-full" : "rounded-[2px]"}`}
          style={{
            left: `${piece.left}%`,
            width: piece.width,
            height: piece.round ? piece.width : piece.height,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            "--confetti-drift": `${piece.drift}px`,
            "--confetti-spin": `${piece.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

/** White round badge on the coloured panel: rings ripple out, the check draws itself. */
function SuccessBadge() {
  return (
    <div className="relative grid size-16 place-items-center" aria-hidden="true">
      <span className="absolute inset-0 rounded-full bg-white/35 animate-ripple" />
      <span className="absolute inset-0 rounded-full bg-white/25 animate-ripple [animation-delay:1.3s]" />
      <span className="relative grid size-14 place-items-center rounded-full bg-white shadow-lg shadow-emerald-900/20 animate-check-pop">
        <svg viewBox="0 0 24 24" className="size-7 text-emerald-600" fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            strokeDasharray="1"
            className="animate-draw [animation-delay:350ms]"
          />
        </svg>
      </span>
    </div>
  );
}

/**
 * Approved, not yet seen (guide §7.3): congratulations (with our team's
 * note — the newest APPROVED history row's `reason`, and its date), then
 * "Go to my dashboard" → PUT acknowledge-approval → DASHBOARD. Also after a
 * re-approval (the vendor is already on DASHBOARD). 409 = the approval
 * changed meanwhile → the status is read again and the page follows it.
 */
export default function ApprovedView() {
  const { status, goToServerScreen } = useOnboardingFlow();
  const { brand } = useSavedBrand();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [approval, setApproval] = useState(null);

  useEffect(() => {
    getVerificationHistory()
      .then((rows) => setApproval(rows.find((row) => row.action === "APPROVED") ?? null))
      .catch((err) => console.error("Verification history fetch failed:", err));
  }, []);

  const handleContinue = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await acknowledgeBrandApproval();
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      console.error("Acknowledge approval failed:", err);
      setError(onboardingErrorMessage(err, "That didn't work. Please try again."));
      goToServerScreen(null);
    } finally {
      setBusy(false);
    }
  };

  const brandName = brand?.brandName ?? "";
  const note = approval?.reason || "";
  const approvedOn = formatDate(approval?.createdAt);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.10)] sm:rounded-[20px] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* ── Celebration panel ── */}
        <div className="relative isolate flex flex-col justify-center overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-16 -top-16 -z-10 size-56 rounded-full bg-white/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 -z-10 size-48 rounded-full bg-white/10" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
            aria-hidden="true"
          />
          <Confetti />

          <SuccessBadge />
          <span
            className="mt-5 inline-flex animate-fade-up items-center gap-1.5 self-start rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ring-white/25 backdrop-blur-sm"
            style={delay(250)}
          >
            <BadgeCheck size={12} aria-hidden="true" />
            Brand approved
          </span>
          <h1 className="mt-2.5 animate-fade-up text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]" style={delay(350)}>
            Congratulations!
          </h1>
          <p className="mt-2 max-w-sm animate-fade-up text-sm leading-relaxed text-white/85" style={delay(450)}>
            Our team has approved {brandName ? <strong className="font-bold text-white">{brandName}</strong> : "your brand"}. Head to your
            dashboard to create vouchers and manage your outlets.
          </p>
        </div>

        {/* ── Details panel ── */}
        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <div className="flex animate-fade-up items-center gap-3" style={delay(500)}>
            {brand?.logo ? (
              <img src={brand.logo} alt="" className="size-11 shrink-0 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
            ) : (
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-extrabold text-white">
                {initialsOf(brandName)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-gray-900 dark:text-gray-100">{brandName || "Your brand"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{approvedOn ? `Approved on ${approvedOn}` : "Approved"}</p>
            </div>
            {status?.isVerified && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30">
                <BadgeCheck size={12} aria-hidden="true" />
                Verified
              </span>
            )}
          </div>

          {note && (
            <figure
              className="flex animate-fade-up items-start gap-2.5 rounded-xl bg-emerald-50/70 px-3.5 py-2.5 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20"
              style={delay(580)}
            >
              <MessageSquareText size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <div className="min-w-0">
                <figcaption className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Note from our team
                </figcaption>
                <blockquote className="mt-0.5 line-clamp-3 text-[13px] leading-snug text-gray-700 dark:text-gray-200">{note}</blockquote>
              </div>
            </figure>
          )}

          <div className="animate-fade-up" style={delay(660)}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">What you can do now</p>
            <ul className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-xl ring-1 ring-inset ring-gray-200 dark:divide-gray-800 dark:ring-gray-800">
              {NEXT_STEPS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-gray-900 dark:text-gray-100">{title}</span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto flex animate-fade-up flex-col gap-2" style={delay(760)}>
            <button
              type="button"
              onClick={handleContinue}
              disabled={busy}
              className="group relative inline-flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
            >
              {!busy && (
                <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shine" aria-hidden="true" />
              )}
              <span className="relative">{busy ? "Opening your dashboard…" : "Go to my dashboard"}</span>
              {busy ? (
                <LoaderCircle size={16} className="relative animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight size={16} strokeWidth={2.5} className="relative transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              )}
            </button>
            <FormError message={error} />
          </div>
        </div>
      </div>
    </section>
  );
}
