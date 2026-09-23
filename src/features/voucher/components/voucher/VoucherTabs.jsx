// src/components/voucher/VoucherTabs.jsx
import React from "react";

const TABS = ["Analysis Report", "Voucher Details", "Transaction Information"];

export default function VoucherTabs({ activeTab, onChange }) {
  return (
    <div className="flex gap-6 text-sm">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`-mb-px px-1 py-3 font-medium ${
            activeTab === tab
              ? "text-emerald-600"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}