
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Percent,
  Plus,
  Store,
  Tag,
  Ticket,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuthStore } from "../../../onboarding/store/authStore";
import ErrorToast from "@/components/common/ErrorToast";
import SuccessToast from "@/components/common/SuccessToast";
import VoucherOutletPickerModal from "./VoucherOutletPickerModal";
import TimePickerAmPm from "./TimePickerAmPm";

const inputBase =
  "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors " +
  "placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

// ── UI-only helpers ──────────────────────────────────────────────

function SectionCard({ icon: Icon, title, subtitle, action, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
              <Icon className="h-4.5 w-4.5 text-emerald-500" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }) {
  return <label className="mb-1.5 block text-xs font-medium text-gray-500">{children}</label>;
}

// One row inside the repeatable "Offers" section. Field names match the
// confirmed Postman `offers` shape 1:1 — title, minBillAmount,
// discountType, discountValue, maxDiscountAmount, usageType,
// discountApplicableOn, sortOrder (auto), isActive.
function OfferCard({ offer, index, onChange, onRemove, canRemove }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-600">
          Offer {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel>Title</FieldLabel>
          <input
            required
            value={offer.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="10% OFF"
            className={inputBase}
          />
        </div>

        <div>
          <FieldLabel>Min Bill Amount</FieldLabel>
          <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition-colors focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            <span className="mr-1 text-sm text-gray-400">₹</span>
            <input
              required
              type="number"
              value={offer.minBillAmount}
              onChange={(e) => onChange("minBillAmount", e.target.value)}
              placeholder="500"
              className="w-full text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Discount Type</FieldLabel>
          <select
            value={offer.discountType}
            onChange={(e) => onChange("discountType", e.target.value)}
            className={inputBase}
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FLAT">Flat</option>
          </select>
        </div>

        <div>
          <FieldLabel>
            Discount Value {offer.discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
          </FieldLabel>
          <input
            required
            type="number"
            value={offer.discountValue}
            onChange={(e) => onChange("discountValue", e.target.value)}
            placeholder={offer.discountType === "PERCENTAGE" ? "10" : "100"}
            className={inputBase}
          />
        </div>

        <div>
          <FieldLabel>Max Discount Amount</FieldLabel>
          <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition-colors focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            <span className="mr-1 text-sm text-gray-400">₹</span>
            <input
              type="number"
              value={offer.maxDiscountAmount}
              onChange={(e) => onChange("maxDiscountAmount", e.target.value)}
              placeholder="100"
              className="w-full text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Usage Type</FieldLabel>
          <select
            value={offer.usageType}
            onChange={(e) => onChange("usageType", e.target.value)}
            className={inputBase}
          >
            <option value="ONCE_PER_USER">Single use per user</option>
            <option value="MULTIPLE">Multiple use until expiry</option>
          </select>
        </div>

        <div>
          <FieldLabel>Discount Applicable On</FieldLabel>
          <select
            value={offer.discountApplicableOn}
            onChange={(e) => onChange("discountApplicableOn", e.target.value)}
            className={inputBase}
          >
            <option value="SUBTOTAL">Subtotal</option>
            <option value="FINAL_BILL">Final Bill</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={offer.isActive}
              onChange={(e) => onChange("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Active
          </label>
        </div>
      </div>
    </div>
  );
}

export default function VoucherForm({
  mode = "add",
  form,
  setField,
  setOutletField,
  setSelectedOutlets,
  addOffer,
  removeOffer,
  setOfferField,
  addImages,
  removeImage,
  removeExistingImage,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  handleTagKeyDown,
  isSubmitting,
  uploadProgress,
  error,
  clearError,
  successMessage,
  clearSuccessMessage,
  onSubmit,
}) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const [isOutletPickerOpen, setIsOutletPickerOpen] = useState(false);
  const sessionBrandId = useAuthStore((s) => s.user?.brandId);
  const brandId = form.brandId || sessionBrandId;

  // Edit mode has no banner section on this form at all (banners are
  // managed by VoucherBannerModal instead), so it's never gated. Add mode
  // requires a banner matching whichever bannerType is currently selected.
  const isBannerUploaded =
    isEdit ||
    (form.bannerType === "IMAGE" && !!form.bannerImage) ||
    (form.bannerType === "VIDEO" && !!form.bannerVideo?.trim()) ||
    (form.bannerType === "GIF" && !!form.bannerGif?.trim());

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/vouchers")}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
          <Ticket className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">
            {isEdit ? "Edit Voucher & Discount" : "Add Voucher & Discount"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Add your listings and create attractive discounts to increase visibility,
            customer engagement, and sales growth.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Voucher Name */}
        <SectionCard icon={Ticket} title="Voucher Name" subtitle="How this voucher appears to customers.">
          <input
            required
            value={form.voucherName}
            onChange={(e) => setField("voucherName", e.target.value)}
            placeholder="Enter Your Voucher Name"
            className={inputBase}
          />

          <div className="mt-4">
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Get exciting discounts on summer fashion collection."
              rows={3}
              className={`${inputBase} resize-y`}
            />
          </div>

          {/* Banner — add mode only, now placed ABOVE Voucher Images per
              explicit instruction. Changing an existing voucher's banner is
              handled entirely by VoucherBannerModal.jsx (opened from
              VoucherTable), not by this form — editing a voucher never
              shows this section. */}
          {!isEdit && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <FieldLabel>Voucher Banner</FieldLabel>

              <select
                value={form.bannerType}
                onChange={(e) => setField("bannerType", e.target.value)}
                className={`${inputBase} mb-3 max-w-[160px]`}
              >
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="GIF">GIF</option>
              </select>

              {form.bannerType === "IMAGE" && (
                <div className="flex items-center gap-3">
                  {form.bannerImage && (
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-100">
                      <img
                        src={URL.createObjectURL(form.bannerImage)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/40">
                    <Upload className="h-4 w-4" />
                    <span className="text-[10px]">{form.bannerImage ? "Change" : "Add"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setField("bannerImage", e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              )}

              {form.bannerType === "VIDEO" && (
                <input
                  value={form.bannerVideo}
                  onChange={(e) => setField("bannerVideo", e.target.value)}
                  placeholder="Banner video URL"
                  className={inputBase}
                />
              )}

              {form.bannerType === "GIF" && (
                <input
                  value={form.bannerGif}
                  onChange={(e) => setField("bannerGif", e.target.value)}
                  placeholder="Banner GIF URL"
                  className={inputBase}
                />
              )}
            </div>
          )}

          {/* Images — now placed BELOW Voucher Banner per explicit
              instruction. Max 5 images total (existing + newly picked), at
              least 3 required. */}
          <div className="mt-5 border-t border-gray-100 pt-4">
            <FieldLabel>Voucher Images</FieldLabel>
            <p className="mb-2 text-xs text-gray-400">
              Upload 3 to 5 images for this voucher. At least 3 images are required.
            </p>

            <div className="flex flex-wrap gap-3">
              {form.existingImageUrls.map((url) => (
                <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-100">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {form.images.map((file, index) => (
                <div key={index} className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {form.existingImageUrls.length + form.images.length < 5 && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/40">
                  <Upload className="h-4 w-4" />
                  <span className="text-[10px]">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addImages(e.target.files)}
                  />
                </label>
              )}
            </div>

            <p className="mt-2 text-[11px] text-gray-400">
              {form.existingImageUrls.length + form.images.length} / 5 images added
            </p>

            {isSubmitting && uploadProgress > 0 && (
              <p className="mt-2 text-xs text-gray-400">Uploading… {uploadProgress}%</p>
            )}
          </div>
        </SectionCard>

        {/* Validity Date & Time */}
        <SectionCard
          icon={Calendar}
          title="Voucher Validity Date & Time"
          subtitle="The voucher expires automatically after the selected end time."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Selected Start Date</FieldLabel>
              <div className="flex gap-2">
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  className={inputBase}
                />
                <TimePickerAmPm
                  value={form.startTime}
                  onChange={(value) => setField("startTime", value)}
                  className="w-32 flex-shrink-0"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Selected End Date</FieldLabel>
              <div className="flex gap-2">
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  className={inputBase}
                />
                <TimePickerAmPm
                  value={form.endTime}
                  onChange={(value) => setField("endTime", value)}
                  className="w-32 flex-shrink-0"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Discount & Offer Details — repeatable, matches the confirmed
            Postman `offers` array 1:1. Click "+ Add Offer" to attach
            another discount to the same voucher. */}
        <SectionCard
          icon={Percent}
          title="Voucher Available Discount & Offers Details"
          subtitle="Redeemable at the selected outlet before the expiry date."
          action={
            <button
              type="button"
              onClick={addOffer}
              className="flex flex-shrink-0 items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Offer
            </button>
          }
        >
          <div className="space-y-4">
            {form.offers.map((offer, index) => (
              <OfferCard
                key={index}
                offer={offer}
                index={index}
                canRemove={form.offers.length > 1}
                onRemove={() => removeOffer(index)}
                onChange={(field, value) => setOfferField(index, field, value)}
              />
            ))}
          </div>
        </SectionCard>

        {/* Applicable outlets — "+ Add More" opens the outlet picker modal */}
        <SectionCard icon={Store} title="Applicable To Specifically Selected Outlet Or Franchise">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <FieldLabel>Selected Brand - Outlet / Sub-Brand</FieldLabel>
              <p className="text-sm font-bold text-gray-900">
                Count - {form.applicableOutlets.selectedBrandOutletCount}
              </p>
              <button
                type="button"
                onClick={() => setIsOutletPickerOpen(true)}
                className="mt-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                + Add More
              </button>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <FieldLabel>Total Outlet's</FieldLabel>
              <p className="text-sm font-bold text-gray-900">
                Count - {form.applicableOutlets.totalOutletsCount}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <FieldLabel>Sub - Brand</FieldLabel>
              <p className="text-sm font-bold text-gray-900">
                Count - {form.applicableOutlets.subBrandCount}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <FieldLabel>Franchise</FieldLabel>
              <p className="text-sm font-bold text-gray-900">
                Count - {String(form.applicableOutlets.franchiseCount).padStart(2, "0")}
              </p>
            </div>
          </div>

          <VoucherOutletPickerModal
            isOpen={isOutletPickerOpen}
            onClose={() => setIsOutletPickerOpen(false)}
            brandId={brandId}
            selectedIds={form.selectedOutletIds}
            onConfirm={setSelectedOutlets}
          />
        </SectionCard>

        {/* Search tags */}
        <SectionCard
          icon={Tag}
          title="Search Tag"
          subtitle="Keywords that help users quickly find this item."
        >
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 p-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            {form.searchTags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-emerald-400 hover:text-emerald-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              placeholder="Type here..."
              className="min-w-[120px] flex-1 border-none text-xs text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
        </SectionCard>

        {/* Publishing (Save as draft) — commented out per explicit
            instruction, not deleted, in case it needs to come back.
        <SectionCard icon={ImagePlus} title="Publishing">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.isSaveAsDraft}
              onChange={(e) => setField("isSaveAsDraft", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Save as draft instead of publishing immediately.
          </label>
        </SectionCard>
        */}

        {/* Final submit only appears once the voucher banner is uploaded
            (add mode) — editing skips this gate since edit mode has no
            banner section here at all (that's VoucherBannerModal's job). */}
        {isBannerUploaded ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold tracking-wide text-white shadow-sm shadow-emerald-100 transition-all duration-200 hover:bg-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                Confirm &amp; Proceed
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <p className="text-center text-xs text-gray-400">
            Upload a voucher banner above to continue.
          </p>
        )}
      </form>

      <ErrorToast error={error ? { message: error } : null} onDismiss={clearError} />
      <SuccessToast message={successMessage} onDismiss={clearSuccessMessage} />
    </div>
  );
}
