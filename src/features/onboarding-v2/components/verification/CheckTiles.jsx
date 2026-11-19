import { LoaderCircle } from "lucide-react";
import { STATUS_STYLE } from "./verificationTheme";

const TILE_STAGGER_MS = 70;

/** "done" (result shown), "running" (spinner) or "pending" (not reached yet). */
const tileState = (index, revealed, total) => {
  if (revealed >= total || index < revealed) return "done";
  return index === revealed ? "running" : "pending";
};

const TILE_FRAME = {
  pending: "border-dashed border-gray-200 bg-white/60 dark:border-gray-700 dark:bg-gray-900/40",
  running: "border-emerald-300 bg-white ring-4 ring-emerald-500/10 dark:border-emerald-500/50 dark:bg-gray-900",
};

function TileIcon({ state, status }) {
  if (state === "running") {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" aria-hidden="true">
        <LoaderCircle size={17} className="animate-spin" />
      </span>
    );
  }
  if (state === "pending") {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-100 dark:bg-gray-800" aria-hidden="true">
        <span className="size-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
      </span>
    );
  }
  const { icon: Icon, iconBox } = STATUS_STYLE[status];
  return (
    <span className={`grid size-9 shrink-0 animate-check-pop place-items-center rounded-xl ${iconBox}`} aria-hidden="true">
      <Icon size={17} strokeWidth={2.75} />
    </span>
  );
}

function CheckTile({ check, state, index }) {
  const style = STATUS_STYLE[check.status];
  const frame = state === "done" ? `bg-white dark:bg-gray-900 ${style.tile}` : TILE_FRAME[state];

  return (
    <li
      className={`relative flex animate-fade-up items-start gap-3 overflow-hidden rounded-2xl border p-3.5 transition-[border-color,background-color,box-shadow] duration-300 ${frame}`}
      style={{ animationDelay: `${index * TILE_STAGGER_MS}ms` }}
    >
      {state === "running" && (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-emerald-100/60 to-transparent motion-reduce:hidden dark:via-emerald-500/10"
          aria-hidden="true"
        />
      )}
      <TileIcon state={state} status={check.status} />
      <div className="relative min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[13px] font-bold leading-snug ${state === "pending" ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>
            {check.label}
          </p>
          {state === "done" && (
            <span className={`shrink-0 animate-fade-in rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ring-inset ${style.pill}`}>{style.label}</span>
          )}
        </div>
        <p className="mt-0.5 text-[11.5px] leading-snug text-gray-500 dark:text-gray-400">
          {state === "done" ? check.detail : state === "running" ? "Checking…" : "Waiting"}
        </p>
      </div>
    </li>
  );
}

/**
 * The verification checks as a 2-column grid of tiles, revealed one by one.
 * @param {{ checks: import("../../utils/systemVerification").VerificationCheck[], revealed: number }} props
 */
export default function CheckTiles({ checks, revealed }) {
  if (checks.length === 0) return null;
  return (
    <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Verification checks">
      {checks.map((check, index) => (
        <CheckTile key={check.key} check={check} index={index} state={tileState(index, revealed, checks.length)} />
      ))}
    </ul>
  );
}
