// src/services/voucher/voucherService.js
// Swap the mock logic below with real axios/fetch calls to your backend.
// Keeping the function signatures the same means nothing else in the app
// needs to change when you wire up the real API.

const DEFAULT_DETAILS = {
  createdDate: "17/12/2025",
  startTime: "01:30 AM",
  endTime: "12:10 PM",
  shortTitle: "Flat 10% off up to 500",
  percentageOfDiscount: 30,
  singleUsePerUser: false,
  multipleUseUntilExpiry: true,
  applicableOutlets: {
    selectedBrandOutletCount: 30,
    totalOutletsCount: 59,
    subBrandCount: 59,
    franchiseCount: 9,
  },
  searchTags: [
    "Best voucher",
    "Discount voucher",
    "Best Deal",
    "Yoga Deal",
    "Yoga Offer",
    "Offers",
    "Deals",
  ],
  whoCanUse: "android_ios_membership",
  whoCanClaim: "all_users",
  keySummary: {
    totalAudiencePercent: 20,
    totalEngagementClicks: 450,
    totalImpressionReach: 1002,
  },
  analysis: {
    overAllEarning: 34980.0,
    totalBillValue: 42989.0,
    totalDiscountAmount: 6455.0,
    additionalDiscount: 3290.0,
    paidAmount: 34980.0,
  },
  outletUsage: {
    outletIds: [
      "#14503219",
      "#14683125",
      "#14382019",
      "#14503219",
      "#14683125",
      "#14503323",
      "#14382019",
      "#14503016",
      "#14382019",
    ],
    subBrand: [69, 0, 76, 0, 60, 60, 71, 0, 10],
    franchiseOutlet: [80, 0, 45, 0, 80, 0, 60, 0, 25],
  },
  revenueWeekly: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    current: [22, 30, 18, 35, 28, 45, 38],
    last: [15, 26, 32, 20, 30, 24, 33],
  },
  customerFlowWeekly: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    current: [55, 50, 42, 30, 58, 62, 48],
    last: [70, 65, 68, 66, 72, 66, 70],
  },
  storePerformance: [
    { storeName: "Andheri West Outlet", revenue: 12980.0 },
    { storeName: "Bandra Sub-Brand Store", revenue: 9820.0 },
    { storeName: "Powai Franchise Outlet", revenue: 7460.0 },
    { storeName: "Thane Sub-Brand Store", revenue: 4720.0 },
  ],
  transactions: [
    {
      id: "TXN10021",
      date: "20-05-2025, 10:12 AM",
      customer: "Ravi Sharma",
      amount: 1600.0,
      paymentMethod: "UPI",
      status: "Success",
    },
    {
      id: "TXN10045",
      date: "22-05-2025, 04:45 PM",
      customer: "Priya Nair",
      amount: 1600.0,
      paymentMethod: "Card",
      status: "Success",
    },
    {
      id: "TXN10098",
      date: "25-05-2025, 09:05 AM",
      customer: "Aman Verma",
      amount: 1600.0,
      paymentMethod: "UPI",
      status: "Failed",
    },
  ],
  transactionSummary: {
    overallEarnings: 252899.0,
    overallBillAmount: 157729.0,
    discountAmount: 52899.0,
    paidAmount: 152899.0,
    totalUserCount: 858,
  },
  orderTransactions: [
    {
      orderId: "VC086324",
      customerName: "Chitra Yalp",
      customerId: "#xxx41721",
      outletName: "Anna Nagar, Chennai",
      storeId: "#1245829",
      storeType: "Sub-Brand",
      date: "17/02/2026",
      time: "10:30 am",
      status: "Success",
      amount: 675.0,
    },
    {
      orderId: "VC086324",
      customerName: "Manami Suda",
      customerId: "#xxx77770",
      outletName: "Sadipet, Chennai",
      storeId: "#1245830",
      storeType: "Franchise",
      date: "17/02/2026",
      time: "10:30 am",
      status: "Success",
      amount: 675.0,
    },
    {
      orderId: "VC086324",
      customerName: "Christina Yalp",
      customerId: "#xxx52521",
      outletName: "Anna Nagar, Chennai 39",
      storeId: "#1245879",
      storeType: "Sub-Brand",
      date: "17/02/2026",
      time: "10:23 am",
      status: "Success",
      amount: 1099.0,
    },
    {
      orderId: "VC086324",
      customerName: "Kyjiseal Neitorn",
      customerId: "#xxx63212",
      outletName: "Goring Nagar, Trivpini",
      storeId: "#1245879",
      storeType: "Sub-Brand",
      date: "17/02/2026",
      time: "10:23 am",
      status: "Success",
      amount: 675.0,
    },
    {
      orderId: "VC086324",
      customerName: "Nanami Kanto",
      customerId: "#xxx98212",
      outletName: "Ayanavaram, Chennai",
      storeId: "#1245880",
      storeType: "Sub-Brand",
      date: "17/02/2026",
      time: "10:12 am",
      status: "Success",
      amount: 675.0,
    },
    {
      orderId: "VC086324",
      customerName: "Tsykhqurs Meguml",
      customerId: "#xxx43212",
      outletName: "West Anna Nagar, Chennai",
      storeId: "#1245879",
      storeType: "Franchise",
      date: "17/02/2026",
      time: "10:05 am",
      status: "Failed",
      amount: 675.0,
    },
    {
      orderId: "VC086324",
      customerName: "Nrtsi Akani",
      customerId: "#xxx11212",
      outletName: "Girei, Chennai",
      storeId: "#1245881",
      storeType: "Franchise",
      date: "17/02/2026",
      time: "09:58 am",
      status: "Success",
      amount: 675.0,
    },
    {
      orderId: "VC086324",
      customerName: "Inumesli Tegai",
      customerId: "#xxx22212",
      outletName: "Eci, Chennai",
      storeId: "#1245882",
      storeType: "Franchise",
      date: "17/02/2026",
      time: "09:50 am",
      status: "Success",
      amount: 675.0,
    },
  ],
};

