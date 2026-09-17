// ─── Transaction Data (per tab) ────────────────────────────────────────────
// Har transaction type (voucher / dealpack / membership) ka apna:
//   - overview stats (top wali 5 boxes: Bill Value, Paid Amount, Discount, etc.)
//   - table columns (ID column ka naam alag hota hai type ke hisaab se)
//   - table rows (mock data — production me yahi jagah API response aayega)
//
// Real backend integrate karte waqt: is file ko delete karke,
// Transactions.jsx me `fetchTransactionData(activeTxnTab)` jaisa API call use karo,
// aur response ko isi shape (overview + rows) me map kar do.
// Isse baaki saara UI code (table, detail page) bina chhede kaam karta rahega.

export const SUMMARY_CARDS = [
  { key: "voucher", label: "Voucher Summary", amount: "₹ 7,256.00", change: "+74.6%", positive: true },
  // Commented out for now — no backend endpoint yet, dummy data only.
  // Re-enable once Deal Pack / Membership have real APIs.
  // { key: "dealpack", label: "Deal Pack Summary", amount: "₹ 4,460.00", change: "+624%", positive: true },
  // { key: "membership", label: "Membership Summary", amount: "₹ 4,244.00", change: "-20.00%", positive: false },
  { key: "gsi", label: "GSI Summary", amount: "₹ 3,118.00", change: "-70.00%", positive: false },
];

export const TRANSACTION_TABS = [
  { key: "voucher", label: "Voucher Transaction", icon: "voucher" },
  // Commented out for now — no backend endpoint yet, dummy data only.
  // Re-enable once Deal Pack / Membership have real APIs.
  // { key: "dealpack", label: "Deal Pack Transaction", icon: "dealpack" },
  // { key: "membership", label: "Membership Transaction", icon: "membership" },
];

// ─── Detail-page field config (per transaction type) ──────────────────────
// OrderDetail.jsx isi config ko use karke "VOUCHER INFORMATION" vs
// "DEAL PACK INFORMATION" vs "MEMBERSHIP INFORMATION" section dynamically
// render karta hai — har type ke apne fields, apna badge label.
export const TYPE_CONFIG = {
  voucher: {
    badgeLabel: "Voucher",
    sectionTitle: "VOUCHER INFORMATION",
    idFieldLabel: "Voucher Version Id",
    withViewPage: true,
    fields: [
      { label: "Voucher Name", key: "voucherName" },
      { label: "Percentage", key: "percentage" },
      { label: "Best Value", key: "bestValue" },
      { label: "Published Date", key: "publishedDate" },
      { label: "Expired", key: "expiredDate" },
      { label: "Reminder Days", key: "reminderDays" },
      { label: "Tag Line", key: "tagLine" },
    ],
  },
  dealpack: {
    badgeLabel: "Deal Pack",
    sectionTitle: "DEAL PACK INFORMATION",
    idFieldLabel: "Deal Pack Id",
    withViewPage: true,
    fields: [
      { label: "Deal Pack Name", key: "packName" },
      { label: "Percentage", key: "percentage" },
      { label: "Pack Value", key: "packValue" },
      { label: "Items Included", key: "itemsIncluded" },
      { label: "Validity", key: "validity" },
      { label: "Published Date", key: "publishedDate" },
      { label: "Expired", key: "expiredDate" },
      { label: "Tag Line", key: "tagLine" },
    ],
  },
  membership: {
    badgeLabel: "Membership",
    sectionTitle: "MEMBERSHIP INFORMATION",
    idFieldLabel: "Membership Id",
    withViewPage: true,
    fields: [
      { label: "Membership Name", key: "membershipName" },
      { label: "Plan Type", key: "planType" },
      { label: "Duration", key: "duration" },
      { label: "Start Date", key: "startDate" },
      { label: "End Date", key: "endDate" },
      { label: "Benefits", key: "benefits" },
      { label: "Tag Line", key: "tagLine" },
    ],
  },
};

