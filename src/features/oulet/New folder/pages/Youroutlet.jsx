import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Ticket,
  CalendarDays,
  ArrowRight,
  PartyPopper,
  Sparkle,
  BadgeCheck,
  TrendingUp,
  ShieldCheck,
  Headset,
  ChevronRight,
  Send,
  ScanSearch,
  UserCheck,
  Rocket,
  AlertTriangle,
  Hourglass,
  RefreshCw,
  Store,
  Clock3,
  FileText,
  CreditCard,
} from "lucide-react";
import AppBackground from "@/components/common/AppBackground";
import OnboardingPageHeader from "@/features/onboarding-v2/components/layout/OnboardingPageHeader";
import ErrorToast from "@/components/common/ErrorToast";
import StatusHistoryTimeline from "../components/StatusHistoryTimeline";
import RejectedCorrections from "../components/corrections/RejectedCorrections";
import SuccessToast from "@/components/common/SuccessToast";
import { ANALYTICS_EVENTS } from "@/constants/analytics";
import { trackEvent } from "@/utils/analytics";

// "SYSTEM_VERIFIED" → "System Verified", "REJECTED" → "Rejected" — used
// for every raw SCREAMING_SNAKE_CASE enum the verification-history API
// returns (action, newStatus, previousStatus, performedByType), instead
// of printing them verbatim in the Status History timeline.
function prettifyStatus(value) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// While a listing is in review, re-check its status this often so approval
// shows up without the vendor pressing "Recheck status".
const STATUS_POLL_MS = 30000;
const STATUS_POLL_LABEL = "every 30 sec";

// Status History wording for the vendor: a rejection reads as "Action
// needed" (same as the hero badge), never "Rejected".
function vendorStatusLabel(value) {
  return value === "REJECTED" ? "Action needed" : prettifyStatus(value);
}

// Scattered, gently-twinkling sparkles/confetti for the "approved" hero
// below — a settled/celebratory feel rather than actively falling pieces.
const REVIEW_CONFETTI_COLORS = ["#f472b6", "#818cf8", "#34d399", "#fb923c", "#facc15", "#60a5fa"];
const REVIEW_CONFETTI_ITEMS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  color: REVIEW_CONFETTI_COLORS[i % REVIEW_CONFETTI_COLORS.length],
  left: Math.random() * 100,
  top: Math.random() * 90,
  size: Math.random() * 8 + 6,
  duration: Math.random() * 2 + 2,
  delay: Math.random() * 3,
  rotate: Math.random() * 360,
  opacity: Math.random() * 0.4 + 0.4,
  isSparkle: Math.random() > 0.5,
}));

import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { getBrandById, getBrandVerificationHistory } from "../services/brandOutletApi"; // ← path apne project ke hisaab se adjust karo
import { acknowledgeApproval, systemVerify } from "@/features/onboarding/services/api/verify.api";