const MOCK_VOUCHERS = [
  {
    id: "JVR39304309",
    title: "Wednesday Sepical Deal's Yoga Class 25%",
    publishedDate: "01-05-2025",
    expiredDate: "30-05-2025",
    discount: "30 %",
    valueOfAmount: 25000.0,
    earnAmount: 14239.0,
    status: "Active",
    startDate: "01-05-2025",
    endDate: "30-05-2025",
    ...DEFAULT_DETAILS,
  },
  {
    id: "JVR38258384",
    title: "MOTOROLA RAVRA 5G% OFF FLIP PHONE, 8GB RAM, 256GB STORAGE...",
    publishedDate: "01-05-2025",
    expiredDate: "30-05-2025",
    discount: "30 %",
    valueOfAmount: 25000.0,
    earnAmount: 14239.0,
    status: "Expired",
    startDate: "01-05-2025",
    endDate: "30-05-2025",
    ...DEFAULT_DETAILS,
  },
  {
    id: "JVR39362309",
    title: "MOTOROLA RAVRA 5G% OFF FLIP PHONE, 8GB RAM, 256GB STORAGE...",
    publishedDate: "01-05-2025",
    expiredDate: "30-05-2025",
    discount: "30 %",
    valueOfAmount: 25000.0,
    earnAmount: 14239.0,
    status: "Active",
    startDate: "01-05-2025",
    endDate: "30-05-2025",
    ...DEFAULT_DETAILS,
  },
  {
    id: "JVR39340B1",
    title: "MOTOROLA RAVRA 5G% OFF FLIP PHONE, 8GB RAM, 256GB STORAGE...",
    publishedDate: "01-05-2025",
    expiredDate: "30-05-2025",
    discount: "30 %",
    valueOfAmount: 1099.0,
    earnAmount: 0.0,
    status: "Under Review",
    startDate: "01-05-2025",
    endDate: "30-05-2025",
    ...DEFAULT_DETAILS,
  },
  {
    id: "JVR39352303",
    title: "MOTOROLA RAVRA 5G% OFF FLIP PHONE, 8GB RAM, 256GB STORAGE...",
    publishedDate: "01-05-2025",
    expiredDate: "30-05-2025",
    discount: "30 %",
    valueOfAmount: 25000.0,
    earnAmount: 0.0,
    status: "Under Review",
    startDate: "01-05-2025",
    endDate: "30-05-2025",
    ...DEFAULT_DETAILS,
  },
];

const MOCK_STATS = {
  overallCollectionAmount: 1629.0,
  overallPaidAmount: 634.0,
  discountAmount: 336.0,
  additionalDiscount: -83.0,
  gstAmount: 0.0,
  activeVoucherCount: 75,
  expiredVoucherCount: 33,
  pendingVoucherCount: 3,
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchVoucherStats() {
  await delay(250);
  return MOCK_STATS;
}

export async function fetchVouchers({ page = 1, rowsPerPage = 10, search = "" } = {}) {
  await delay(250);

  const filtered = search
    ? MOCK_VOUCHERS.filter(
      (v) =>
        v.id.toLowerCase().includes(search.toLowerCase()) ||
        v.title.toLowerCase().includes(search.toLowerCase())
    )
    : MOCK_VOUCHERS;

  const start = (page - 1) * rowsPerPage;
  const paginated = filtered.slice(start, start + rowsPerPage);

  return {
    data: paginated,
    total: filtered.length,
    page,
    rowsPerPage,
    totalPages: Math.max(1, Math.ceil(filtered.length / rowsPerPage)),
  };
}

export async function fetchVoucherById(id) {
  await delay(250);
  const voucher = MOCK_VOUCHERS.find((v) => v.id === id);
  if (!voucher) throw new Error("Voucher not found");
  return voucher;
}

export async function createDiscountVoucher(payload) {
  await delay(300);
  const newVoucher = {
    id: `JVR${Math.floor(10000000 + Math.random() * 89999999)}`,
    status: "Under Review",
    createdDate: new Date().toLocaleDateString("en-GB"),
    ...DEFAULT_DETAILS,
    ...payload,
  };
  MOCK_VOUCHERS.unshift(newVoucher);
  return newVoucher;
}

export async function updateDiscountVoucher(id, payload) {
  await delay(300);
  const index = MOCK_VOUCHERS.findIndex((v) => v.id === id);
  if (index === -1) throw new Error("Voucher not found");
  MOCK_VOUCHERS[index] = { ...MOCK_VOUCHERS[index], ...payload };
  return MOCK_VOUCHERS[index];
}