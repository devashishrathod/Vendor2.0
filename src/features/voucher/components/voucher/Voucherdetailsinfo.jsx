// src/components/voucher/VoucherDetailsInfo.jsx
// "Voucher Information" / "Which Outlet Applied This Voucher?" / "Search
// Tag" sections match the reference design exactly — real fields where
// confirmed, "Not Found" wherever the API genuinely has no value for that
// spot (never a fabricated number). Banner & Gallery / Offers / Review
// Timeline below stay as they were — real data already, not part of the
// requested redesign.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function SectionHeading({ children }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-900">
      {children}
    </h2>
  );
}

function Field({ label, value, action }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-900 mb-1">{label}</p>
      <p className="text-sm text-gray-900 break-all">{value ?? NOT_FOUND}</p>
      {action && <div className="mt-1 flex items-center gap-1.5">{action}</div>}
    </div>
  );
}

function ReviewStep({ label, at, by, colorClass = "text-gray-900" }) {
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

  const bannerUrl =
    voucher.voucher?.banner?.type === "IMAGE" ? voucher.voucher?.banner?.image?.url : null;
  const images = Array.isArray(voucher.images) ? voucher.images : [];
  const offers = Array.isArray(voucher.offers) ? voucher.offers : [];
  const tags = Array.isArray(voucher.tags) ? voucher.tags : [];
  const primaryOffer = offers[0];
  const selectedOutletCount = Array.isArray(voucher.subBrandIds) ? voucher.subBrandIds.length : 0;

  const goToEdit = () => navigate(`/vouchers/${voucher.voucherId}/edit`);

  return (
    <div className="divide-y divide-gray-100 bg-white">
      {/* Voucher Information */}
      <section className="p-6">
        <SectionHeading>Voucher Information</SectionHeading>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Field
            label="Voucher Id"
            value={voucher.voucherId ? `#${voucher.voucherId}` : NOT_FOUND}
            action={
              <button onClick={goToEdit} className="text-xs text-blue-500 hover:underline font-medium">
                Edit Voucher
              </button>
            }
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
      </section>

      {/* Which Outlet Applied This Voucher? */}
      <section className="p-6">
        <SectionHeading>Which Outlet Applied This Voucher?</SectionHeading>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
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
      </section>

      {/* Search Tag */}
      <section className="p-6">
        <SectionHeading>Search Tag</SectionHeading>
        <p className="mt-1 text-xs text-gray-400">
          Keywords that help users quickly find this item. Add keywords to improve search visibility.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
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
      </section>

      {/* Banner & Gallery */}
      {(bannerUrl || images.length > 0) && (
        <section className="p-6">
          <SectionHeading>Banner &amp; Gallery</SectionHeading>
          <div className="mt-4 flex flex-wrap gap-3">
            {bannerUrl && (
              <div className="relative">
                <img
                  src={bannerUrl}
                  alt="Banner"
                  className="h-24 w-24 rounded-xl border border-gray-100 object-cover"
                />
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Banner
                </span>
              </div>
            )}
            {images
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((img) => (
                <img
                  key={img._id}
                  src={img.url}
                  alt=""
                  className="h-24 w-24 rounded-xl border border-gray-100 object-cover"
                />
              ))}
          </div>
        </section>
      )}

      {/* Offers */}
      {offers.length > 0 && (
        <section className="p-6">
          <SectionHeading>Offers</SectionHeading>
          <div className="mt-4 space-y-4">
            {offers.map((offer) => (
              <div
                key={offer._id}
                className="rounded-xl border border-gray-100 p-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4"
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
        </section>
      )}

      {/* Review Timeline */}
      <section className="p-6">
        <SectionHeading>Review Timeline</SectionHeading>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
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
      </section>
    </div>
  );
}
