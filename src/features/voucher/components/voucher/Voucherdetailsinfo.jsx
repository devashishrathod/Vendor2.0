// src/components/voucher/VoucherDetailsInfo.jsx
// Rebuilt against the CONFIRMED real response of GET /vouchers/get/:voucherId:
//   { voucher, brand, currentVersion, publishedVersion, versions, versionCount, stats }
// `details` below is that whole object — voucherDoc = details.voucher,
// version = details.currentVersion. Every field read here traces back to a
// real key in that response; anywhere the API genuinely has no value shows
// "Not Found" rather than a fabricated number. The old "Which Outlet
// Applied" section used to make its own GET /subBrands/get-all call just to
// get an outlet count — the real response already carries the actual
// attached outlets (with location/type/etc.) plus outletCount/
// liveOutletCount/totalBrandOutlets, so that extra fetch is gone.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Store, Search, Image as ImageIcon, Percent, History, X, ZoomIn, Clock, AlertTriangle, MapPin, CheckCircle2 } from "lucide-react";

const NOT_FOUND = "Not Found";

// Outlet descriptions come back as one run-on string with several distinct
// marketing lines mashed together, no real delimiter between them (e.g.
// "...60% Off* Exciting Offers..."). Splitting on a sentence-ending
// character (. * !) followed by whitespace and a capital letter breaks
// it back into its natural lines for display — the underlying text itself
// is never changed, only how it's laid out.
function splitDescriptionLines(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.*!])\s+(?=[A-Z])/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatDate(iso) {
  if (!iso) return NOT_FOUND;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NOT_FOUND;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatINR(n) {
  if (n == null) return NOT_FOUND;
  return `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Offer color coding ── one accent per discountType, consistent
// everywhere an offer shows up (the card's badge, border and icon tile).
const OFFER_THEME = {
  FLAT: {
    badge: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    icon: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
    row: "border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/[0.04]",
  },
  PERCENTAGE: {
    badge: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    icon: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
    row: "border-amber-300 dark:border-amber-500/50 bg-amber-50/30 dark:bg-amber-500/[0.04]",
  },
};
const DEFAULT_OFFER_THEME = {
  badge: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  icon: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300",
  row: "border-gray-300 dark:border-gray-600 bg-gray-50/60 dark:bg-gray-900/30",
};

function offerHeadline(offer) {
  if (!offer) return NOT_FOUND;
  return offer.discountType === "PERCENTAGE" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`;
}

const WEEK_DAYS = [
  ["monday", "Mon"],
  ["tuesday", "Tue"],
  ["wednesday", "Wed"],
  ["thursday", "Thu"],
  ["friday", "Fri"],
  ["saturday", "Sat"],
  ["sunday", "Sun"],
];

const OUTLET_TYPE_THEME = {
  OUTLET: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  FRANCHISE: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
};

// Icon-tile card header (matching the pattern used across Outlet Details/
// Settings/Subscription elsewhere in the app) instead of a bare uppercase
// heading floating directly on the white background.
function SectionCard({ icon: Icon, iconBg = "bg-emerald-50", iconText = "text-emerald-500", title, subtitle, children }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconText}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, value, action }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100 break-all">{value ?? NOT_FOUND}</p>
      {action && <div className="mt-1 flex items-center gap-1.5">{action}</div>}
    </div>
  );
}

// Full-size click-to-view modal for the Banner & Gallery thumbnails —
// read-only preview (no replace/delete/edit, unlike the brand Showcase
// media modals), just so a vendor can see the actual voucher image clearly.
function ImageViewModal({ src, label, kind, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end p-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex justify-center bg-gray-50 dark:bg-gray-700 p-5">
          {kind === "VIDEO" ? (
            <video src={src} controls className="max-h-[70vh] rounded-xl" />
          ) : (
            <img src={src} alt={label || "Voucher image"} className="max-h-[70vh] rounded-xl object-contain" />
          )}
        </div>
        {label && <p className="px-4 py-3 text-center text-xs text-gray-500">{label}</p>}
      </div>
    </div>
  );
}

