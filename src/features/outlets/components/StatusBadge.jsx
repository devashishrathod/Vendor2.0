import { cx } from "../utils/outletUtils";
import { OUTLET_STATUS } from "../constants/outletConstants";

export default function StatusBadge({ status }) {
  const isActive = status === OUTLET_STATUS.ACTIVE;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
        isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
      )}
    >
      <span className={cx("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-rose-500")} />
      {isActive ? "Active" : "Not Active"}
    </span>
  );
}