export default function UnderReview() {
  const navigate = useNavigate();
  const { formData } = useOnboardingStore();

  // ⚠️ brandId abhi formData se maan liya hai — agar authStore me alag
  // key par store hai (jaise brand._id), to yahan wahi use karna.
  const brandId = formData?.brandId || formData?.brand?._id || null;

  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ── Review status — GET /brands/verifications/history?brandId= ──────
  // A real, ordered history of every admin action taken on this brand's
  // verification (submit/approve/reject attempts), not just a single
  // point-in-time check. Empty list = no action taken yet (still pending).
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [verifyLoading, setVerifyLoading] = useState(true);
  // Any failed history fetch (auth issues, brand deleted, etc.) surfaces
  // here and is shown via ErrorToast below.
  const [verifyError, setVerifyError] = useState(null);

  const fetchStatus = useCallback(async ({ silent } = {}) => {
    if (!brandId) return;
    if (!silent) setVerifyLoading(true);
    try {
      const res = await getBrandVerificationHistory({ brandId });
      const list = res?.data?.data ?? res?.data ?? [];
      setVerificationHistory(Array.isArray(list) ? list : []);
    } catch (err) {
      setVerifyError({ status: err.status, message: err.message });
    } finally {
      setVerifyLoading(false);
    }
  }, [brandId]);

  // ── Fetch brand from /brands/get?brandId=:brandId ──────────────
  const fetchBrand = useCallback(async ({ silent } = {}) => {
    if (!brandId) {
      setError("Brand ID missing — can't load review status.");
      setLoading(false);
      return;
    }
    if (silent) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const res = await getBrandById(brandId);
      const data = res?.data ?? res;

      console.log("[YourOutlet] fetchBrand ← response:", data);
      setBrand(data);

      // Backend's authoritative screen state lives on data.user.currentScreen
      if (data?.user?.currentScreen === "DASHBOARD") {
        navigate("/analysis-report", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Couldn't fetch brand status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [brandId, navigate]);

  // ── Initial fetch on mount ──────────────────────────────────────
  useEffect(() => {
    fetchBrand();
    fetchStatus();
  }, [fetchBrand, fetchStatus]);

  // ── Also react if authStore's currentScreen updates live (e.g. via
  // socket/poll elsewhere in the app) ─────────────────────────────
  const authCurrentScreen = useAuthStore((s) => s.currentScreen);
  useEffect(() => {
    if (authCurrentScreen === "DASHBOARD") {
      navigate("/analysis-report", { replace: true });
    }
  }, [authCurrentScreen, navigate]);

  const handleRecheck = () => {
    fetchBrand({ silent: true });
    fetchStatus({ silent: true });
  };

  // ── Map real API fields (see /brands/get response) ──────────────
  const brandData = {
    companyName: brand?.gst?.legalName || brand?.legalBusinessName || brand?.brandName || "—",
    merchantToken: brand?.merchantId || "—",
    gstNo: brand?.gst?.gstNumber || "—",
    panNo: brand?.pan?.pan || "—",
    createdAt: brand?.createdAt || null,
    logo: brand?.logo || null,   // ← ye line missing thi
  };

  const formattedDate = brandData.createdAt
    ? new Date(brandData.createdAt).toLocaleString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
    : "—";

  // ── Derived review status — from the most recent verification-history
  // entry's `newStatus`, NOT `action`. ⚠️ FIXED: this used to read
  // `entry.action` instead, but `action` just names the KIND of action
  // taken (e.g. "SYSTEM_VERIFIED") — it does NOT mean the outcome was a
  // pass. A system-verify attempt can itself result in newStatus
  // "REJECTED" (see the real history entry that surfaced this: action
  // "SYSTEM_VERIFIED", previousStatus "PENDING", newStatus "REJECTED").
  // Reading `action` meant a rejected brand silently fell through to
  // isPending, showing the amber "under review" banner instead of the
  // rose "needs correction" one — and never showing the correction
  // fields below at all. `newStatus` is the actual resulting state.
  // No entries yet (an empty history) means nothing's been actioned,
  // i.e. still pending.
  const sortedHistory = [...verificationHistory].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const latestEntry = sortedHistory[0] || null;
  const reviewStatus = latestEntry?.newStatus || latestEntry?.action;
  const isApproved = reviewStatus === "APPROVED";
  // A revoked brand (brand.isRevoked, confirmed field — separate from the
  // approve/reject history, since revoke can happen to an already-approved
  // brand later) gets the exact same "needs correction" treatment as a
  // rejected one — same banner, same Basic/Business Details correction
  // panels — rather than a distinct case.
  const isRejected = reviewStatus === "REJECTED" || !!brand?.isRevoked;
  const isPending = !isApproved && !isRejected;

  // Auto-check while in review: polls brand + history silently, skips while
  // the tab is hidden, and checks right away when the vendor comes back to
  // the tab. Not run while rejected — a refresh there could overwrite the
  // correction forms the vendor is filling in.
  useEffect(() => {
    if (!isPending || loading) return undefined;
    const check = () => {
      if (document.visibilityState !== "visible") return;
      fetchBrand({ silent: true });
      fetchStatus({ silent: true });
    };
    const timer = setInterval(check, STATUS_POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [isPending, loading, fetchBrand, fetchStatus]);

  // ── Approve → acknowledge → go to dashboard. Only ever called once
  // isApproved is true (the button only renders in that state). ──────
  const [acknowledging, setAcknowledging] = useState(false);
  const [ackError, setAckError] = useState("");
  const handleGoToDashboard = async () => {
    setAcknowledging(true);
    setAckError("");
    try {
      await acknowledgeApproval();
      // Funnel end: approved vendor reaches the dashboard for the first time.
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETE);
      navigate("/analysis-report", { replace: true });
    } catch (err) {
      setAckError(err.message || "Couldn't confirm approval. Please try again.");
      setAcknowledging(false);
    }
  };

  // Tracks whether ANYTHING has actually been saved this session — once
  // true, a "Submit for Review" button appears (rejected case only) that
  // re-runs system-verify to resubmit the corrected brand for review.
  const [hasUpdated, setHasUpdated] = useState(false);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState("");

  // A correction (basic details, GST, PAN or bank) was saved in
  // RejectedCorrections — show it and offer "Submit for Review".
  const handleCorrectionSaved = useCallback(
    (message) => {
      setVerifySuccessMsg(message);
      setHasUpdated(true);
    },
    [setHasUpdated, setVerifySuccessMsg],
  );

  // ── Resubmit for review — the "Submit" action after fixing rejected
  // details. Re-runs the same GET /brands/onboarding/system-verify score
  // check the onboarding wizard uses, then refreshes both the brand and
  // the verification history so Status History picks up the new attempt.
  const [submittingReview, setSubmittingReview] = useState(false);
  const handleSubmitForReview = async () => {
    setSubmittingReview(true);
    try {
      await systemVerify();
      setVerifySuccessMsg("Submitted for review.");
      setHasUpdated(false);
      await Promise.all([fetchBrand({ silent: true }), fetchStatus({ silent: true })]);
    } catch (err) {
      setVerifyError({ status: err.status, message: err.message });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Status History rows — the original submission, then every verification
  // action oldest-first. Colour/status come from `newStatus` (the actual
  // resulting state), not `action` (just the kind of action — e.g.
  // "SYSTEM_VERIFIED" can itself result in newStatus "REJECTED").
  const timelineItems = [
    {
      id: "submitted",
      dotColor: "bg-gray-300",
      ringColor: "ring-gray-100 dark:ring-gray-700",
      title: "Submitted for review",
      date: formattedDate,
    },
    ...[...sortedHistory].reverse().map((entry) => {
      const status = entry.newStatus || entry.action;
      const dotColor =
        status === "REJECTED" ? "bg-amber-500" : status === "APPROVED" ? "bg-emerald-500" : "bg-amber-400";
      const ringColor =
        status === "REJECTED"
          ? "ring-amber-100 dark:ring-amber-500/20"
          : status === "APPROVED"
          ? "ring-emerald-100 dark:ring-emerald-500/20"
          : "ring-amber-100 dark:ring-amber-500/20";
      const badgeClass =
        status === "REJECTED"
          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
          : status === "APPROVED"
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";
      return {
        id: entry._id,
        dotColor,
        ringColor,
        actionLabel: prettifyStatus(entry.action) || "Status updated",
        attemptNumber: entry.attemptNumber,
        performedByType: entry.performedByType,
        statusLabel: vendorStatusLabel(status),
        badgeClass,
        transition:
          entry.previousStatus && entry.newStatus
            ? `${vendorStatusLabel(entry.previousStatus)} → ${vendorStatusLabel(entry.newStatus)}`
            : null,
        // "Business name mismatch (78.00%) | Bank holder name mismatch (22%)"
        // → one bullet per reason instead of a single run-on line.
        reasons: entry.reason ? entry.reason.split("|").map((r) => r.trim()).filter(Boolean) : [],
        date: entry.createdAt
          ? new Date(entry.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
      };
    }),
  ];

  // Progress tracker for the status card: Submitted → System check →
  // Admin review → Live.
  const systemChecked = verificationHistory.some((e) => String(e.action || "").includes("SYSTEM"));
  const trackerSteps = [
    { key: "submitted", label: "Submitted", icon: Send, state: "done" },
    { key: "system", label: "System check", icon: ScanSearch, state: systemChecked ? "done" : "current" },
    {
      key: "admin",
      label: isRejected ? "Needs correction" : "Admin review",
      icon: isRejected ? AlertTriangle : UserCheck,
      state: isRejected ? "error" : systemChecked ? "current" : "todo",
    },
    { key: "live", label: "Live", icon: Rocket, state: "todo" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 bg-gradient-to-br from-[#E9F8EF] via-[#F5FBF7] to-[#E3F5F1] dark:from-gray-950 dark:via-gray-950 dark:to-[#06231b]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        <p className="text-sm text-gray-500">Loading review status…</p>
      </div>
    );
  }

  return (
    // Soft green gradient + blurred glows (same look as the admin panel).
    <div className="app-shell-bg relative isolate min-h-screen overflow-x-clip font-sans">
      <AppBackground />

      <OnboardingPageHeader title={isApproved ? "Approved" : isRejected ? "Needs correction" : "Under review"} />

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-5xl px-4 py-4 sm:px-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-emerald-600">Overview</span>
              <ChevronRight className="h-3 w-3 text-gray-300" />
              <span className="text-gray-400">Showcase your listing outlet</span>
            </p>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100">
              Your <span className="text-emerald-600">Outlet</span>
            </h1>
          </div>
          {!isApproved && (
            <div className="flex items-center gap-2">
            {isPending && (
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Auto-checking {STATUS_POLL_LABEL}
              </span>
            )}
            <button
              onClick={handleRecheck}
              disabled={refreshing}
              className="flex w-fit items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-xl transition-all hover:bg-white active:scale-[0.97] disabled:opacity-60 dark:border-white/5 dark:bg-gray-900/60 dark:text-emerald-400"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Checking…" : "Recheck status"}
            </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200/70 bg-red-50/90 px-4 py-3 text-xs text-red-600 backdrop-blur dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {isApproved ? (
          <div className="relative mb-5 overflow-hidden rounded-3xl border border-white/80 bg-white/70 px-6 py-10 shadow-[0_8px_30px_rgba(16,185,129,0.10)] backdrop-blur-xl sm:px-10 dark:border-white/5 dark:bg-gray-900/60">
            <style>{`
              @keyframes reviewBadgePop {
                0%   { transform: scale(0.5); opacity: 0; }
                60%  { transform: scale(1.08); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes reviewFadeUp {
                from { opacity: 0; transform: translateY(10px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              @keyframes reviewRingPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.25); }
                50%      { box-shadow: 0 0 0 10px rgba(16,185,129,0.06); }
              }
              @keyframes reviewSunburst {
                0%, 100% { opacity: 0.4; transform: scale(0.92); }
                50%      { opacity: 1; transform: scale(1); }
              }
              @keyframes reviewTwinkle {
                0%, 100% { opacity: 0.25; transform: scale(0.85); }
                50%      { opacity: 1; transform: scale(1.1); }
              }
            `}</style>

            {/* Scattered sparkles/confetti — decorative, gently twinkling
                rather than falling, matching a "just landed, settled" feel. */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {REVIEW_CONFETTI_ITEMS.map((item) =>
                item.isSparkle ? (
                  <Sparkle
                    key={item.id}
                    className="absolute text-emerald-400"
                    style={{
                      left: `${item.left}%`,
                      top: `${item.top}%`,
                      width: item.size,
                      height: item.size,
                      opacity: item.opacity,
                      animation: `reviewTwinkle ${item.duration}s ease-in-out ${item.delay}s infinite`,
                    }}
                    fill="currentColor"
                  />
                ) : (
                  <span
                    key={item.id}
                    className="absolute rounded-full"
                    style={{
                      left: `${item.left}%`,
                      top: `${item.top}%`,
                      width: `${item.size}px`,
                      height: `${item.size * 0.55}px`,
                      background: item.color,
                      opacity: item.opacity,
                      transform: `rotate(${item.rotate}deg)`,
                      animation: `reviewTwinkle ${item.duration}s ease-in-out ${item.delay}s infinite`,
                    }}
                  />
                )
              )}
            </div>

            <div className="relative flex flex-col items-center text-center gap-3">
              <div className="relative flex items-center justify-center mb-1">
                {/* Sunburst rays behind the badge */}
                <div
                  className="absolute w-28 h-28"
                  style={{ animation: "reviewSunburst 2.4s ease-in-out infinite" }}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <span
                      key={i}
                      className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-emerald-300 rounded-full"
                      style={{
                        transform: `rotate(${i * 45}deg) translateY(-52px)`,
                        transformOrigin: "center",
                      }}
                    />
                  ))}
                </div>
                {/* Soft halo */}
                <div className="absolute w-24 h-24 rounded-full bg-emerald-100" />
                {/* Checkmark badge */}
                <div
                  className="relative w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center"
                  style={{ animation: "reviewBadgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both, reviewRingPulse 2.4s ease-in-out 0.5s infinite" }}
                >
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
              </div>

              <h2
                className="text-2xl sm:text-3xl font-bold flex items-center gap-2"
                style={{ animation: "reviewFadeUp 0.4s 0.15s ease both", opacity: 0 }}
              >
                <span className="text-gray-900 dark:text-gray-100">You're</span>{" "}
                <span className="text-emerald-600">approved!</span>{" "}
                <PartyPopper className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
              </h2>
              <p
                className="text-sm sm:text-base text-gray-500 max-w-md"
                style={{ animation: "reviewFadeUp 0.4s 0.25s ease both", opacity: 0 }}
              >
                Your listing has been verified and is now live.
                <br />
                Head to your dashboard to start managing your outlet.
              </p>
            </div>

            <div
              className="relative mt-7 bg-white dark:bg-gray-800 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ animation: "reviewFadeUp 0.4s 0.35s ease both", opacity: 0 }}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-16 flex items-center justify-center overflow-hidden rounded-md bg-gray-50 dark:bg-gray-700 shrink-0">
                  <img
                    src={brandData.logo}
                    alt="Trydood"
                    className="w-12 h-16 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <span className="text-emerald-400 text-xs font-bold hidden">T</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{brandData.companyName}</p>
                  <p className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-emerald-500" /> {brandData.merchantToken}
                    </span>
                    <span className="text-gray-200">|</span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-500" /> {formattedDate}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1.5 flex-shrink-0">
                <button
                  onClick={handleGoToDashboard}
                  disabled={acknowledging}
                  className="px-5 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100
                    text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap
                    transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {acknowledging ? "Opening…" : "Go to Dashboard"}
                  {!acknowledging && <ArrowRight className="w-4 h-4" />}
                </button>
                {ackError && <p className="text-xs text-rose-500">{ackError}</p>}
              </div>
            </div>

            {/* Benefit strip */}
            <div
              className="relative mt-7 grid grid-cols-2 sm:grid-cols-4 gap-6"
              style={{ animation: "reviewFadeUp 0.4s 0.45s ease both", opacity: 0 }}
            >
              {[
                { icon: BadgeCheck, title: "Verified & Live", desc: "Your outlet is now visible to customers." },
                { icon: TrendingUp, title: "Boost Visibility", desc: "Increase reach and grow your business." },
                { icon: ShieldCheck, title: "Secure & Trusted", desc: "All details verified for a safe experience." },
                { icon: Headset, title: "Need Help?", desc: "Our support team is here for you." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── Animated review hero (scanner illustration + live tracker) ── */}
            <div className="relative mb-2 px-2 py-2 sm:px-4">
              <style>{`
                @keyframes reviewSpin      { to { transform: rotate(360deg); } }
                @keyframes reviewSpinBack  { to { transform: rotate(-360deg); } }
                @keyframes reviewFlip      { 0%, 40% { transform: rotate(0deg); } 50%, 90% { transform: rotate(180deg); } 100% { transform: rotate(360deg); } }
                @keyframes reviewFloat     { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(24px, -18px) scale(1.08); } }
                @keyframes reviewFill      { from { transform: scaleX(0); } to { transform: scaleX(1); } }
                @keyframes reviewRise      { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes reviewShimmer   { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                @keyframes reviewPulse     { 0% { transform: scale(0.8); opacity: 0.9; } 100% { transform: scale(1.6); opacity: 0; } }
                @media (prefers-reduced-motion: reduce) {
                  .review-anim, .review-anim * { animation: none !important; }
                }
              `}</style>

              <div className="review-anim relative grid grid-cols-1 items-center gap-5 sm:grid-cols-[140px_1fr]">
                {/* Scanner illustration */}
                <div aria-hidden="true" className="relative mx-auto flex h-32 w-32 items-center justify-center">
                  {/* Rotating dashed outer ring */}
                  <span
                    className={`absolute inset-0 rounded-full border-2 border-dashed ${
                      isRejected ? "border-amber-200 dark:border-amber-500/30" : "border-emerald-200 dark:border-emerald-500/30"
                    }`}
                    style={{ animation: "reviewSpin 22s linear infinite" }}
                  />
                  {/* Radar sweep */}
                  <span
                    className="absolute inset-3 rounded-full"
                    style={{
                      background: isRejected
                        ? "conic-gradient(from 0deg, rgba(245,158,11,0.28), transparent 32%)"
                        : "conic-gradient(from 0deg, rgba(16,185,129,0.30), transparent 32%)",
                      animation: isRejected ? "none" : "reviewSpin 3.2s linear infinite",
                    }}
                  />
                  <span
                    className={`absolute inset-3 rounded-full ring-1 ${
                      isRejected ? "ring-amber-100 dark:ring-amber-500/20" : "ring-emerald-100 dark:ring-emerald-500/20"
                    }`}
                  />
                  {/* Orbiting check icons (counter-rotated so they stay upright) */}
                  {!isRejected && (
                    <span className="absolute inset-0" style={{ animation: "reviewSpin 14s linear infinite" }}>
                      {[
                        { Icon: FileText, pos: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" },
                        { Icon: ShieldCheck, pos: "right-[6%] bottom-[14%] translate-x-1/2" },
                        { Icon: BadgeCheck, pos: "left-[6%] bottom-[14%] -translate-x-1/2" },
                      ].map(({ Icon, pos }) => (
                        <span key={pos} className={`absolute ${pos}`}>
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-600 shadow-md ring-1 ring-emerald-100 dark:bg-gray-800 dark:text-emerald-400 dark:ring-emerald-500/20"
                            style={{ animation: "reviewSpinBack 14s linear infinite" }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                        </span>
                      ))}
                    </span>
                  )}
                  {/* Core badge */}
                  <span
                    className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ${
                      isRejected
                        ? "bg-gradient-to-br from-amber-500 to-yellow-400 shadow-amber-500/30"
                        : "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30"
                    }`}
                  >
                    <span
                      className={`absolute inset-0 rounded-full animate-ping ${isRejected ? "bg-amber-400/30" : "bg-emerald-400/30"}`}
                      style={{ animationDuration: "2.4s" }}
                    />
                    {isRejected ? (
                      <AlertTriangle className="relative h-6 w-6" />
                    ) : (
                      <Hourglass className="relative h-6 w-6" style={{ animation: "reviewFlip 4s ease-in-out infinite" }} />
                    )}
                  </span>
                </div>

                {/* Copy + tracker */}
                <div className="min-w-0">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-bold ring-1 ${
                      isRejected
                        ? "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"
                        : "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
                    }`}
                    style={{ animation: "reviewRise 0.45s ease both" }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isRejected ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <span className={`relative inline-flex h-2 w-2 rounded-full ${isRejected ? "bg-amber-500" : "bg-emerald-500"}`} />
                    </span>
                    {isRejected ? "Action needed" : "In review"}
                  </span>

                  <h2
                    className="mt-2 text-lg font-bold leading-snug tracking-tight text-gray-900 sm:text-xl dark:text-gray-100"
                    style={{ animation: "reviewRise 0.45s 0.08s ease both" }}
                  >
                    {isRejected ? "Some details need to be corrected" : "Your listing is under review"}
                  </h2>
                  <p
                    className="mt-1 max-w-xl text-[12.5px] leading-snug text-gray-500 dark:text-gray-400"
                    style={{ animation: "reviewRise 0.45s 0.16s ease both" }}
                  >
                    {isRejected
                      ? "Please fix the details below and re-verify so we can review your listing again."
                      : "Trydood will review your listing details and verify them soon. If there are any errors, your submission will be put on hold — the Trydood team will contact you shortly."}
                  </p>

                  {/* Quick facts */}
                  <div className="mt-2.5 flex flex-wrap gap-2" style={{ animation: "reviewRise 0.45s 0.24s ease both" }}>
                    <span className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-[11.5px] font-medium text-gray-600 ring-1 ring-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
                      <Send className="h-3.5 w-3.5 text-emerald-500" /> Submitted {formattedDate}
                    </span>
                    {!isRejected && (
                      <span className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-[11.5px] font-medium text-gray-600 ring-1 ring-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
                        <Clock3 className="h-3.5 w-3.5 text-emerald-500" /> Usually reviewed within 24–48 hours
                      </span>
                    )}
                  </div>

                  {/* Live tracker — one connector per step, drawn from the
                      previous step's centre to this step's centre, so the
                      line never sticks out past the first/last circle. */}
                  <ol className="mt-4 grid grid-cols-4" style={{ animation: "reviewRise 0.45s 0.32s ease both" }}>
                    {trackerSteps.map((s, i) => {
                      const Icon = s.icon;
                      const done = s.state === "done";
                      const current = s.state === "current";
                      const errorState = s.state === "error";
                      const reached = done || current || errorState;
                      return (
                        <li key={s.key} className="relative flex flex-col items-center text-center">
                          {i > 0 && (
                            <span
                              aria-hidden="true"
                              className={`absolute right-1/2 top-[16px] h-[3px] w-full -translate-y-1/2 overflow-hidden rounded-full ${
                                reached ? "bg-emerald-100 dark:bg-emerald-500/20" : ""
                              }`}
                              style={
                                reached
                                  ? undefined
                                  : { backgroundImage: "linear-gradient(90deg, #d1d5db 50%, transparent 50%)", backgroundSize: "8px 3px" }
                              }
                            >
                              {reached && (
                                <span
                                  className={`block h-full origin-left rounded-full ${
                                    errorState
                                      ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                                      : current
                                      ? "bg-[linear-gradient(90deg,#10b981,#6ee7b7,#10b981)] bg-[length:200%_100%]"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{
                                    animation: `reviewFill 0.6s ${0.35 + i * 0.25}s cubic-bezier(0.22,1,0.36,1) both${
                                      current ? ", reviewShimmer 2.2s linear 1.4s infinite" : ""
                                    }`,
                                  }}
                                />
                              )}
                            </span>
                          )}

                          <span className="relative z-10 flex h-8 w-8 items-center justify-center">
                            {current && (
                              <span
                                aria-hidden="true"
                                className="absolute -inset-1.5 rounded-full bg-emerald-400/20"
                                style={{ animation: "reviewPulse 2s ease-out infinite" }}
                              />
                            )}
                            <span
                              className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                                done
                                  ? "bg-emerald-500 text-white shadow-[0_4px_12px_-2px_rgba(16,185,129,0.45)]"
                                  : current
                                  ? "bg-white text-emerald-600 shadow-sm ring-2 ring-emerald-500 dark:bg-gray-900"
                                  : errorState
                                  ? "bg-amber-500 text-white shadow-[0_4px_12px_-2px_rgba(245,158,11,0.45)]"
                                  : "bg-white text-gray-300 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-600 dark:ring-gray-700"
                              }`}
                            >
                              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
                            </span>
                          </span>

                          <span
                            className={`mt-1.5 text-[11.5px] font-semibold leading-tight sm:text-xs ${
                              errorState
                                ? "text-amber-600 dark:text-amber-400"
                                : reached
                                ? "text-gray-900 dark:text-gray-100"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {s.label}
                          </span>
                          {current && (
                            <span className="mt-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                              In progress
                            </span>
                          )}
                          {done && <span className="mt-0.5 text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/80">Done</span>}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </div>

            {/* ── Brand card + Status History ── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              {/* Brand */}
              <div className="p-2 lg:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                    {brandData.logo ? (
                      <img src={brandData.logo} alt="" className="h-full w-full object-contain p-1.5" />
                    ) : (
                      <Store className="h-6 w-6 text-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Your brand</p>
                    {/* Wraps to two lines instead of cutting the name off */}
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 dark:text-gray-100" title={brandData.companyName}>
                      {brandData.companyName}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { icon: Ticket, label: "Merchant Token", value: brandData.merchantToken, mono: true },
                    { icon: FileText, label: "GSTIN", value: brandData.gstNo, mono: true },
                    { icon: CreditCard, label: "PAN", value: brandData.panNo, mono: true },
                    { icon: CalendarDays, label: "Created on", value: formattedDate },
                  ].map(({ icon: Icon, label, value, mono }) => (
                    <div key={label} className="flex items-center gap-2 rounded-xl bg-white/70 px-2.5 py-2 dark:bg-gray-800/60">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                        <p className={`truncate text-xs font-semibold text-gray-800 dark:text-gray-100 ${mono ? "font-mono" : ""}`}>
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* What happens next / How to get approved — under the brand
                    details; steps stack one by one in this narrower column. */}
                <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-500/15 dark:bg-emerald-500/5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {isRejected ? "How to get approved" : "What happens next"}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
                    {(isRejected
                      ? [
                          { icon: FileText, title: "Fix the details below", desc: "Correct the business, PAN, GST or bank details that were flagged." },
                          { icon: ShieldCheck, title: "Verify & save", desc: "Re-verify each corrected detail and save it." },
                          { icon: Send, title: "Submit for review", desc: "Send it back — our team will review it again." },
                        ]
                      : [
                          { icon: ShieldCheck, title: "Admin checks your details", desc: "Business name, PAN, GST and bank are matched." },
                          { icon: Clock3, title: "Usually 24–48 hours", desc: "No action needed from you while we review." },
                          { icon: Rocket, title: "You go live", desc: "Once approved, you'll land on your dashboard here." },
                        ]
                    ).map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="flex items-start gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm dark:bg-gray-800 dark:text-emerald-400">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-100">{title}</p>
                          <p className="text-[11.5px] leading-snug text-gray-500">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status History */}
              <div className="flex flex-col p-2 lg:col-span-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-gray-100">
                    <Clock3 className="h-4 w-4 text-emerald-500" /> Status History
                  </p>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {timelineItems.length} update{timelineItems.length === 1 ? "" : "s"}
                  </span>
                </div>

                <StatusHistoryTimeline items={timelineItems} loading={verifyLoading} formatActor={prettifyStatus} />
              </div>
            </div>
          </>
        )}

        {/* ── Rejected: Basic Details + Business Details correction
            panels, stacked vertically — Basic Details on top, Business
            Details below. Both are themselves collapsible (down-arrow
            header, same AccordionFieldCard as the inner PAN/GST/Bank
            rows), not just their individual fields. Not a new page —
            just input rows in cards, with the verified/saved result
            shown right below each one. ─────────────────────────────── */}
        {isRejected && (
          <div className="mt-5 space-y-4">
          {brand && <RejectedCorrections brand={brand} brandId={brandId || brand._id} onSaved={handleCorrectionSaved} />}

          {/* Only shows up once something has actually been saved — no
              point resubmitting for review if nothing changed. */}
          {hasUpdated && (
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submittingReview}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white
                text-sm font-bold tracking-wide transition-all duration-150 active:scale-[0.99]
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submittingReview ? "Submitting…" : "Submit for Review"}
            </button>
          )}
          </div>
        )}

        {/* <button
          onClick={() => navigate("/manage-outlet")} // ← apna actual route lagana
          className="w-full mt-4 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700
    text-sm font-semibold rounded-xl transition-all duration-150 active:scale-[0.98]"
        >
          Manage Your Outlet
        </button> */}

        {/* ── Polling indicator — hidden once approved or rejected ── */}
        {isPending && (
          <div className="mt-8 flex justify-center">
            <p className="flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-gray-900/60 dark:text-gray-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              We'll update this page as soon as your review is done — tap <span className="font-semibold text-emerald-600">Recheck status</span> anytime.
            </p>
          </div>
        )}
      </div>

      <ErrorToast error={verifyError} onDismiss={() => setVerifyError(null)} />
      <SuccessToast message={verifySuccessMsg} onDismiss={() => setVerifySuccessMsg("")} />
    </div>
  );
}
