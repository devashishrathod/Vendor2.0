import { Building2, Receipt, Store } from "lucide-react";
import { KYC_PATHS } from "../../config/screens";

// The three cards of guide §4.3.
export const STATUS_OPTIONS = [
  {
    kycPath: KYC_PATHS.GST,
    icon: Receipt,
    description: "GSTIN for this business, any business entity.",
    pill: "Fastest · 1 number fills most details",
    verified: true,
    nextItems: [
      "GSTIN (verified instantly)",
      "Business PAN (filled from your GSTIN)",
      "Business entity (taken from GST)",
      "Business documents · optional",
    ],
  },
  {
    kycPath: KYC_PATHS.NO_GST,
    icon: Building2,
    description: "Company, LLP, firm, trust or society without a GSTIN yet.",
    pill: "Business or personal PAN",
    verified: true,
    nextItems: [
      "Business or personal PAN (verified instantly)",
      "Business entity (suggested from your PAN)",
      "Business documents · optional",
    ],
  },
  {
    kycPath: KYC_PATHS.UNREGISTERED,
    icon: Store,
    description: "Small shop, home business or new venture.",
    pill: "No GST needed",
    verified: false,
    nextItems: ["Owner verification (PAN or an ID)", "Business entity: Proprietorship, set automatically", "Business documents · optional"],
  },
];

