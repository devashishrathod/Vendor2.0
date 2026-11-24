import { Link } from "react-router-dom";
import { ArrowRight, Hourglass, PartyPopper, ShieldAlert } from "lucide-react";
import { ONBOARDING_ROUTES } from "../config/routes";
import { useOnboardingStatusStore } from "../store/statusStore";

const TONES = {
  danger: {
    box: "bg-red-50 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/30",
    text: "text-red-900 dark:text-red-200",
    icon: "text-red-600 dark:text-red-400",
    button: "bg-red-600 hover:bg-red-700",
  },
  success: {
    box: "bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30",
    text: "text-emerald-900 dark:text-emerald-200",
    icon: "text-emerald-600 dark:text-emerald-400",
    button: "bg-emerald-600 hover:bg-emerald-700",
  },
  info: {
    box: "bg-sky-50 ring-sky-200 dark:bg-sky-500/10 dark:ring-sky-500/30",
    text: "text-sky-900 dark:text-sky-200",
    icon: "text-sky-700 dark:text-sky-400",
    button: "bg-sky-700 hover:bg-sky-800",
  },
};

/** "Reason: …" as a sentence — our team's note usually ends with its own full stop. */
const reasonSentence = (reason) => `Reason: ${reason.trim()}${/[.!?]$/.test(reason.trim()) ? "" : "."}`;

/**
 * What the dashboard pages say about the brand's review, from
 * `status.verification` / `editLock` (guide §7, §9), or null.
 * @param {import('../types').OnboardingStatus|null} status
 */
function bannerFor(status) {
  const v = status?.verification;
  if (!v) return null;
  if (v.isRevoked) {
    return {
      tone: "danger",
      icon: ShieldAlert,
      title: "Your approval has been withdrawn.",
      text: `${v.revokeReason ? `${reasonSentence(v.revokeReason)} ` : ""}Customers can't see your brand until you update your details and resubmit.`,
      action: "Update details",
    };
  }
  if (v.isRejected) {
    return {
      tone: "danger",
      icon: ShieldAlert,
      title: "Our team asked for a few changes.",
      text: v.rejectionReason ? reasonSentence(v.rejectionReason) : "Please update your details and resubmit.",
      action: "Update details",
    };
  }
  if (v.isApproved && !v.isApprovalAcknowledged) {
    return { tone: "success", icon: PartyPopper, title: "Your brand is approved.", text: "Take a look at what's next.", action: "Continue" };
  }
  if (status.editLock === "PENDING") {
    return {
      tone: "info",
      icon: Hourglass,
      title: "Your details are with our team.",
      text: "You can keep adding what's missing while we review.",
      action: "View status",
    };
  }
  return null;
}

/**
 * Banner on the dashboard pages (guide §9): revoked or rejected → "Update
 * details" (the remediation page, every locked section open); approved
 * again → the congratulations screen; under review → its status. The
 * vendor stays where they are — the banner is only a way in.
 */
export default function ReviewStateBanner() {
  const status = useOnboardingStatusStore((s) => s.status);
  const banner = bannerFor(status);
  if (!banner) return null;
  const tone = TONES[banner.tone];
  const Icon = banner.icon;

  return (
    <div className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6" role={banner.tone === "danger" ? "alert" : "status"}>
      <div className={`flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-inset sm:flex-row sm:items-center sm:justify-between ${tone.box}`}>
        <p className={`flex items-start gap-2.5 text-sm ${tone.text}`}>
          <Icon size={18} className={`mt-0.5 shrink-0 ${tone.icon}`} aria-hidden="true" />
          <span>
            <strong className="font-extrabold">{banner.title}</strong> {banner.text}
          </span>
        </p>
        <Link
          to={ONBOARDING_ROUTES.STATUS}
          className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl px-4 text-sm font-bold text-white sm:self-auto ${tone.button}`}
        >
          {banner.action}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
