// src/components/voucher/VoucherOutletPickerModal.jsx
// Outlet picker modal — opened from the "+ Add More" link in the
// "Applicable To Specifically Selected Outlet Or Franchise" section of
// VoucherForm.jsx. Lets the merchant select/deselect which Sub-Brand or
// Franchise outlets this voucher applies to. Loads the real list from
// GET /subBrands/get-all?brandId= (see getSubBrands in VoucherService.js).
import React, { useEffect, useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { getSubBrands } from "../../services/voucher/VoucherService";

const FILTER_TABS = ["Sub-Brand", "Franchise"];

// subBrands/get-all's `outletType` field uses these raw values — map them
// to the tab labels shown in this modal.
const OUTLET_TYPE_TO_TAB = {
  OUTLET: "Sub-Brand",
  FRANCHISE: "Franchise",
};

function mapOutlet(raw) {
  return {
    id: raw._id,
    storeId: raw.storeId,
    uniqueId: raw.uniqueId,
    whatsappNumber: raw.whatsappNumber,
    type: OUTLET_TYPE_TO_TAB[raw.outletType] || "Sub-Brand",
    location: raw.location?.formattedAddress || "No address added yet.",
    status: raw.isActive ? "Active" : "De-Active",
  };
}

export default function VoucherOutletPickerModal({
  isOpen,
  onClose,
  brandId,
  selectedIds = [],
  onConfirm,
}) {
  const [activeTab, setActiveTab] = useState("Sub-Brand");
  const [search, setSearch] = useState("");
  const [localSelected, setLocalSelected] = useState(selectedIds);
  const [outlets, setOutlets] = useState([]);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLocalSelected(selectedIds);
  }, [isOpen, selectedIds]);

  useEffect(() => {
    if (!isOpen || !brandId) return;
    setIsLoading(true);
    setError(null);
    getSubBrands({ brandId })
      .then((res) => {
        const list = res?.data?.data;
        const items = Array.isArray(list) ? list : [];
        setOutlets(items.map(mapOutlet));
        setTotalAvailable(res?.data?.total ?? items.length);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [isOpen, brandId]);

  const filteredOutlets = useMemo(() => {
    return outlets.filter((outlet) => {
      const matchesTab = outlet.type === activeTab;
      const matchesSearch = search
        ? [outlet.storeId, outlet.uniqueId, outlet.location]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
        : true;
      return matchesTab && matchesSearch;
    });
  }, [outlets, activeTab, search]);

  if (!isOpen) return null;

  const toggleOutlet = (id) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selectedOutlets = outlets.filter((outlet) => localSelected.includes(outlet.id));
    onConfirm?.({
      ids: localSelected,
      subBrandCount: selectedOutlets.filter((outlet) => outlet.type === "Sub-Brand").length,
      franchiseCount: selectedOutlets.filter((outlet) => outlet.type === "Franchise").length,
      totalAvailable,
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-900">
            Selected Or Deselected The Outlet's
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs + search */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Here  Outlet."
              className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Outlet list */}
        <div className="flex-1 space-y-3 overflow-y-auto px-6 pb-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-gray-400">Loading outlets…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-rose-500">{error}</p>
          ) : filteredOutlets.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No outlets found.</p>
          ) : (
            filteredOutlets.map((outlet) => {
              const isSelected = localSelected.includes(outlet.id);
              return (
                <div
                  key={outlet.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleOutlet(outlet.id)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-gray-900 bg-gray-100 text-gray-900"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
                          <path d="M6.2 11.2 3.4 8.4l1.1-1.1 1.7 1.7 4.3-4.3 1.1 1.1z" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Store Id : {outlet.storeId}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {outlet.uniqueId} · {outlet.whatsappNumber}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-gray-800">
                        Outlet Location
                      </p>
                      <p className="mt-1 max-w-md text-xs text-gray-500">{outlet.location}</p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold ${
                      outlet.status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {outlet.status}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-semibold text-white  disabled:opacity-60"
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
}
