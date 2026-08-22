// src/components/voucher/VoucherTabs.jsx
import React from "react";

const TABS = ["Analysis Report", "Voucher Details", "Transaction Information"];

export default function VoucherTabs({ activeTab, onChange }) {
  return (
    <div className="flex gap-6 border-b border-gray-200 text-sm">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`-mb-px border-b-2 px-1 py-3 font-medium ${
            activeTab === tab
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}