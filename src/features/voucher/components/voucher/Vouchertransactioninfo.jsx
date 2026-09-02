// src/components/voucher/VoucherTransactionInfo.jsx
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Calendar, Download } from "lucide-react";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const FILTER_TABS = ["All", "Sub-Brand", "Franchise"];

const AVATAR_COLORS = [
    "bg-violet-200 text-violet-700",
    "bg-emerald-200 text-emerald-700",
    "bg-amber-200 text-amber-700",
    "bg-sky-200 text-sky-700",
    "bg-rose-200 text-rose-700",
    "bg-teal-200 text-teal-700",
    "bg-orange-200 text-orange-700",
    "bg-indigo-200 text-indigo-700",
];

const formatCurrency = (value) =>
    `₹ ${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// No confirmed transactions/summary endpoint exists yet for a voucher's
// payment history — show real zeros/empty state instead of fabricated
// numbers until one is wired up (see VoucherDetails.jsx).
const ZERO_SUMMARY = {
    overallEarnings: 0,
    overallBillAmount: 0,
    discountAmount: 0,
    paidAmount: 0,
    totalUserCount: 0,
};

function getInitials(name = "") {
    return name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function SummaryStat({ label, value, valueClassName = "" }) {
    return (
        <div className="flex flex-col gap-1 px-4 first:pl-0 last:pr-0">
            <span className="text-xs text-gray-500">{label}</span>
            <span className={`text-base font-semibold text-gray-900 ${valueClassName}`}>
                {value}
            </span>
        </div>
    );
}

export default function VoucherTransactionInfo({
    voucherTitle = "",
    summary = ZERO_SUMMARY,
    transactions = [],
}) {
    const [activeFilter, setActiveFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(1);

    const filteredRows = useMemo(() => {
        return transactions.filter((row) => {
            const matchesFilter = activeFilter === "All" || row.storeType === activeFilter;
            const matchesSearch = search
                ? [row.customerName, row.customerId, row.orderId, row.outletName]
                    .join(" ")
                    .toLowerCase()
                    .includes(search.toLowerCase())
                : true;
            return matchesFilter && matchesSearch;
        });
    }, [transactions, activeFilter, search]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
    const paginatedRows = filteredRows.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    return (
        <div className="space-y-4">
            {/* Key Summary heading */}
            <div className=" border-b border-gray-200 pb-4">
                <h2 className="text-sm font-semibold text-gray-900">Key Summary</h2>
                <p className="text-xs text-gray-500">
                    Shows the key details and status of a product key in one place
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3   border-b border-gray-200 pb-4 text-xs text-gray-500">
                <span>
                    Payment Transaction History{voucherTitle ? ` / ${voucherTitle}` : ""}
                </span>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50">
                        <Calendar className="h-3.5 w-3.5" />
                        Filter by date
                    </button>
                    <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">
                        <Download className="h-3.5 w-3.5" />
                        Export Data
                    </button>
                </div>
            </div>

            <section className="rounded-xl bg-white p-5">


                {/* Summary stats */}
                <div className="flex flex-wrap items-center justify-between border-t border-gray-200 gap-y-4 divide-x divide-gray-100 py-4">
                    <SummaryStat
                        label="Overall Earnings"
                        value={formatCurrency(summary.overallEarnings)}
                        valueClassName="text-indigo-600"
                    />
                    <SummaryStat
                        label="Overall Bill Amount"
                        value={formatCurrency(summary.overallBillAmount)}
                    />
                    <SummaryStat
                        label="Discount Amount"
                        value={formatCurrency(summary.discountAmount)}
                        valueClassName="text-indigo-600"
                    />
                    <SummaryStat
                        label="Paid Amount"
                        value={formatCurrency(summary.paidAmount)}
                        valueClassName="text-emerald-600"
                    />
                    <SummaryStat
                        label="Total User Count"
                        value={`${summary.totalUserCount} Person`}
                    />
                </div>

                {/* Rows per page + pagination */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Rows per page:</span>
                        <div className="flex overflow-hidden rounded-lg border border-gray-200">
                            {ROWS_PER_PAGE_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        setRowsPerPage(option);
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1.5 text-sm ${rowsPerPage === option
                                        ? "bg-emerald-600 text-white"
                                        : "bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="rounded-md p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`h-7 w-7 rounded-md text-sm ${p === page ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="rounded-md p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Filter tabs + search */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 py-4">
                    <div className="flex overflow-hidden rounded-lg border border-gray-200">
                        {FILTER_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveFilter(tab);
                                    setPage(1);
                                }}
                                className={`px-4 py-1.5 text-sm font-medium ${activeFilter === tab
                                    ? "bg-gray-900 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">
                        <Search className="h-4 w-4" />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search Here : Customer Name & ID , Voucher Id, Outlet Details"
                            className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border-t border-gray-100">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400">
                                <th className="whitespace-nowrap px-3 py-3 font-medium">Order Id</th>
                                <th className="whitespace-nowrap px-3 py-3 font-medium">Customer Details</th>
                                <th className="whitespace-nowrap px-3 py-3 font-medium">Outlet Details</th>
                                <th className="whitespace-nowrap px-3 py-3 font-medium">Store Type</th>
                                <th className="whitespace-nowrap px-3 py-3 font-medium">Date & Time</th>
                                <th className="whitespace-nowrap px-3 py-3 font-medium">Status</th>
                                <th className="whitespace-nowrap px-3 py-3 font-medium">Payment Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map((row, index) => (
                                    <tr key={`${row.orderId}-${index}`} className="border-t border-gray-50">
                                        <td className="whitespace-nowrap px-3 py-3 font-medium text-indigo-600">
                                            #{row.orderId}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_COLORS[index % AVATAR_COLORS.length]
                                                        }`}
                                                >
                                                    {getInitials(row.customerName)}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-900">{row.customerName}</p>
                                                    <p className="text-xs text-gray-400">{row.customerId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-gray-600">
                                            <p>{row.outletName}</p>
                                            <p className="text-xs text-gray-400">Store id: {row.storeId}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                                            {row.storeType}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                                            <p>{row.date}</p>
                                            <p className="text-xs text-gray-400">{row.time}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            <span
                                                className={`font-medium ${row.status === "Success" ? "text-emerald-600" : "text-rose-500"
                                                    }`}
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900">
                                            {formatCurrency(row.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}