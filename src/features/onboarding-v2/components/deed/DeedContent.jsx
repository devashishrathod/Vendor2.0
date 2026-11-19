import { ExternalLink, Info } from "lucide-react";
import { PARTNER_AGREEMENT_URL, PARTNER_TERMS, SUPPORT_EMAIL, TERMS_URL } from "../../constants/onboardingOptions";

export const DEED_LINK_CLASS = "font-semibold text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400";

/**
 * The partnership deed as the panel shows it — document link, terms summary
 * and the T&C note. The text lives in the panel (guide §4.10); the server
 * records the deed version itself. Used by the PARTNERSHIP_DEED screen and
 * the deed confirmation popup (§5).
 * @param {{ intro?: import('react').ReactNode }} props
 */
export default function DeedContent({ intro }) {
  return (
    <>
      <div className="rounded-[14px] bg-gray-50 p-4 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Partnership Deed Document</p>
        {intro && <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{intro}</p>}
        <a
          href={PARTNER_AGREEMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 text-sm ${DEED_LINK_CLASS}`}
        >
          <ExternalLink size={14} aria-hidden="true" />
          Open Trydood Partner Agreement ↗
        </a>
      </div>

      <div className="flex flex-col gap-4 rounded-[14px] bg-gray-50 p-5 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Terms &amp; Conditions Summary</p>
        <ol className="flex flex-col gap-3">
          {PARTNER_TERMS.map((term, i) => (
            <li key={term.title} className="flex gap-3">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                {i + 1}
              </span>
              <div>
                <p className="mb-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">{term.title}</p>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{term.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="border-t border-gray-200 pt-3 text-xs leading-relaxed text-gray-500 dark:border-gray-700 dark:text-gray-400">
          For the full legal document, open the partner agreement link. Contact{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className={DEED_LINK_CLASS}>
            {SUPPORT_EMAIL}
          </a>{" "}
          for any queries.
        </p>
      </div>

      <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
        <Info size={14} className="mr-1 shrink-0 text-emerald-500" aria-hidden="true" />
        Also review the full{" "}
        <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className={DEED_LINK_CLASS}>
          Terms &amp; Conditions
        </a>{" "}
        before accepting.
      </p>
    </>
  );
}

/**
 * "I have read and agree" checkbox.
 * @param {{ checked: boolean, disabled?: boolean, onChange: (checked: boolean) => void }} props
 */
export function DeedAgreeCheckbox({ checked, disabled = false, onChange }) {
  return (
    <label
      className={`flex min-h-11 items-start gap-3 rounded-xl p-4 transition ${
        disabled
          ? "cursor-not-allowed bg-emerald-50/60 dark:bg-emerald-500/10"
          : `cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-emerald-500/10 ${checked ? "bg-emerald-50/60 dark:bg-emerald-500/10" : "bg-gray-50 dark:bg-gray-800/50"}`
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-emerald-500 disabled:cursor-not-allowed"
      />
      <span className="text-sm text-gray-600 dark:text-gray-300">
        I have read and agree to the{" "}
        <a href={PARTNER_AGREEMENT_URL} target="_blank" rel="noopener noreferrer" className={DEED_LINK_CLASS}>
          Trydood Partner Agreement
        </a>{" "}
        and all associated{" "}
        <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className={DEED_LINK_CLASS}>
          terms and conditions
        </a>
        .
      </span>
    </label>
  );
}
