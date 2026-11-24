import { Gauge } from "lucide-react";
import { STRENGTH_LEVELS } from "./strengthLevels";

/**
 * Compact profile strength — only "87 / 100 · Strong", from the server's
 * `profileStrength` score and level (no local formula). The full card with
 * the "+N" items and the Verified badge is ProfileStrengthCard.
 * @param {{
 *   strength: import('../../types').ProfileStrength|null|undefined,
 *   className?: string,
 * }} props
 */
export default function ProfileStrengthBadge({ strength, className = "" }) {
  if (!strength) return null;

  const level = STRENGTH_LEVELS[strength.level] ?? { text: "text-gray-600 dark:text-gray-300", label: strength.level };

  return (
    <p className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-bold ${className}`} title="Profile strength">
      <Gauge size={14} className={`shrink-0 ${level.text}`} aria-hidden="true" />
      <span className="sr-only">Profile strength:</span>
      <span className="text-gray-900 dark:text-gray-100">{strength.score}</span>
      <span className="text-gray-400">/ 100 ·</span>
      <span className={level.text}>{level.label}</span>
    </p>
  );
}
