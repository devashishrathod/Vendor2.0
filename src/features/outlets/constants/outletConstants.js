export const OUTLET_STATUS = {
  ACTIVE: "active",
  NOT_ACTIVE: "not_active",
};

// Outlet Type — Outlet vs Franchise. Replaces the old Sub-Brand/Franchise
// "registration type" concept, which the Add Outlet form no longer collects
// (outletName / outletAddress / registrationType / registeredWith were
// dropped — name & address now come from the picked Location instead).
export const OUTLET_TYPES = {
  OUTLET: "outlet",
  FRANCHISE: "franchise",
};

export const OUTLET_TYPE_LABELS = {
  [OUTLET_TYPES.OUTLET]: "Outlet",
  [OUTLET_TYPES.FRANCHISE]: "Franchise",
};

export const OUTLET_TYPE_OPTIONS = [
  { value: OUTLET_TYPES.OUTLET, label: OUTLET_TYPE_LABELS[OUTLET_TYPES.OUTLET] },
  { value: OUTLET_TYPES.FRANCHISE, label: OUTLET_TYPE_LABELS[OUTLET_TYPES.FRANCHISE] },
];

// ─── Backward-compat aliases ────────────────────────────────────────────────
// A few files (e.g. outletService.js) still import REGISTRATION_TYPES /
// REGISTRATION_TYPE_LABELS under the old name. Keep these pointing at the
// same values as OUTLET_TYPES so those imports don't crash. Once every
// remaining usage is migrated to OUTLET_TYPES, delete this block.
export const REGISTRATION_TYPES = OUTLET_TYPES;
export const REGISTRATION_TYPE_LABELS = OUTLET_TYPE_LABELS;

// Status filter — now its own separate dropdown in OutletsToolbar (used to
// be grouped together with Outlet Type inside one combined "Filter" panel).
export const STATUS_OPTIONS = [
  { value: OUTLET_STATUS.ACTIVE, label: "Active" },
  { value: OUTLET_STATUS.NOT_ACTIVE, label: "Not Active" },
];

// Sort — by real, confirmed outlet fields only (joinedDate/createdAt,
// storeId). Paired with a separate Ascending/Descending order in the UI.
export const SORT_OPTIONS = [
  { value: "joinedDate", label: "Joined Date" },
  { value: "storeId", label: "Store Id" },
];

export const ANALYTICS_REPORTS = [
  "Outlet Performance",
  "Order Summary",
  "Revenue by Outlet",
  "Customer Reach",
];

export const PAGE_SIZE = 6;