// Detail-page-only mock data, keyed by orderId. Kept separate from the table
// row data below so the table stays lightweight — the detail page pulls the
// extra fields (voucher/deal-pack/membership terms, payment breakdown,
// tickets, timeline) from here. Har order ka `title` aur `tagLine` bhi
// yahin par hota hai, taaki har type ka apna alag heading dikhe.
const ORDER_DETAILS = {
  // ── Voucher order ────────────────────────────────────────────────────
  "#558693214": {
    title: "Wednesday Sepical Deasl Yoga Class 25%",
    storeId: "#14852070",
    storeType: "Sub - Brand",
    voucherName: "Wednesday Sepical Deal's Yoga Class 25% Discount & Offer",
    percentage: "25 %",
    bestValue: "₹ 500.00",
    publishedDate: "02/01/2026",
    expiredDate: "27/02/2026",
    reminderDays: "99 Days",
    tagLine: "Flat 25% OFF UP TO 500",
    trydoodDiscount: "-₹ 35.00",
    membershipDiscount: "-₹ 50.00",
    couponCode: "TRYNEW50",
    paymentOptions: "Unified Payments Interface",
    paymentVia: "Google Pay App",
    customerEmail: "Okkotsuyuta9651@gmail.com",
    customerNote: "This Spent Value And Number Of Claims Reflect Only Your Outlet's Data.",
    paymentTransactionId: "200236633899999",
    paymentDateTime: "Sat 30.Feb 2025 & 11:55 Am",
    payVia: "Google Pay - Okkotusyuta-2-@okicici",
    receivedAccountInfo: "Trydood Account",
    settlementId: "Setl_SBaI3QnFcYatMb",
    settlementDateTime: "Sat 02 .March 2025 & 05:35pm",
    settlementTransactionId: "019809176",
    settlementAccountInfo: "Kotak Mahindra Bank\n1234XXXXXXXX0941",
    tickets: [
      {
        id: "42534836986",
        date: "09/12/2024",
        open: false,
      },
      {
        id: "42534836986",
        date: "11/12/2024",
        open: true,
        subject: "Settlement Issue",
        description: "this ₹ 1319.00 Amount Will Be Not Received In My Account",
        details:
          "One or more purpose strings in the app do not sufficiently explain the use of protected resources. Purpose strings must clearly and completely describe the app's use of data and, in most cases, provide an example of how the data will be used.",
        nextSteps:
          "Update the photo library purpose string to explain how the app will use the requested information and provide a specific example of how the data will be used. See the attached screenshot.",
        resources:
          "Purpose strings must clearly describe how an app uses the ability, data, or resource. The following are hypothetical examples of unclear purpose strings that would not pass review:",
        attachments: [
          { label: "Transaction Screen shot To Bank Side Attached Here -", fileLabel: "Download File" },
          { label: '"App needs microphone access"', fileLabel: "Download File" },
        ],
      },
    ],
  },
  "#558694005": {
    title: "T.Nagar Weekend Card Combo Voucher",
    storeId: "#14852071",
    storeType: "Sub - Brand",
    voucherName: "Weekend Combo Voucher 10% Discount & Offer",
    percentage: "10 %",
    bestValue: "₹ 350.00",
    publishedDate: "05/01/2026",
    expiredDate: "28/02/2026",
    reminderDays: "58 Days",
    tagLine: "Flat 10% OFF on Weekend Combo",
    trydoodDiscount: "-₹ 20.00",
    membershipDiscount: "-₹ 00.00",
    couponCode: "WEEKEND10",
    paymentOptions: "Card Network",
    paymentVia: "Debit Card",
    customerEmail: "Kugisakinobara7845@gmail.com",
    customerNote: "This Spent Value And Number Of Claims Reflect Only Your Outlet's Data.",
    paymentTransactionId: "200236633900125",
    paymentDateTime: "Sat 30.Feb 2025 & 11:55 Am",
    payVia: "HDFC Debit Card ****4521",
    receivedAccountInfo: "Trydood Account",
    settlementId: "Setl_SBaI3QnFcYbUcNc",
    settlementDateTime: "Sat 02 .March 2025 & 05:35pm",
    settlementTransactionId: "019809177",
    settlementAccountInfo: "Kotak Mahindra Bank\n1234XXXXXXXX0941",
    tickets: [],
  },

  // ── Deal Pack orders ─────────────────────────────────────────────────
  "#558701122": {
    title: "Summer Special Fitness Deal Pack 20%",
    storeId: "#14852072",
    storeType: "Sub - Brand",
    packName: "Summer Special Fitness Deal Pack 20% Off",
    percentage: "20 %",
    packValue: "₹ 2900.00",
    itemsIncluded: "5 Sessions + 1 Free Consultation",
    validity: "3 Months",
    publishedDate: "05/01/2026",
    expiredDate: "20/03/2026",
    tagLine: "Flat 20% OFF on Fitness Pack",
    trydoodDiscount: "-₹ 300.00",
    membershipDiscount: "-₹ 150.00",
    couponCode: "FIT20",
    paymentOptions: "Unified Payments Interface",
    paymentVia: "UPI App",
    customerEmail: "Gojosatoru4412@gmail.com",
    customerNote: "This Spent Value And Number Of Claims Reflect Only Your Outlet's Data.",
    paymentTransactionId: "200236634001125",
    paymentDateTime: "Sat 01.Mar 2025 & 09:20 Am",
    payVia: "Google Pay - Gojosatoru-1-@okhdfc",
    receivedAccountInfo: "Trydood Account",
    settlementId: "Setl_DPk9QnFcYdEfGh",
    settlementDateTime: "Mon 03 .March 2025 & 04:10pm",
    settlementTransactionId: "019809178",
    settlementAccountInfo: "Kotak Mahindra Bank\n1234XXXXXXXX0941",
    tickets: [],
  },
  "#558701456": {
    title: "Adyar Family Spa Deal Pack 15%",
    storeId: "#14852073",
    storeType: "Sub - Brand",
    packName: "Family Spa Deal Pack 15% Off",
    percentage: "15 %",
    packValue: "₹ 2500.00",
    itemsIncluded: "3 Spa Sessions + 1 Add-on Massage",
    validity: "2 Months",
    publishedDate: "06/01/2026",
    expiredDate: "15/03/2026",
    tagLine: "Flat 15% OFF on Spa Pack",
    trydoodDiscount: "-₹ 250.00",
    membershipDiscount: "-₹ 00.00",
    couponCode: "SPA15",
    paymentOptions: "Cash Payment",
    paymentVia: "Outlet Counter",
    customerEmail: "Fushigoromegumi3321@gmail.com",
    customerNote: "This Spent Value And Number Of Claims Reflect Only Your Outlet's Data.",
    paymentTransactionId: "200236634001456",
    paymentDateTime: "Sat 01.Mar 2025 & 10:05 Am",
    payVia: "Cash",
    receivedAccountInfo: "Trydood Account",
    settlementId: "Setl_DPk9QnFcYijKl",
    settlementDateTime: "Pending",
    settlementTransactionId: "-",
    settlementAccountInfo: "-",
    tickets: [],
  },

  // ── Membership order ─────────────────────────────────────────────────
  "#558712233": {
    title: "Gold Membership Plan - Annual",
    storeId: "#14852074",
    storeType: "Sub - Brand",
    membershipName: "Gold Membership Annual Plan",
    planType: "Gold",
    duration: "12 Months",
    startDate: "02/03/2026",
    endDate: "01/03/2027",
    benefits: "Unlimited access to all outlets, 10% discount on all vouchers",
    tagLine: "Unlock Unlimited Access",
    trydoodDiscount: "-₹ 600.00",
    membershipDiscount: "-₹ 456.00",
    couponCode: "GOLD10",
    paymentOptions: "Unified Payments Interface",
    paymentVia: "PhonePe App",
    customerEmail: "Itadoriyuji9987@gmail.com",
    customerNote: "This Spent Value And Number Of Claims Reflect Only Your Outlet's Data.",
    paymentTransactionId: "200236635002233",
    paymentDateTime: "Sun 02.Mar 2025 & 12:40 Pm",
    payVia: "PhonePe - Itadoriyuji-1-@ybl",
    receivedAccountInfo: "Trydood Account",
    settlementId: "Setl_MSk9QnFcYmNoPq",
    settlementDateTime: "Tue 04 .March 2025 & 06:00pm",
    settlementTransactionId: "019809179",
    settlementAccountInfo: "Kotak Mahindra Bank\n1234XXXXXXXX0941",
    tickets: [],
  },
};

