export const TRANSACTION_TYPES = [
  { value: "overall", label: "Overall Transaction" },
  { value: "voucher", label: "Voucher Transaction" },
  // Deal Pack / Membership hidden — no backend for those transaction
  // types yet (same reasoning as transactionData.js's TRANSACTION_TABS).
  // { value: "deal_pack", label: "Deal Pack Transaction" },
  // { value: "membership", label: "Membership Transaction" },
  { value: "gst", label: "GST Transaction" },
];