function ReviewStep({ label, at, by, colorClass = "text-gray-900 dark:text-gray-100" }) {
  if (!at) return null;
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-medium ${colorClass}`}>{formatDate(at)}</p>
      {by && <p className="text-xs text-gray-400">by {by.name || by.username || by.whatsappNumber || by.role}</p>}
    </div>
  );
}

export default function VoucherDetailsInfo({ details }) {
  const navigate = useNavigate();
  const [viewImage, setViewImage] = useState(null); // { src, label, kind } | null — Banner & Gallery "view" modal

  const voucherDoc = details?.voucher;
  const version = details?.currentVersion;

  if (!voucherDoc || !version) return null;

  // Confirmed shape: banner lives on the voucher doc itself — { current,
  // pending, status, rejectionReason, reviewedBy, reviewedAt }. `current`
  // is whatever's actually live/approved right now; a newly submitted
  // banner sits in `pending` under admin review and never replaces
  // `current` until approved.
  const bannerInfo = voucherDoc.banner;
  const currentBanner = bannerInfo?.current;
  const pendingBanner = bannerInfo?.status === "PENDING" ? bannerInfo?.pending : null;
  const bannerRejected = bannerInfo?.status === "REJECTED";
  const bannerUrl = currentBanner?.url || null;
  const bannerKind = currentBanner?.kind;

  const images = Array.isArray(version.images) ? version.images : [];
  const offers = Array.isArray(version.offers) ? version.offers : [];
  const tags = Array.isArray(voucherDoc.tags) ? voucherDoc.tags : [];
  const outlets = Array.isArray(version.outlets) ? version.outlets : [];
  const primaryOffer = offers[0];

  const goToEdit = () => navigate(`/vouchers/${voucherDoc._id}/edit`);

  return (
    <div className="space-y-4">
      {/* Voucher Information */}
      <SectionCard icon={Tag} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconText="text-emerald-500 dark:text-emerald-400" title="Voucher Information">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Field
            label="Voucher Code"
            value={voucherDoc.voucherCode}
            action={
              <button onClick={goToEdit} className="text-xs text-blue-500 hover:underline font-medium">
                Edit Voucher
              </button>
            }
          />
          <Field label="Version" value={version.versionCode} />
          <Field label="Voucher Name" value={voucherDoc.name} />
          <Field label="Category" value={version.category?.name} />
          <Field label="Sub-Category" value={version.subCategory?.name} />
          <Field label="Live From" value={formatDate(version.startAt)} />
          <Field label="Expires" value={formatDate(version.endAt)} />
          <Field label="Top Offer" value={primaryOffer?.title} />
          <Field
            label="Voucher Status"
            value={
              <span className={voucherDoc.status === "PUBLISHED" || voucherDoc.status === "APPROVED" ? "text-emerald-600 font-semibold" : ""}>
                {voucherDoc.status || NOT_FOUND}
              </span>
            }
          />
        </div>
        {voucherDoc.description && (
          <p className="mt-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{voucherDoc.description}</p>
        )}
      </SectionCard>

      {/* Which Outlet Applied This Voucher? */}
      <SectionCard icon={Store} iconBg="bg-sky-50" iconText="text-sky-500" title="Which Outlet Applied This Voucher?">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 mb-5">
          <Field
            label="Applied Outlets"
            value={`Count - ${String(version.outletCount ?? outlets.length).padStart(2, "0")}`}
            action={
              <button onClick={goToEdit} className="text-xs text-blue-500 hover:underline font-medium">
                Increase - Decrease
              </button>
            }
          />
          <Field
            label="Live Outlets"
            value={version.liveOutletCount != null ? `Count - ${String(version.liveOutletCount).padStart(2, "0")}` : NOT_FOUND}
          />
          <Field
            label="Total Brand Outlets"
            value={version.totalBrandOutlets != null ? `Count - ${String(version.totalBrandOutlets).padStart(2, "0")}` : NOT_FOUND}
          />
          <Field
            label="Applied On All Outlets?"
            value={version.isAppliedOnAllOutlets == null ? NOT_FOUND : version.isAppliedOnAllOutlets ? "Yes" : "No"}
          />
        </div>
        {outlets.length > 0 && (
          <div className="space-y-3">
            {outlets.map((outlet) => (
              <div
                key={outlet._id}
                className="rounded-xl border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {outlet.logo ? (
                      <img src={outlet.logo} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                    ) : (
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${OUTLET_TYPE_THEME[outlet.outletType] || DEFAULT_OFFER_THEME.icon}`}>
                        <Store size={14} />
                      </span>
                    )}
                    <div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${OUTLET_TYPE_THEME[outlet.outletType] || DEFAULT_OFFER_THEME.badge}`}>
                        {outlet.outletType || NOT_FOUND}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">{outlet.uniqueId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${outlet.isActive
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                    >
                      {outlet.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">{outlet.storeId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 mb-3">
                  <Field label="WhatsApp Number" value={outlet.whatsappNumber} />
                  <Field label="Email" value={outlet.email} />
                  <Field label="Mobile" value={outlet.mobile} />
                  <Field label="Joined Date" value={formatDate(outlet.joinedDate)} />
                </div>

                <p className="mb-2 flex items-start gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  {outlet.location?.formattedAddress || outlet.location?.city || NOT_FOUND}
                </p>

                {outlet.description && (
                  <div className="mb-3 flex flex-wrap gap-1.5 border-t border-gray-100 dark:border-gray-700 pt-3">
                    {splitDescriptionLines(outlet.description).map((line, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-gray-50 dark:bg-gray-700 px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-300"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                )}

                {outlet.workHours && (
                  <div className="flex flex-wrap gap-1.5 border-t border-gray-100 dark:border-gray-700 pt-3">
                    {WEEK_DAYS.map(([key, label]) => {
                      const day = outlet.workHours[key];
                      return (
                        <span
                          key={key}
                          className={`rounded-md px-2 py-1 text-[10px] font-medium ${day?.isOpen
                            ? "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            : "bg-gray-50/60 dark:bg-gray-700/40 text-gray-300 dark:text-gray-500"
                            }`}
                        >
                          {label} {day?.isOpen ? `${day.start}–${day.end}` : "Closed"}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Search Tag */}
      <SectionCard
        icon={Search}
        iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        iconText="text-emerald-500 dark:text-emerald-400"
        title="Search Tag"
        subtitle="Keywords that help users quickly find this item."
      >
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{NOT_FOUND}</p>
        )}
      </SectionCard>

      {/* Banner & Gallery */}
      {(bannerUrl || pendingBanner || bannerRejected || images.length > 0) && (
        <SectionCard icon={ImageIcon} iconBg="bg-amber-50" iconText="text-amber-500" title="Banner & Gallery">
          {pendingBanner && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-3.5 py-3">
              <Clock size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Banner Pending Review</p>
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400/80">
                  Your new banner is awaiting admin approval. Customers still see the current banner until it's approved.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewImage({ src: pendingBanner.url, label: "Pending Banner", kind: pendingBanner.kind })}
                className="shrink-0 overflow-hidden rounded-lg"
              >
                {pendingBanner.kind === "VIDEO" ? (
                  <video src={pendingBanner.url} muted playsInline preload="metadata" className="h-12 w-12 object-cover" />
                ) : (
                  <img src={pendingBanner.url} alt="" className="h-12 w-12 object-cover" />
                )}
              </button>
            </div>
          )}
          {bannerRejected && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 px-3.5 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Banner Rejected</p>
                <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400/80">
                  {bannerInfo?.rejectionReason || "Your submitted banner was rejected. Please submit a new one."}
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {bannerUrl && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setViewImage({ src: bannerUrl, label: "Banner", kind: bannerKind })}
                  className="group block h-24 w-24 overflow-hidden rounded-xl"
                >
                  {bannerKind === "VIDEO" ? (
                    <video src={bannerUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                    <ZoomIn size={18} className="text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </button>
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Banner
                </span>
              </div>
            )}
            {images
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((img, i) => (
                <button
                  type="button"
                  key={img._id}
                  onClick={() => setViewImage({ src: img.media?.url, label: `Gallery Image ${i + 1}`, kind: img.media?.kind })}
                  className="group relative block h-24 w-24 overflow-hidden rounded-xl"
                >
                  <img src={img?.media?.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                    <ZoomIn size={18} className="text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </button>
              ))}
          </div>
        </SectionCard>
      )}

      {/* Offers — a table, not a card grid, so it stays scannable however
          many offers a voucher ends up with. Each row is color-keyed to
          its discountType (indigo = FLAT, amber = PERCENTAGE) via a left
          accent border + a tinted row background, with the discount
          itself as a colored pill rather than a plain cell. */}
      {offers.length > 0 && (
        <SectionCard icon={Percent} iconBg="bg-rose-50" iconText="text-rose-500" title="Offers" subtitle={`${offers.length} offer${offers.length > 1 ? "s" : ""} on this voucher`}>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  <th className="pb-2 pl-3 font-bold">Offer</th>
                  <th className="pb-2 font-bold">Discount</th>
                  <th className="pb-2 font-bold">Min. Bill</th>
                  <th className="pb-2 font-bold">Max Discount Cap</th>
                  <th className="pb-2 font-bold">Usage</th>
                  <th className="pb-2 font-bold">Applies On</th>
                  <th className="pb-2 pr-3 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {offers
                  .slice()
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((offer) => {
                    const theme = OFFER_THEME[offer.discountType] || DEFAULT_OFFER_THEME;
                    return (
                      <tr key={offer._id} className={`border-l-4 ${theme.row}`}>
                        <td className="rounded-l-xl py-3 pl-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${theme.icon}`}>
                              {offer.discountType === "PERCENTAGE" ? <Percent size={14} /> : "₹"}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{offer.title}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${theme.badge}`}>
                            {offerHeadline(offer)}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatINR(offer.minBillAmount)}</td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatINR(offer.maxDiscountAmount)}</td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{offer.usageType || NOT_FOUND}</td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{offer.discountApplicableOn || NOT_FOUND}</td>
                        <td className="rounded-r-xl py-3 pr-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${offer.isActive
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                          >
                            {offer.isActive && <CheckCircle2 size={11} />}
                            {offer.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Review Timeline */}
      <SectionCard icon={History} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconText="text-emerald-500 dark:text-emerald-400" title="Review Timeline">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <ReviewStep label="Submitted" at={version.submittedAt} by={version.submittedBy} />
          <ReviewStep label="Reviewed" at={version.reviewedAt} by={version.reviewedBy} />
          <ReviewStep label="Approved" at={version.approvedAt} by={version.approvedBy} colorClass="text-emerald-600" />
          <ReviewStep label="Published" at={version.publishedAt} colorClass="text-emerald-600" />
          <ReviewStep label="Rejected" at={version.rejectedAt} by={version.rejectedBy} colorClass="text-rose-500" />
        </div>
        {version.rejectionReason && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
            Rejection reason: {version.rejectionReason}
          </p>
        )}
      </SectionCard>

      {viewImage && (
        <ImageViewModal src={viewImage.src} label={viewImage.label} kind={viewImage.kind} onClose={() => setViewImage(null)} />
      )}
    </div>
  );
}