function buildOrderDetail(row) {
  const extra = ORDER_DETAILS[row.orderId] || {};
  return { ...row, ...extra };
}

export const TRANSACTION_DATA = {
  voucher: {
    sectionTitle: "Voucher Overview",
    idLabel: "Voucher Id",
    tagLine: "Flat 25% OFF UP TO 500",
    overviewStats: [
      { label: "Overall Bill Value", value: "₹ 1200.00" },
      { label: "Overall Paid Amount", value: "₹ 874.00" },
      { label: "Discount Amount", value: "-₹ 338.00", negative: true },
      { label: "Additional discount", value: "-₹ 00.00", negative: true },
      { label: "Gst Amount", value: "₹ 00.00" },
    ],
    rows: [
      {
        orderId: "#558693214",
        customerName: "Okkutsu Yuta",
        customerCode: "#OY01229651",
        customerPhone: "+91 98840 12233",
        refId: "#VI368520159",
        createdOn: "30.Feb 2025 & 11:55 AM",
        outlet: "Anna Nagar, Chennai, TN.",
        amount: "₹ 1319.00",
        status: "Paid",
        paymentMethod: "Razor Pay",
        billAmount: "₹ 2256.00",
        paidAmount: "₹ 1319.00",
        discountAmount: "-₹ 752.00",
        additionalDiscount: "-₹ 00.00",
        gstAmount: "₹ 00.00",
      },
      {
        orderId: "#558694005",
        customerName: "Kugisaki Nobara",
        customerCode: "#KN78965414",
        customerPhone: "+91 90032 44521",
        refId: "#VI368520159",
        createdOn: "30.Feb 2025 & 11:55 AM",
        outlet: "T.Nagar, Chennai, TN.",
        amount: "₹ 3562.00",
        status: "Paid",
        paymentMethod: "Card",
        billAmount: "₹ 3900.00",
        paidAmount: "₹ 3562.00",
        discountAmount: "-₹ 338.00",
        additionalDiscount: "-₹ 00.00",
        gstAmount: "₹ 00.00",
      },
    ],
  },

  dealpack: {
    sectionTitle: "Deal Pack Overview",
    idLabel: "Deal Pack Id",
    tagLine: "Flat 25% OFF UP TO 500",
    overviewStats: [
      { label: "Overall Pack Value", value: "₹ 5400.00" },
      { label: "Overall Paid Amount", value: "₹ 4460.00" },
      { label: "Discount Amount", value: "-₹ 940.00", negative: true },
      { label: "Additional discount", value: "-₹ 00.00", negative: true },
      { label: "Gst Amount", value: "₹ 00.00" },
    ],
    rows: [
      {
        orderId: "#558701122",
        customerName: "Gojo Satoru",
        customerCode: "#GS44120987",
        customerPhone: "+91 99000 11223",
        refId: "#DP220145871",
        createdOn: "01.Mar 2025 & 09:20 AM",
        outlet: "Velachery, Chennai, TN.",
        amount: "₹ 2450.00",
        status: "Paid",
        paymentMethod: "UPI",
        billAmount: "₹ 2900.00",
        paidAmount: "₹ 2450.00",
        discountAmount: "-₹ 450.00",
        additionalDiscount: "-₹ 00.00",
        gstAmount: "₹ 00.00",
      },
      {
        orderId: "#558701456",
        customerName: "Fushiguro Megumi",
        customerCode: "#FM33210098",
        customerPhone: "+91 98123 45678",
        refId: "#DP220145871",
        createdOn: "01.Mar 2025 & 10:05 AM",
        outlet: "Adyar, Chennai, TN.",
        amount: "₹ 2010.00",
        status: "Pending",
        paymentMethod: "Cash",
        billAmount: "₹ 2500.00",
        paidAmount: "₹ 2010.00",
        discountAmount: "-₹ 490.00",
        additionalDiscount: "-₹ 00.00",
        gstAmount: "₹ 00.00",
      },
    ],
  },

  membership: {
    sectionTitle: "Membership Overview",
    idLabel: "Membership Id",
    overviewStats: [
      { label: "Overall Membership Value", value: "₹ 5300.00" },
      { label: "Overall Paid Amount", value: "₹ 4244.00" },
      { label: "Discount Amount", value: "-₹ 1056.00", negative: true },
      { label: "Additional discount", value: "-₹ 00.00", negative: true },
      { label: "Gst Amount", value: "₹ 00.00" },
    ],
    rows: [
      {
        orderId: "#558712233",
        customerName: "Itadori Yuji",
        customerCode: "#IY99871245",
        customerPhone: "+91 97654 32109",
        refId: "#MS110023456",
        createdOn: "02.Mar 2025 & 12:40 PM",
        outlet: "Nungambakkam, Chennai, TN.",
        amount: "₹ 4244.00",
        status: "Paid",
        paymentMethod: "UPI",
        billAmount: "₹ 5300.00",
        paidAmount: "₹ 4244.00",
        discountAmount: "-₹ 1056.00",
        additionalDiscount: "-₹ 00.00",
        gstAmount: "₹ 00.00",
      },
    ],
  },
};

// ─── Helper: order id se poora order + uska tab-type dhoondo ─────────────
// Detail page isi ko use karega — kisi bhi tab ke orderId se match karega.
// Order row ko ORDER_DETAILS ke extra fields (voucher/dealpack/membership
// terms, payments, tickets, timeline) ke saath merge karke deta hai, saath
// me uska TYPE_CONFIG bhi return karta hai taaki page ko pata ho kaunse
// fields aur kaunsa section-title/badge dikhana hai.
export function getOrderById(orderId) {
  for (const [tabKey, tabData] of Object.entries(TRANSACTION_DATA)) {
    const row = tabData.rows.find((r) => r.orderId === orderId);
    if (row) {
      return {
        tabKey,
        idLabel: tabData.idLabel,
        order: buildOrderDetail(row),
        typeConfig: TYPE_CONFIG[tabKey],
      };
    }
  }
  return null;
}