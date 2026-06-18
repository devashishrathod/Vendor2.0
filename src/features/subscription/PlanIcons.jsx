// ── Pie-style plan tab icons (matches original UI) ────────────────────────────
export const PieIcon = ({ fill = 0.5, size = 28 }) => {
  // fill: 0.25 = quarter, 0.5 = half, 0.75 = three-quarter, 1 = full
  const r = 10;
  const cx = 14;
  const cy = 14;

  if (fill >= 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28">
        <circle cx={cx} cy={cy} r={r} fill="#1e1b4b" />
      </svg>
    );
  }

  const angle = fill * 2 * Math.PI - Math.PI / 2;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  const largeArc = fill > 0.5 ? 1 : 0;

  const d = [
    `M ${cx} ${cy}`,
    `L ${cx} ${cy - r}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`,
    "Z",
  ].join(" ");

  return (
    <svg width={size} height={size} viewBox="0 0 28 28">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1.5"
      />
      <path d={d} fill={fill === 0.5 ? "#10b981" : "#1e1b4b"} />
    </svg>
  );
};

// ── Feature row icons ─────────────────────────────────────────────────────────
export const FeatureIcon = ({ name }) => {
  const cls = "w-4 h-4 text-gray-500";
  switch (name) {
    case "calendar":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "transaction":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
        </svg>
      );
    case "settlement":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      );
    case "brand":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      );
    case "franchise":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <path d="M12 7v4m0 0l-7 8m7-8l7 8" />
        </svg>
      );
    case "deal":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path d="M7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2h8z" />
        </svg>
      );
    case "voucher":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M2 12h3m14 0h3M12 6v12" />
        </svg>
      );
    case "support":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return null;
  }
};

export const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-emerald-500"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const CrossIcon = () => (
  <svg
    className="w-5 h-5 text-red-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
