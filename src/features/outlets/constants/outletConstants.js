export const OUTLET_STATUS = {
  ACTIVE: "active",
  NOT_ACTIVE: "not_active",
};

export const REGISTRATION_TYPES = {
  SUB_BRAND: "sub_brand",
  FRANCHISE: "franchise",
};

export const REGISTRATION_TYPE_LABELS = {
  [REGISTRATION_TYPES.SUB_BRAND]: "Sub - Brand",
  [REGISTRATION_TYPES.FRANCHISE]: "Franchise",
};

export const FILTER_OPTIONS = [
  { id: "status_active", group: "status", value: OUTLET_STATUS.ACTIVE, label: "Active" },
  { id: "status_not_active", group: "status", value: OUTLET_STATUS.NOT_ACTIVE, label: "Not Active" },
  { id: "type_sub_brand", group: "type", value: REGISTRATION_TYPES.SUB_BRAND, label: "Sub - Brand" },
  { id: "type_franchise", group: "type", value: REGISTRATION_TYPES.FRANCHISE, label: "Franchise" },
];

// Swap these for real lookups (e.g. from a Sub-Brand / Franchise API) when wiring this up.
export const MOCK_SUB_BRANDS = [
  { id: "sb_1", name: "Yoga Education And Research Pvt Ltd" },
  { id: "sb_2", name: "Trydood Wellness Pvt Ltd" },
];

export const MOCK_FRANCHISES = [
  { id: "fr_1", name: "SaraFood Retail Pvt Ltd" },
  { id: "fr_2", name: "Urban Bites Franchise LLP" },
];

export const ANALYTICS_REPORTS = [
  "Outlet Performance",
  "Order Summary",
  "Revenue by Outlet",
  "Customer Reach",
];

export const PAGE_SIZE = 6;
