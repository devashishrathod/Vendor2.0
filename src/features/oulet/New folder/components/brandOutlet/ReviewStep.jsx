import { WEEK_DAYS } from "../../constants/brandOutletConstants";

function to12h(t) {
  if (!t) return "";
  const [hStr, m] = t.split(":");
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 dark:text-gray-100 text-right break-words">{value || "—"}</span>
    </div>
  );
}

function ReviewCard({ title, onEdit, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <button type="button" onClick={onEdit} className="text-xs font-semibold text-emerald-600 hover:underline">
          Edit
        </button>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700">{children}</div>
    </div>
  );
}

/**
 * Read-only recap of everything already entered/saved across Step 1 & 2 —
 * no new state, no new API calls. "Create Outlet" reuses the exact same
 * `canFinalSave`/`onCreate` (= handleSave) the page already computed.
 */
export default function ReviewStep({
  logoUrl,
  brandName,
  brandEmail,
  mobile,
  categoryName,
  subCategoryName,
  outletWhatsapp,
  whatsappVerified,
  address,
  workingHours,
  showcaseAlbums,
  minItemsPerAlbum,
  canFinalSave,
  saving,
  onEditStep1,
  onEditStep2,
  onOpenAdvanced,
  onCreate,
}) {
  const incompleteAlbums = showcaseAlbums.filter((a) => a.media.length < minItemsPerAlbum);

  const firstDay = workingHours[WEEK_DAYS[0].key];
  const allSame = WEEK_DAYS.every((d) => {
    const cur = workingHours[d.key];
    return cur?.start === firstDay?.start && cur?.end === firstDay?.end && cur?.isOpen === firstDay?.isOpen;
  });

  const categoryValue = subCategoryName ? `${categoryName} › ${subCategoryName}` : categoryName;

  return (
    <div>
      <ReviewCard title="Brand Details" onEdit={onEditStep1}>
        <ReviewRow label="Brand" value={brandName} />
        {logoUrl && (
          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Logo</span>
            <img src={logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
          </div>
        )}
        <ReviewRow label="Email" value={brandEmail} />
        <ReviewRow label="Mobile" value={mobile} />
        <ReviewRow label="Category" value={categoryValue} />
      </ReviewCard>

      <ReviewCard title="Contact" onEdit={onEditStep2}>
        <ReviewRow label="Outlet WhatsApp" value={outletWhatsapp} />
        <div className="flex items-center justify-between gap-3 py-1.5">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status</span>
          {whatsappVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Verified
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-600">Not verified</span>
          )}
        </div>
      </ReviewCard>

      <ReviewCard title="Location" onEdit={onEditStep2}>
        <ReviewRow label="Address" value={address} />
      </ReviewCard>

      <ReviewCard title="Working Hours" onEdit={onEditStep2}>
        {allSame ? (
          <ReviewRow
            label="Every day"
            value={firstDay?.isOpen ? `${to12h(firstDay.start)} – ${to12h(firstDay.end)}` : "Closed"}
          />
        ) : (
          WEEK_DAYS.map((d) => {
            const v = workingHours[d.key];
            return (
              <ReviewRow
                key={d.key}
                label={d.label}
                value={v?.isOpen ? `${to12h(v.start)} – ${to12h(v.end)}` : "Closed"}
              />
            );
          })
        )}
      </ReviewCard>

      {incompleteAlbums.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 mb-4 text-sm text-amber-700 dark:text-amber-400">
          <p className="font-semibold mb-1">A few Showcase albums need more photos/videos:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {incompleteAlbums.map((a) => (
              <li key={a.id}>
                {a.name || "Untitled album"} — needs {minItemsPerAlbum - a.media.length} more
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onOpenAdvanced}
            className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
          >
            Go fix in Advanced Details →
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCreate}
          disabled={saving || !canFinalSave}
          className="px-8 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Create Outlet"}
        </button>
      </div>
    </div>
  );
}
