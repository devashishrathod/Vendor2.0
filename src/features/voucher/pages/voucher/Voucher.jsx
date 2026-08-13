// src/pages/voucher/Voucher.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useVoucher from "../../hooks/voucher/useVoucher";
import { VoucherOverview, VoucherTable } from "../../components/voucher";


export default function Voucher() {
  const navigate = useNavigate();
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);

  const {
    stats,
    vouchers,
    total,
    totalPages,
    page,
    rowsPerPage,
    search,
    isLoading,
    stateSummary,
    goToPage,
    changeRowsPerPage,
    updateSearch,
  } = useVoucher();

  return (
  <div>

      <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Voucher & Discount Overview
        </h1>
        <p className="text-sm text-gray-500">Attract More Customers to your Store</p>
      </div>

      <VoucherOverview
        stats={stats}
        isLoading={!stats}
        isExpanded={isOverviewExpanded}
        onToggleExpanded={() => setIsOverviewExpanded((prev) => !prev)}
      />

      {isOverviewExpanded && (
        <VoucherTable
          vouchers={vouchers}
          isLoading={isLoading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalPages={totalPages}
          total={total}
          search={search}
          stateSummary={stateSummary}
          onSearchChange={updateSearch}
          onRowsPerPageChange={changeRowsPerPage}
          onPageChange={goToPage}
          onOpenAddDiscount={() => navigate("/vouchers/new")}
        />
      )}
    </div>
  </div>
  );
}