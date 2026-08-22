// src/services/settlementService.js
// Mock data layer for the Settlement module.
// Swap the resolved values here for real API calls (fetch/axios) when the
// backend endpoints are ready — the shape returned is what the hooks expect.

const delay = (ms = 350) => new Promise((res) => setTimeout(res, ms));

const OVERVIEW = {
  updatedLabel: "Just Now",
  previousSettlement: { amount: 45826.0, note: "Deposited on Feb 3, 2026" },
  todaySettlement: { amount: 27260.0, note: "Update Soon" },
  availableBalance: { amount: 2738.0, note: "Live Update", count: 0 },
  gstBalance: { amount: 899.0, note: "Live Update", count: 0 },
};

const LATEST_BANNER = {
  amount: 45826.0,
  label: "Wednesday Settlements Done",
  settlementId: "sett_58aI3QnfcYatMb",
  dateRange: "30 Feb 2025 & 11:55 AM",
};

const HOLIDAY_NOTICE = {
  title: "Happy Merry Christmas! 🎄",
  message:
    "December 25 is a bank holiday. So, your settlement amount will be settled on the next workday.",
};

const SETTLEMENTS = [
  {
    settlementId: "sett_58aI3QnfcYatMb",
    paymentReceivedDate: "28 Feb 2025",
    settlementOn: "02 March 2025",
    transactionId: "0080935",
    amount: 45826.0,
    status: "Settlement done",
    breakup: {
      discountSummary: 10536.0,
      bestPackSummary: 32107.0,
      membershipSummary: 589.0,
      gstSummary: 6900.0,
      processingFee: 0.0,
      serviceCharge: 0.0,
      paidAmount: 45826.0,
    },
  },
  {
    settlementId: "sett_58aI3QnfcYatMb",
    paymentReceivedDate: "27 Feb 2025",
    settlementOn: "01 March 2025",
    transactionId: "0080832",
    amount: 14082.0,
    status: "Settlement done",
    breakup: {
      discountSummary: 3210.0,
      bestPackSummary: 9800.0,
      membershipSummary: 150.0,
      gstSummary: 922.0,
      processingFee: 0.0,
      serviceCharge: 0.0,
      paidAmount: 14082.0,
    },
  },
  {
    settlementId: "sett_58aIya86fatMb",
    paymentReceivedDate: "26 Feb 2025",
    settlementOn: "28 Feb 2025",
    transactionId: "0080691",
    amount: 23180.0,
    status: "Settlement done",
    breakup: {
      discountSummary: 4210.0,
      bestPackSummary: 15900.0,
      membershipSummary: 320.0,
      gstSummary: 2750.0,
      processingFee: 0.0,
      serviceCharge: 0.0,
      paidAmount: 23180.0,
    },
  },
  {
    settlementId: "sett_3BuiO3sD4pT",
    paymentReceivedDate: "25 Feb 2025",
    settlementOn: "27 Feb 2025",
    transactionId: "0080510",
    amount: 58930.0,
    status: "Settlement done",
    breakup: {
      discountSummary: 12040.0,
      bestPackSummary: 38900.0,
      membershipSummary: 610.0,
      gstSummary: 7380.0,
      processingFee: 0.0,
      serviceCharge: 0.0,
      paidAmount: 58930.0,
    },
  },
];

const TRANSACTION_INFO = {
  collectionPayment: {
    dateTime: "Sat 20 Jan 2025 & 2:44AM",
    paymentPlatform: "Razor Pay",
    paymentStructure: "Hybrid App",
  },
  vendorPayout: {
    dateTime: "Mon, 03 March 2025 & 05:35pm",
    creditBank: "ICIC bank (NPS)",
  },
  settlementDone: {
    dateTime: "Mon, 01 March 2025 & 07:45pm",
    settlementTransactionId: "sett_58aI3QnfcYatMb",
    transactionId: "0080935",
  },
};

const TICKETS = [
  {
    id: "4092489466",
    date: "08/13/2024",
    customerInfo: "",
    nextSteps: "",
    resources: [],
  },
  {
    id: "4062489000",
    date: "07/24/2024",
    customerInfo:
      "We are reviewing your payment purpose message to be sufficiently explicit that the use of protected resources, purpose strings must clearly and exhaustively describe the exact use of data and, if most cases, provide an example of the field being used.",
    nextSteps:
      "Update the pixel/factory purpose string to explain that the app will collect the requested information and provide a specific example of how this data will be used, then let the attached screenshot.",
    resources: [
      { label: "Approved file to access your Customer", action: "Download File" },
      { label: "App receipts of microphone access", action: "Screenshots" },
    ],
    footnote: "See examples of helpful, informative purpose strings",
  },
];

const SETTLEMENT_DETAIL = {
  settlementId: "sett_58aI3QnfcYatMb",
  toCreditAmount: 45825.0,
  settlementBankName: "First Karnataka bank",
  settlementAccountNo: "6294032747XXXXX",
  status: "Settlement Done",
  breakup: {
    discountSummary: 10536.0,
    bestPackSummary: 32107.0,
    membershipSummary: 589.0,
    gstSummary: 6900.0,
    processingFee: 0.0,
    serviceFee: 0.0,
    transferNote: "Your Transfer Amount was less than expected",
    verified: true,
  },
  transactionInfo: TRANSACTION_INFO,
  tickets: TICKETS,
};

export async function fetchSettlementOverview() {
  await delay();
  return { overview: OVERVIEW, banner: LATEST_BANNER, holidayNotice: HOLIDAY_NOTICE };
}

export async function fetchSettlements({ page = 1, pageSize = 10, search = "" } = {}) {
  await delay();
  const filtered = SETTLEMENTS.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.settlementId.toLowerCase().includes(q) ||
      s.transactionId.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q) ||
      String(s.amount).includes(q)
    );
  });
  const start = (page - 1) * pageSize;
  return {
    rows: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function fetchSettlementDetails(settlementId) {
  await delay();
  return { ...SETTLEMENT_DETAIL, settlementId: settlementId || SETTLEMENT_DETAIL.settlementId };
}

export async function raiseTicket(payload) {
  await delay();
  return { success: true, ticketId: String(Date.now()), ...payload };
}
