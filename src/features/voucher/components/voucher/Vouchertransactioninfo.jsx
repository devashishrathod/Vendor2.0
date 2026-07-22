// src/components/voucher/VoucherTransactionInfo.jsx
import React from "react";

const formatCurrency = (value) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const STATUS_STYLES = {
  Success: "text-emerald-600",
  Failed: "text-rose-500",
  Pending: "text-amber-500",
};

export default function VoucherTransactionInfo({ transactions }) {
  const rows = transactions || [];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">Payment Transaction History</h2>
      <p className="mt-1 text-xs text-gray-500">
        All transactions where this voucher code was redeemed at checkout.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="whitespace-nowrap px-4 py-3 font-medium">Transaction Id</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Date</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Customer</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Amount</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Payment Method</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No transactions yet.
                </td>
              </tr>
            ) : (
              rows.map((txn, index) => (
                <tr key={txn.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 font-medium text-indigo-600">#{txn.id}</td>
                  <td className="px-4 py-3 text-gray-600">{txn.date}</td>
                  <td className="px-4 py-3 text-gray-600">{txn.customer}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(txn.amount)}</td>
                  <td className="px-4 py-3 text-gray-600">{txn.paymentMethod}</td>
                  <td className={`px-4 py-3 font-medium ${STATUS_STYLES[txn.status] || "text-gray-500"}`}>
                    {txn.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}