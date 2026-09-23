// src/components/voucher/VoucherOutletUsageTable.jsx
import React from "react";
import { Calendar, Download } from "lucide-react";

export default function VoucherOutletUsageTable({ title, outletUsage }) {
  const outletIds = outletUsage?.outletIds || [];

  return (
    <section className="rounded-xl bg-white dark:bg-gray-800 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Sub-Brand & Franchise Outlet Claimed Voucher Usage Report
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        This report provides a complete usage analysis of all sub-brands and franchise
        outlets connected to the platform. It helps track business growth, sales
        activity, customer activity, and outlet-wise earnings.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-gray-500">
        <span>
          Payment Transaction History &nbsp;|&nbsp; {title} &nbsp;|&nbsp; 25th Feb, 2026,
          12:00 AM – 26th Feb, 2026, 12:10 AM
        </span>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-600">
            <Calendar className="h-3.5 w-3.5" />
            Feb 26, 2026
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700">
            <Download className="h-3.5 w-3.5" />
            Export Data
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[720px] text-left text-xs">
          <tbody>
            <tr className="bg-emerald-50 text-gray-700">
              <th className="whitespace-nowrap px-3 py-2 font-medium">Store Type</th>
              {outletIds.map((outletId, index) => (
                <td key={`${outletId}-${index}`} className="whitespace-nowrap px-3 py-2 font-medium">
                  {outletId}
                </td>
              ))}
            </tr>
            <tr className="">
              <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                Sub - Brand
              </th>
              {(outletUsage?.subBrand || []).map((value, index) => (
                <td key={index} className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300">
                  {value}
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="whitespace-nowrap px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                Franchise Outlet
              </th>
              {(outletUsage?.franchiseOutlet || []).map((value, index) => (
                <td key={index} className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300">
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