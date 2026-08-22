// src/components/voucher/VoucherCustomerFlowChart.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function VoucherCustomerFlowChart({ customerFlowWeekly }) {
  const data = (customerFlowWeekly?.days || []).map((day, index) => ({
    day,
    current: customerFlowWeekly.current?.[index] ?? 0,
    last: customerFlowWeekly.last?.[index] ?? 0,
  }));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Customer Flow Analysis</h2>
          <p className="mt-1 text-xs text-gray-500">
            Vendor Customer Flow Analysis shows how customers interact with a vendor
            listing from first view to final conversion.
          </p>
        </div>
        <button className="text-xs font-medium text-indigo-600 hover:underline">
          Week Analysis
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-900" /> Current Week
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-200" /> Last Week
        </span>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="last" fill="#bae6fd" radius={[4, 4, 0, 0]} />
            <Bar dataKey="current" fill="#0f172a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}