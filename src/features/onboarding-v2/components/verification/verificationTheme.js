import {
  BadgeCheck,
  Check,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  CircleX,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { SCORE_THRESHOLDS } from "../../utils/systemVerification";

/** Look of each check result: tile border, icon box and status pill. */
export const STATUS_STYLE = {
  pass: {
    icon: Check,
    label: "Passed",
    tile: "border-emerald-200 dark:border-emerald-500/30",
    iconBox: "bg-emerald-500 text-white",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  },
  warn: {
    icon: TriangleAlert,
    label: "Needs review",
    tile: "border-amber-200 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-500/5",
    iconBox: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    pill: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  },
  fail: {
    icon: X,
    label: "Failed",
    tile: "border-red-200 bg-red-50/40 dark:border-red-500/30 dark:bg-red-500/5",
    iconBox: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
    pill: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
  },
  skipped: {
    icon: CircleMinus,
    label: "Skipped",
    tile: "border-gray-200 dark:border-gray-700",
    iconBox: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300",
    pill: "bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700",
  },
  na: {
    icon: CircleMinus,
    label: "Not needed",
    tile: "border-gray-200 dark:border-gray-700",
    iconBox: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
    pill: "bg-gray-50 text-gray-500 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700",
  },
};

/**
 * Banner look per tone. All class strings are written out in full so
 * Tailwind can see them.
 * - accent: gradient strip along the top edge
 * - glow: soft blurred blob in the corner
 * - iconBox: the status icon tile
 * - pill: the small status label above the title
 * - bar / scoreText: score bar fill and score number
 * - remarkIcon / remarkIconClass: icon in front of each backend remark
 */
const TONES = {
  emerald: {
    surface: "border-emerald-100 dark:border-emerald-500/20",
    accent: "from-emerald-400 via-teal-400 to-emerald-500",
    glow: "bg-emerald-400/20",
    iconBox: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/10",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    bar: "bg-gradient-to-r from-emerald-400 to-teal-600",
    scoreText: "text-emerald-600 dark:text-emerald-400",
    remarkIcon: CircleCheck,
    remarkIconClass: "text-emerald-500",
  },
  amber: {
    surface: "border-amber-100 dark:border-amber-500/20",
    accent: "from-amber-300 via-amber-400 to-orange-500",
    glow: "bg-amber-400/20",
    iconBox: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/10",
    pill: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    bar: "bg-gradient-to-r from-amber-300 to-orange-500",
    scoreText: "text-amber-600 dark:text-amber-400",
    remarkIcon: TriangleAlert,
    remarkIconClass: "text-amber-500",
  },
  red: {
    surface: "border-red-100 dark:border-red-500/20",
    accent: "from-rose-400 via-red-500 to-rose-600",
    glow: "bg-red-400/20",
    iconBox: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-red-500/30 ring-4 ring-red-500/10",
    pill: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
    bar: "bg-gradient-to-r from-rose-400 to-red-600",
    scoreText: "text-red-600 dark:text-red-400",
    remarkIcon: CircleX,
    remarkIconClass: "text-red-500",
  },
};

/** Banner while the checks run. */
export const RUNNING_BANNER = {
  ...TONES.emerald,
  icon: ShieldCheck,
  eyebrow: "Checking",
  title: "Verifying your business…",
  text: "We're matching your PAN, GST and bank details. This takes a few seconds — please keep this page open.",
  // Calmer icon tile while running — the spinner ring carries the motion.
  iconBox: "bg-emerald-50 text-emerald-600 ring-4 ring-emerald-500/5 dark:bg-emerald-500/10 dark:text-emerald-400",
};

/** Banner per result. `error` text is replaced by the API message. */
export const RESULT_BANNER = {
  approved: {
    ...TONES.emerald,
    icon: BadgeCheck,
    eyebrow: "Approved",
    title: "You're verified!",
    text: "Every automatic check passed. Our team does a final look and your outlet goes live shortly.",
  },
  review: {
    ...TONES.amber,
    icon: Users,
    eyebrow: "Team review",
    title: "Sent to our team for a quick review",
    text: "Most checks passed. A few need a human look — usually done within 24–48 hours. Nothing to do right now.",
  },
  failed: {
    ...TONES.red,
    icon: ShieldX,
    eyebrow: "Not approved",
    title: "A few things need fixing",
    text: "Some details didn't pass. You can continue — fix them from your status page and re-submit, or our team will reach out.",
  },
  error: {
    ...TONES.red,
    icon: CircleAlert,
    eyebrow: "Couldn't run",
    title: "Verification didn't run",
    text: "We couldn't run verification right now.",
  },
};

/**
 * "failed" while no single check failed: the backend's overall score was
 * below the review band, so "things need fixing" would contradict the tiles.
 */
export const LOW_SCORE_COPY = {
  title: "Score below the approval level",
  text: `No check failed, but the overall score is below the ${SCORE_THRESHOLDS.REVIEW} needed for review. You can continue — update details from your status page and re-submit, or our team will reach out.`,
};

/** Score-bar markers, from the documented score bands. */
export const SCORE_MARKS = [
  { value: SCORE_THRESHOLDS.REVIEW, label: "Team review", dot: "bg-amber-400" },
  { value: SCORE_THRESHOLDS.APPROVE, label: "Auto-approve", dot: "bg-emerald-500" },
];
