// src/components/voucher/VoucherOutletUsageTable.jsx
import React from "react";
import { Calendar, Download } from "lucide-react";

export default function VoucherOutletUsageTable({ title, outletUsage }) {
  const outletIds = outletUsage?.outletIds || [];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">
        Sub-Brand & Franchise Outlet Claimed Voucher Usage Report
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        This report provides a complete usage analysis of all sub-brands and franchise
        outlets connected to the platform. It helps track business growth, sales
        activity, customer activity, and outlet-wise earnings.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500">
        <span>
          Payment Transaction History &nbsp;|&nbsp; {title} &nbsp;|&nbsp; 25th Feb, 2026,
          12:00 AM – 26th Feb, 2026, 12:10 AM
        </span>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50">
            <Calendar className="h-3.5 w-3.5" />
            Feb 26, 2026
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">
            <Download className="h-3.5 w-3.5" />
            Export Data
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <tbody>
            <tr className="bg-indigo-50 text-gray-700">
              <th className="whitespace-nowrap px-3 py-2 font-medium">Store Type</th>
              {outletIds.map((outletId, index) => (
                <td key={`${outletId}-${index}`} className="whitespace-nowrap px-3 py-2 font-medium">
                  {outletId}
                </td>
              ))}
            </tr>
            <tr className="border-t border-gray-100">
              <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-700">
                Sub - Brand
              </th>
              {(outletUsage?.subBrand || []).map((value, index) => (
                <td key={index} className="whitespace-nowrap px-3 py-2 text-gray-600">
                  {value}
                </td>
              ))}
            </tr>
            <tr className="border-t border-gray-100 bg-gray-50">
              <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-700">
                Franchise Outlet
              </th>
              {(outletUsage?.franchiseOutlet || []).map((value, index) => (
                <td key={index} className="whitespace-nowrap px-3 py-2 text-gray-600">
                  {value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}