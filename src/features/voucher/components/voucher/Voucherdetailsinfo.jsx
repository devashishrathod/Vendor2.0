// src/components/voucher/VoucherDetailsInfo.jsx
// "Voucher Information" / "Which Outlet Applied This Voucher?" / "Search
// Tag" sections match the reference design exactly — real fields where
// confirmed, "Not Found" wherever the API genuinely has no value for that
// spot (never a fabricated number). Banner & Gallery / Offers / Review
// Timeline below stay as they were — real data already, not part of the
// requested redesign.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Store, Search, Image as ImageIcon, Percent, History, X, ZoomIn, Clock, AlertTriangle } from "lucide-react";
import { useOnboardingStore } from "../../../onboarding/store/onboardingStore";
import { useAuthStore } from "../../../onboarding/store/authStore";
import useBrandData from "../../../brand/hooks/useBrandData";
import { getSubBrands } from "../../services/voucher/VoucherService";

const NOT_FOUND = "Not Found";

function formatDate(iso) {
  if (!iso) return NOT_FOUND;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NOT_FOUND;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatINR(n) {
  return `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDiscount(offer) {
  if (!offer) return NOT_FOUND;
  return offer.discountType === "PERCENTAGE"
    ? `${offer.discountValue}% off`
    : `₹${offer.discountValue} off`;
}

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
      {by && <p className="text-xs text-gray-400">by {by.name || by.whatsappNumber || by.username}</p>}
    </div>
  );
}

export default function VoucherDetailsInfo({ voucher }) {
  const navigate = useNavigate();
  const [viewImage, setViewImage] = useState(null); // { src, label } | null — Banner & Gallery "view" modal

  // Same brandId-resolution pattern as useVoucher.js — needed to fetch
  // this brand's real sub-brand/outlet counts for the "Which Outlet
  // Applied This Voucher?" section below.
  const onboardingBrandId = useOnboardingStore((s) => s.formData.brandId);
  const authUserBrandId = useAuthStore((s) => s.user?.brandId);
  const candidateBrandId = voucher?.brandId || onboardingBrandId || authUserBrandId;
  const { data: brand } = useBrandData(candidateBrandId);
  const resolvedBrandId = brand?._id || candidateBrandId;

  // GET /subBrands/get-all?brandId= — real outlet count for the whole
  // brand, split by outletType (outlet = "Sub-Brand", franchise =
  // "Franchise" in this page's labels). limit:200 is a pragmatic upper
  // bound to count client-side in one call rather than paginating; if a
  // brand genuinely has more outlets than that, this undercounts — the
  // "Total Outlet's" figure itself still comes straight from the API's
  // own `total`, so only the Sub-Brand/Franchise split could be affected.
  const [outletCounts, setOutletCounts] = useState(null);
  useEffect(() => {
    if (!resolvedBrandId) return;
    let cancelled = false;
    getSubBrands({ brandId: resolvedBrandId, limit: 200 })
      .then((res) => {
        if (cancelled) return;
        const list = res?.data?.data ?? [];
        setOutletCounts({
          total: res?.data?.total ?? list.length,
          subBrand: list.filter((o) => o.outletType === "outlet").length,
          franchise: list.filter((o) => o.outletType === "franchise").length,
        });
      })
      .catch((err) => console.error("Failed to load outlet counts:", err.message));
    return () => { cancelled = true; };
  }, [resolvedBrandId]);

  if (!voucher) return null;

  // Confirmed shape (vendor_panel_api_doc.md #59, V-4): banner is
  // { current, pending, status, rejectionReason, reviewedBy, reviewedAt }.
  // `current` is whatever's actually live/approved right now; a newly
  // submitted banner sits in `pending` under admin review and never
  // replaces `current` until approved.
  const bannerInfo = voucher.voucher?.banner;
  const currentBanner = bannerInfo?.current;
  const pendingBanner = bannerInfo?.status === "PENDING" ? bannerInfo?.pending : null;
  const bannerRejected = bannerInfo?.status === "REJECTED";
  const bannerUrl = currentBanner?.url || null;
  const bannerKind = currentBanner?.kind;
  const images = Array.isArray(voucher.images) ? voucher.images : [];
  const offers = Array.isArray(voucher.offers) ? voucher.offers : [];
  const tags = Array.isArray(voucher.tags) ? voucher.tags : [];
  const primaryOffer = offers[0];
  const selectedOutletCount = Array.isArray(voucher.subBrandIds) ? voucher.subBrandIds.length : 0;

  const goToEdit = () => navigate(`/vouchers/${voucher.voucherId}/edit`);

  return (
    <div className="space-y-4">
      {/* Voucher Information */}
      <SectionCard icon={Tag} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconText="text-emerald-500 dark:text-emerald-400" title="Voucher Information">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Field
            label="Voucher Id"
            value={voucher.voucherId ? `#${voucher.voucherId}` : NOT_FOUND}
            action={
              <button onClick={goToEdit} className="text-xs text-blue-500 hover:underline font-medium">
                Edit Voucher
              </button>
            }
          />
          <Field
            label="Voucher Version Id"
            value={voucher.versionid || NOT_FOUND}
          />
          <Field label="Voucher Name" value={voucher.name} />
          <Field label="Published Date" value={formatDate(voucher.startAt)} />
          <Field label="Expired" value={formatDate(voucher.endAt)} />
          <Field label="Tag Line" value={primaryOffer?.title} />
          <Field label="Best Value" value={primaryOffer?.maxDiscountAmount != null ? formatINR(primaryOffer.maxDiscountAmount) : NOT_FOUND} />
          <Field label="Percentage" value={primaryOffer?.discountType === "PERCENTAGE" ? `${primaryOffer.discountValue} %` : NOT_FOUND} />
          <Field
            label="Voucher Status"
            value={
              <span className={voucher.status === "PUBLISHED" || voucher.status === "APPROVED" ? "text-emerald-600 font-semibold" : ""}>
                {voucher.status || NOT_FOUND}
              </span>
            }
          />
        </div>
      </SectionCard>

      {/* Which Outlet Applied This Voucher? */}
      <SectionCard icon={Store} iconBg="bg-sky-50" iconText="text-sky-500" title="Which Outlet Applied This Voucher?">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Field
            label="Selected Brand - Outlet's / Sub - Brand"
            value={`Count - ${String(selectedOutletCount).padStart(2, "0")}`}
            action={
              <button onClick={goToEdit} className="text-xs text-blue-500 hover:underline font-medium">
                Increase - Decrease
              </button>
            }
          />
          <Field
            label="Total Outlet's"
            value={outletCounts ? `Count - ${String(outletCounts.total).padStart(2, "0")}` : NOT_FOUND}
          />
          <Field
            label="Sub - Brand"
            value={outletCounts ? `Count - ${String(outletCounts.subBrand).padStart(2, "0")}` : NOT_FOUND}
          />
          <Field
            label="Franchise"
            value={outletCounts ? `Count - ${String(outletCounts.franchise).padStart(2, "0")}` : NOT_FOUND}
          />
        </div>
      </SectionCard>

      {/* Search Tag */}
      <SectionCard
        icon={Search}
        iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        iconText="text-emerald-500 dark:text-emerald-400"
        title="Search Tag"
        subtitle="Keywords that help users quickly find this item. Add keywords to improve search visibility."
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Field
            label="Selected Brand - Outlet's / Sub - Brand"
            value={`Count - ${String(tags.length).padStart(2, "0")}`}
            action={
              <button onClick={goToEdit} className="text-xs text-blue-500 hover:underline font-medium">
                Add Tag Line
              </button>
            }
          />
        </div>
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
                  {voucher.voucher?.banner?.rejectionReason || "Your submitted banner was rejected. Please submit a new one."}
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
                  onClick={() => setViewImage({ src: img.url, label: `Gallery Image ${i + 1}` })}
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

      {/* Offers */}
      {offers.length > 0 && (
        <SectionCard icon={Percent} iconBg="bg-rose-50" iconText="text-rose-500" title="Offers">
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer._id}
                className="rounded-xl p-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4"
              >
                <Field label="Title" value={offer.title} />
                <Field label="Discount" value={formatDiscount(offer)} />
                <Field label="Min Bill Amount" value={`₹${offer.minBillAmount ?? 0}`} />
                <Field label="Max Discount Cap" value={`₹${offer.maxDiscountAmount ?? 0}`} />
                <Field label="Usage Type" value={offer.usageType} />
                <Field label="Applicable On" value={offer.discountApplicableOn} />
                <Field label="Active" value={offer.isActive ? "Yes" : "No"} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Review Timeline */}
      <SectionCard icon={History} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconText="text-emerald-500 dark:text-emerald-400" title="Review Timeline">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <ReviewStep label="Submitted" at={voucher.submittedAt} by={voucher.submittedByUser} />
          <ReviewStep label="Reviewed" at={voucher.reviewedAt} by={voucher.reviewedByUser} />
          <ReviewStep label="Approved" at={voucher.approvedAt} by={voucher.approvedByUser} colorClass="text-emerald-600" />
          <ReviewStep label="Rejected" at={voucher.rejectedAt} by={voucher.rejectedByUser} colorClass="text-rose-500" />
        </div>
        {voucher.rejectionReason && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
            Rejection reason: {voucher.rejectionReason}
          </p>
        )}
      </SectionCard>

      {viewImage && (
        <ImageViewModal src={viewImage.src} label={viewImage.label} kind={viewImage.kind} onClose={() => setViewImage(null)} />
      )}
    </div>
  );
}
