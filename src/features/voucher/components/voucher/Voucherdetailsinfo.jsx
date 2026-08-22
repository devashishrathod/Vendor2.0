// src/components/voucher/VoucherDetailsInfo.jsx
import React from "react";

const formatCurrency = (value) =>
  `₹ ${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function SectionHeading({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-800">
      {children}
    </h2>
  );
}

function Field({ label, value, link, linkColor = "text-indigo-600" }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">
        {value}
        {link && (
          <>
            {" "}
            <button type="button" className={`text-xs font-medium hover:underline ${linkColor}`}>
              {link}
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export default function VoucherDetailsInfo({ voucher }) {
  if (!voucher) return null;

  return (
    <div className="divide-y divide-gray-100  bg-white">
      {/* Voucher Information */}
      <section className="p-6">
        <SectionHeading>Voucher Information</SectionHeading>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Field label="Voucher Id" value={`#${voucher.id}`} link="Edit Voucher" />
          <Field
            label="Voucher Name"
            value={
              <>
                {voucher.title}
                <span className="block text-xs font-normal text-gray-400">
                  Discount &amp; Offer
                </span>
              </>
            }
          />
          <Field label="Published Date" value={voucher.publishedDate} />
          <Field label="Expired" value={voucher.expiredDate} />

          <Field label="Tag Line" value={voucher.shortTitle} />
          <Field label="Best Value" value={formatCurrency(voucher.valueOfAmount)} />
          <Field label="Percentage" value={`${voucher.percentageOfDiscount || 0} %`} />
          <Field
            label="Voucher Status"
            value={<span className="text-indigo-600">{voucher.status}</span>}
          />
        </div>
      </section>

      {/* Which outlet applied this voucher */}
      <section className="p-6">
        <SectionHeading>Which Outlet Applied This Voucher?</SectionHeading>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Field
            label="Selected Brand - Outlet's / Sub - Brand"
            value={`Count - ${voucher.applicableOutlets?.selectedBrandOutletCount ?? 0}`}
            link="Increase - Decrease"
            linkColor="text-rose-500"
          />
          <Field
            label="Total Outlet's"
            value={`Count - ${voucher.applicableOutlets?.totalOutletsCount ?? 0}`}
          />
          <Field
            label="Sub - Brand"
            value={`Count - ${voucher.applicableOutlets?.subBrandCount ?? 0}`}
          />
          <Field
            label="Franchise"
            value={`Count - ${String(voucher.applicableOutlets?.franchiseCount ?? 0).padStart(2, "0")}`}
          />
        </div>
      </section>

      {/* Search tag */}
      <section className="p-6">
        <SectionHeading>Search Tag</SectionHeading>
        <p className="mt-1 text-xs text-gray-500">
          Keywords that help users quickly find this item. Add keywords to improve
          search visibility.
        </p>
        <div className="mt-4">
          <Field
            label="Selected Brand - Outlet's / Sub - Brand"
            value={`Count - ${String(voucher.searchTags?.length ?? 0).padStart(2, "0")}`}
            link="+ Add Tag Line"
          />
        </div>
      </section>

      {/* Configuration */}
      <section className="p-6">
        <SectionHeading>Configuration</SectionHeading>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Field label="Voucher Status" value="Pan Active" link="Active" />
          <div>
            <Field label="Voucher Action" value="Submission" link="Deleted Submission" linkColor="text-rose-500" />
            <p className="mt-2 text-[11px] leading-relaxed text-rose-500">
              Important Note: If you delete this action button, it will automatically
              change status. After that, this voucher will not be published on your
              next page.
            </p>
          </div>
          <Field label="Create On" value={voucher.createdDate} />
          <Field label="Create Ticket" value="Issue Reported" />
        </div>
      </section>

      {/* Information details */}
      <section className="p-6">
        <SectionHeading>Information Details</SectionHeading>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-gray-700">
              Exclusive For Prime Users
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              The TryDood team identifies which users ("Prime" or "Ordinary") can use
              this voucher.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">TryDood Wallet</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Any user can make a payment using this wallet, and the amount will be
              credited directly to your bank account through TryDood settlement.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">TryDood (T) Coin's</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Payment amounts converted to TryDood (T) Coin's, use them for discounts
              like membership, or TryDood Prime. These points do not affect your real
              money.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}