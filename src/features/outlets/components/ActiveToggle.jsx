import { cx } from "../utils/outletUtils";
import { OUTLET_STATUS } from "../constants/outletConstants";

export default function ActiveToggle({ status, onToggle }) {
  const isActive = status === OUTLET_STATUS.ACTIVE;
  return (
    <button onClick={onToggle} className="flex items-center gap-2 text-sm font-semibold">
      <span className={cx(isActive ? "text-emerald-600" : "text-rose-500")}>
        {isActive ? "Active Account" : "Deactivate Account"}
      </span>
      <span
        className={cx(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          isActive ? "bg-emerald-500" : "bg-rose-400"
        )}
      >
        <span
          className={cx(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            isActive ? "translate-x-4" : "translate-x-1"
          )}
        />
      </span>
    </button>
  );
}
