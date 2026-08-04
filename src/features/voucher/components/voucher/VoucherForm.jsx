// src/components/voucher/VoucherForm.jsx
// Full "Add / Edit Voucher & Discount" form, matching the multi-section
// design: name, validity, discount details, applicable outlets, search
// tags, and the two eligibility sections. Works for both add and edit —
// pass `mode` + the fields/handlers from useVoucherForm.
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";

function SectionLabel({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
      {children}
    </h3>
  );
}

function FieldLabel({ children }) {
  return <label className="mb-1.5 block text-xs font-medium text-gray-500">{children}</label>;
}

const USE_OPTIONS = [
  {
    value: "android_ios_membership",
    title: "Valid on Android & iOS - Membership Users",
    description:
      "This benefit is exclusively available for active membership users on both Android and iOS platforms.",
  },
  {
    value: "android_only",
    title: "Exclusive for Android Users",
    description: "This voucher can be used only on Android devices.",
  },
  {
    value: "ios_only",
    title: "Inclusive coupon code for iOS users",
    description: "This voucher is exclusively available for iOS users.",
  },
  {
    value: "membership_only",
    title: "Membership Users Only",
    description: "This voucher is available only to your Membership users.",
  },
];

const CLAIM_OPTIONS = [
  {
    value: "all_users",
    title: "Applicable across all users",
    description:
      "This benefit is exclusively available for all non-membership users on both Android and iOS platforms.",
  },
  {
    value: "membership_only",
    title: "Membership Users Only",
    description: "This benefit is available only to your Membership users.",
  },
];

function EligibilityRadioGroup({ options, selected, onSelect }) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            type="button"
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
              isSelected
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected ? "border-indigo-600" : "border-gray-300"
                }`}
              >
                {isSelected && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
              </span>
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  {option.title}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {option.description}
                </span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function VoucherForm({
  mode = "add",
  form,
  setField,
  setOutletField,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  handleTagKeyDown,
  isSubmitting,
  error,
  onSubmit,
}) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  return (
   <div>
    <DashboardHeader/>
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 rounded-md p-1 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Voucher & Discount" : "Add Voucher & Discount"}
          </h1>
          <p className="text-sm text-gray-500">
            Add your listings and create attractive discounts to increase visibility,
            customer engagement, and sales growth.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Voucher Name */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionLabel>Voucher Name</SectionLabel>
          <input
            required
            value={form.voucherName}
            onChange={(e) => setField("voucherName", e.target.value)}
            placeholder="Enter Your Voucher Name"
            className="mt-3 w-full border-b border-gray-200 pb-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-indigo-500"
          />
        </section>

        {/* Validity Date & Time */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionLabel>Voucher Validity Date & Time</SectionLabel>
          <p className="mt-1 text-xs text-gray-500">
            Set the start date and time and end date and time. The Voucher will expire
            automatically after the selected time.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Selected Start Date</FieldLabel>
              <div className="flex gap-2">
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setField("startTime", e.target.value)}
                  className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setField("endTime", e.target.value)}
                  className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Discount & Offer Details */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionLabel>Voucher Available Discount & Offers Details</SectionLabel>
          <p className="mt-1 text-xs text-gray-500">
            This voucher can be redeemed at the selected outlet before the expiry date.
            Please present the voucher code at the time of billing to avail the offer.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Short Title</FieldLabel>
              <input
                required
                value={form.shortTitle}
                onChange={(e) => setField("shortTitle", e.target.value)}
                placeholder="Flat 10% off up to 500"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <FieldLabel>Value Of Amount</FieldLabel>
              <div className="flex items-center rounded-lg border border-gray-200 px-3 py-2">
                <span className="mr-1 text-sm text-gray-400">₹</span>
                <input
                  required
                  type="number"
                  value={form.valueOfAmount}
                  onChange={(e) => setField("valueOfAmount", e.target.value)}
                  placeholder="1600.00"
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Percentage Of Discount</FieldLabel>
              <div className="flex overflow-hidden rounded-lg border border-gray-200">
                <input
                  required
                  type="number"
                  value={form.percentageOfDiscount}
                  onChange={(e) => setField("percentageOfDiscount", e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2 text-sm outline-none"
                />
                <span className="flex items-center bg-indigo-600 px-3 text-sm font-medium text-white">
                  % OFF
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.singleUsePerUser}
                onChange={(e) => setField("singleUsePerUser", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Enable this option to allow the Voucher to be used only once per user.
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.multipleUseUntilExpiry}
                onChange={(e) => setField("multipleUseUntilExpiry", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              This Voucher can be used multiple times until the end date or expiry date.
            </label>
          </div>
        </section>

        {/* Applicable outlets */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionLabel>Applicable To Specifically Selected Outlet Or Franchise</SectionLabel>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <FieldLabel>Selected Brand - Outlet / Sub-Brand</FieldLabel>
              <p className="text-sm font-medium text-gray-900">
                Count - {form.applicableOutlets.selectedBrandOutletCount}
              </p>
              <button
                type="button"
                onClick={() =>
                  setOutletField(
                    "selectedBrandOutletCount",
                    form.applicableOutlets.selectedBrandOutletCount + 1
                  )
                }
                className="mt-1 text-xs font-medium text-indigo-600 hover:underline"
              >
                + Add More
              </button>
            </div>
            <div>
              <FieldLabel>Total Outlet's</FieldLabel>
              <p className="text-sm font-medium text-gray-900">
                Count - {form.applicableOutlets.totalOutletsCount}
              </p>
            </div>
            <div>
              <FieldLabel>Sub - Brand</FieldLabel>
              <p className="text-sm font-medium text-gray-900">
                Count - {form.applicableOutlets.subBrandCount}
              </p>
            </div>
            <div>
              <FieldLabel>Franchise</FieldLabel>
              <p className="text-sm font-medium text-gray-900">
                Count - {String(form.applicableOutlets.franchiseCount).padStart(2, "0")}
              </p>
            </div>
          </div>
        </section>

        {/* Search tags */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionLabel>Search Tag</SectionLabel>
          <p className="mt-1 text-xs text-gray-500">
            Keywords that help users quickly find this item. Add keywords to improve
            search visibility.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-3">
            {form.searchTags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-gray-400 hover:text-gray-600"
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
              className="min-w-[120px] flex-1 border-none text-xs outline-none placeholder:text-gray-400"
            />
          </div>
        </section>

        {/* Who can use */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionLabel>Select Who Can Use This Voucher.</SectionLabel>
          <p className="mt-1 text-xs text-gray-500">
            Choose the eligible customers who are allowed to use this voucher. Only
            selected users can apply this offer.
          </p>
          <div className="mt-4">
            <EligibilityRadioGroup
              options={USE_OPTIONS}
              selected={form.whoCanUse}
              onSelect={(value) => setField("whoCanUse", value)}
            />
          </div>
        </section>

        {/* Who can claim */}
        {/* <section className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionLabel>Select Who Can Claimed This Voucher.</SectionLabel>
          <p className="mt-1 text-xs text-gray-500">
            Choose the eligible customers who are allowed to use this coupon code. Only
            selected users can apply this offer.
          </p>
          <div className="mt-4">
            <EligibilityRadioGroup
              options={CLAIM_OPTIONS}
              selected={form.whoCanClaim}
              onSelect={(value) => setField("whoCanClaim", value)}
            />
          </div>
        </section> */}

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-700 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Confirm & Proceed"}
        </button>
      </form>
    </div>
   </div> 
  );
}