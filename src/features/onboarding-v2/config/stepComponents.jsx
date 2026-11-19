import PartnerContractStep from "../steps/agreement/PartnerContractStep";
import BrandNameStep from "../steps/basics/BrandNameStep";
import BusinessStatusStep from "../steps/basics/BusinessStatusStep";
import CategoryStep from "../steps/basics/CategoryStep";
import BankEnterStep from "../steps/payout/BankEnterStep";
import BusinessTypeStep from "../steps/verification/BusinessTypeStep";
import DocumentsStep from "../steps/verification/DocumentsStep";
import GstEnterStep from "../steps/verification/GstEnterStep";
import OwnerKycStep from "../steps/verification/OwnerKycStep";
import PanEnterStep from "../steps/verification/PanEnterStep";
import { SCREENS } from "./screens";

// Server screen → the element that renders it inside the onboarding shell.
// A verify → review pair (GST, PAN, bank) is ONE server screen; the review is
// a panel sub-step inside that screen's component. Screens on other pages
// (plan, brand outlet, under review, dashboard) are not listed here.
export const STEP_ELEMENTS = {
  [SCREENS.BRAND_NAME]: <BrandNameStep />,
  [SCREENS.BUSINESS_CATEGORY]: <CategoryStep />,
  [SCREENS.REGISTRATION_STATUS]: <BusinessStatusStep />,
  [SCREENS.GST_VERIFICATION]: <GstEnterStep />,
  [SCREENS.PAN_VERIFICATION]: <PanEnterStep />,
  [SCREENS.REGISTRATION_ENTITY_TYPE]: <BusinessTypeStep />,
  [SCREENS.OWNER_VERIFICATION]: <OwnerKycStep />,
  [SCREENS.KYC_DOCUMENTS]: <DocumentsStep />,
  [SCREENS.BANK_VERIFICATION]: <BankEnterStep />,
  [SCREENS.PARTNERSHIP_DEED]: <PartnerContractStep />,
};
