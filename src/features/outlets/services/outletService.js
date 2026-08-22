import { OUTLET_STATUS, REGISTRATION_TYPES } from "../constants/outletConstants";

// Point this at your real backend when you're ready to wire this up, e.g.
// const API_BASE = "/api/outlets";
// and replace the function bodies below with fetch()/axios calls that hit it.

let MOCK_OUTLETS = [
  {
    id: "1",
    storeId: "14852070",
    status: OUTLET_STATUS.ACTIVE,
    outletName: "Andiappan Yoga Academy",
    outletAddress:
      "New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block 5th Street, Annanagar West, Chennai - 600040",
    registrationType: REGISTRATION_TYPES.SUB_BRAND,
    registeredWith: "Yoga Education And Research Pvt Ltd",
    joinedDate: "2024-03-06",
  },
  {
    id: "2",
    storeId: "14852070",
    status: OUTLET_STATUS.ACTIVE,
    outletName: "Andiappan Yoga Academy",
    outletAddress:
      "New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block 5th Street, Annanagar West, Chennai - 600040",
    registrationType: REGISTRATION_TYPES.SUB_BRAND,
    registeredWith: "Yoga Education And Research Pvt Ltd",
    joinedDate: "2024-03-06",
  },
  {
    id: "3",
    storeId: "14852070",
    status: OUTLET_STATUS.ACTIVE,
    outletName: "Andiappan Yoga Academy",
    outletAddress:
      "New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block 5th Street, Annanagar West, Chennai - 600040",
    registrationType: REGISTRATION_TYPES.FRANCHISE,
    registeredWith: "SaraFood Retail Pvt Ltd",
    joinedDate: "2024-03-06",
  },
  {
    id: "4",
    storeId: "14852070",
    status: OUTLET_STATUS.NOT_ACTIVE,
    outletName: "Andiappan Yoga Academy",
    outletAddress:
      "New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block 5th Street, Annanagar West, Chennai - 600040",
    registrationType: REGISTRATION_TYPES.FRANCHISE,
    registeredWith: "SaraFood Retail Pvt Ltd",
    joinedDate: "2024-03-06",
  },
  {
    id: "5",
    storeId: "14852070",
    status: OUTLET_STATUS.ACTIVE,
    outletName: "Andiappan Yoga Academy",
    outletAddress:
      "New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block 5th Street, Annanagar West, Chennai - 600040",
    registrationType: REGISTRATION_TYPES.SUB_BRAND,
    registeredWith: "Yoga Education And Research Pvt Ltd",
    joinedDate: "2024-03-06",
  },
  {
    id: "6",
    storeId: "14852070",
    status: OUTLET_STATUS.ACTIVE,
    outletName: "Andiappan Yoga Academy",
    outletAddress:
      "New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block 5th Street, Annanagar West, Chennai - 600040",
    registrationType: REGISTRATION_TYPES.SUB_BRAND,
    registeredWith: "Yoga Education And Research Pvt Ltd",
    joinedDate: "2024-03-06",
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchOutlets({ search = "", filters = {}, page = 1, pageSize = 6 } = {}) {
  await delay(300);
  let data = [...MOCK_OUTLETS];

  const q = search.trim().toLowerCase();
  if (q) {
    data = data.filter(
      (o) =>
        o.storeId.toLowerCase().includes(q) ||
        o.status.replace("_", " ").includes(q) ||
        o.outletName.toLowerCase().includes(q)
    );
  }

  if (filters.status?.length) {
    data = data.filter((o) => filters.status.includes(o.status));
  }
  if (filters.type?.length) {
    data = data.filter((o) => filters.type.includes(o.registrationType));
  }

  const total = data.length;
  const start = (page - 1) * pageSize;
  const paged = data.slice(start, start + pageSize);

  return { data: paged, total, page, pageSize };
}

export async function toggleOutletStatus(id) {
  await delay(250);
  MOCK_OUTLETS = MOCK_OUTLETS.map((o) =>
    o.id === id
      ? { ...o, status: o.status === OUTLET_STATUS.ACTIVE ? OUTLET_STATUS.NOT_ACTIVE : OUTLET_STATUS.ACTIVE }
      : o
  );
  return MOCK_OUTLETS.find((o) => o.id === id);
}

export async function addOutlet(payload) {
  await delay(400);
  const newOutlet = {
    id: String(Date.now()),
    storeId: String(Math.floor(10000000 + Math.random() * 89999999)),
    status: OUTLET_STATUS.ACTIVE,
    joinedDate: new Date().toISOString(),
    ...payload,
  };
  MOCK_OUTLETS = [newOutlet, ...MOCK_OUTLETS];
  return newOutlet;
}

export async function exportOutlets() {
  await delay(200);
  const header = "Store Id,Status,Outlet Name,Outlet Address,Registration Type,Registered With,Joined Date";
  const rows = MOCK_OUTLETS.map((o) =>
    [o.storeId, o.status, o.outletName, o.outletAddress, o.registrationType, o.registeredWith, o.joinedDate]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "outlets-export.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function fetchOutletById(id) {
  await delay(200);
  const outlet = MOCK_OUTLETS.find((o) => o.id === id);
  if (!outlet) throw new Error("Outlet not found");
  return outlet;
}

// Mock per-outlet transaction summary, keyed by transaction type. Replace with
// a real endpoint (e.g. GET /outlets/:id/transactions) when wiring this up.
export async function fetchOutletTransactions(id) {
  await delay(300);
  return {
    overall: { amount: 7256.0, deltaPercent: 14.33 },
    voucher: { amount: 3120.0, deltaPercent: 8.5 },
    deal_pack: { amount: 1890.0, deltaPercent: -2.1 },
    membership: { amount: 1646.0, deltaPercent: 5.7 },
    gst: { amount: 600.0, deltaPercent: 0 },
  };
}
