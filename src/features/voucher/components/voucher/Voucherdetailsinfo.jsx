// src/components/voucher/VoucherDetailsInfo.jsx
// Renders the real GET /vouchers/versions/get-all?voucherId= response as-is
// — every field below maps 1:1 to a confirmed field on the version object
// (see useVoucherDetails.js). No fabricated analytics/outlet-usage data.

function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDiscount(offer) {
  if (!offer) return "—";
  return offer.discountType === "PERCENTAGE"
    ? `${offer.discountValue}% off`
    : `₹${offer.discountValue} off`;
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-800">
      {children}
    </h2>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value ?? "—"}</p>
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
  if (!voucher) return null;

  const bannerUrl =
    voucher.voucher?.banner?.type === "IMAGE" ? voucher.voucher?.banner?.image?.url : null;
  const images = Array.isArray(voucher.images) ? voucher.images : [];
  const offers = Array.isArray(voucher.offers) ? voucher.offers : [];
  const tags = Array.isArray(voucher.tags) ? voucher.tags : [];

  return (
    <div className="divide-y divide-gray-100 bg-white">
      {/* Voucher Information */}
      <section className="p-6">
        <SectionHeading>Voucher Information</SectionHeading>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Field label="Voucher Name" value={voucher.name} />
          <Field label="Version" value={voucher.versionCode} />
          <Field label="Category" value={voucher.category?.name} />
          <Field label="Sub-category" value={voucher.subCategory?.name} />
          <Field label="Valid From" value={formatDate(voucher.startAt)} />
          <Field label="Valid Till" value={formatDate(voucher.endAt)} />
          <Field label="Created On" value={formatDate(voucher.createdAt)} />
          <Field label="Voucher Status" value={voucher.status} />
        </div>
        {voucher.description && (
          <div className="mt-6">
            <p className="text-xs text-gray-400">Description</p>
            <p className="mt-1 text-sm text-gray-700">{voucher.description}</p>
          </div>
        )}
      </section>

      {/* Tags */}
      {tags.length > 0 && (
        <section className="p-6">
          <SectionHeading>Search Tags</SectionHeading>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

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
