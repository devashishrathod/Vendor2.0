
/**
 * InfoItem
 * A small label + value pair (e.g. "Merchant Token" / "A4FGIWJOIUN20"),
 * optionally with one or more trailing action links (e.g. "View", "Change").
 * Pass a single `action` for the common one-button case, or `actions`
 * (an array) when a field needs more than one.
 */
const InfoItem = ({ label, value, action, actions }) => {
  const items = actions || (action ? [action] : []);
  return (
    <div>
      <p className="text-[11px] font-semibold  tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-sm text-gray-800 ">{value}</p>
        {items.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={a.onClick}
            disabled={a.disabled}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InfoItem;