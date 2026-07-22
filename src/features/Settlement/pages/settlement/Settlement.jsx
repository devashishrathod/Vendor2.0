// src/pages/settlement/Settlement.jsx
import React from "react";
import { SettlementOverview, SettlementTable } from "../../components/settlement";
import useSettlement from "../../hooks/useSettlement";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";

export default function Settlement() {
  const {
    overview,
    banner,
    holidayNotice,
    showBanner,
    setShowBanner,
    showHolidayNotice,
    setShowHolidayNotice,
    rows,
    total,
    page,
    setPage,
    pageSize,
    pageSizes,
    onPageSizeChange,
    totalPages,
    search,
    onSearchChange,
    dateRange,
    expandedRow,
    toggleRow,
    loadingOverview,
    loadingTable,
    refresh,
  } = useSettlement();

  return (
   <div>
    <DashboardHeader/>
     <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">Settlement Dashboard</h1>
          <p className="mx-auto mt-1 max-w-xl text-sm text-slate-400">
            Monitor your payment settlements with complete transparency. Get a quick
            overview of your settlement status, amounts, and timeline.
          </p>
        </div>

        <div className="space-y-5">
          <SettlementOverview
            overview={overview}
            banner={banner}
            holidayNotice={holidayNotice}
            showBanner={showBanner}
            setShowBanner={setShowBanner}
            showHolidayNotice={showHolidayNotice}
            setShowHolidayNotice={setShowHolidayNotice}
            loading={loadingOverview}
            onRefresh={refresh}
          />

          <SettlementTable
            rows={rows}
            total={total}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizes={pageSizes}
            onPageSizeChange={onPageSizeChange}
            search={search}
            onSearchChange={onSearchChange}
            dateRange={dateRange}
            expandedRow={expandedRow}
            toggleRow={toggleRow}
            loading={loadingTable}
          />
        </div>
      </div>
    </div>
   </div>

  );
}
