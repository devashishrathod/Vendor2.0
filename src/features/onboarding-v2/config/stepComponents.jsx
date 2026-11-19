import PartnerContractStep from "../steps/agreement/PartnerContractStep";
import BrandNameStep from "../steps/basics/BrandNameStep";
import BusinessStatusStep from "../steps/basics/BusinessStatusStep";
import CategoryStep from "../steps/basics/CategoryStep";
import BankVerificationStep from "../steps/payout/BankVerificationStep";
import BusinessTypeStep from "../steps/verification/BusinessTypeStep";
import DocumentsStep from "../steps/verification/DocumentsStep";
import GstVerificationStep from "../steps/verification/GstVerificationStep";
import OwnerVerificationStep from "../steps/verification/OwnerVerificationStep";
import PanVerificationStep from "../steps/verification/PanVerificationStep";
import { SCREENS } from "./screens";

// Server screen → the element that renders it inside the onboarding shell.
// A verify → review pair (GST, PAN, bank) is ONE server screen; the review is
// a panel sub-step inside that screen's component. Screens on other pages
// (plan, brand outlet, under review, dashboard) are not listed here.
export const STEP_ELEMENTS = {
  [SCREENS.BRAND_NAME]: <BrandNameStep />,
  [SCREENS.BUSINESS_CATEGORY]: <CategoryStep />,
  [SCREENS.REGISTRATION_STATUS]: <BusinessStatusStep />,
  [SCREENS.GST_VERIFICATION]: <GstVerificationStep />,
  [SCREENS.PAN_VERIFICATION]: <PanVerificationStep />,
  [SCREENS.REGISTRATION_ENTITY_TYPE]: <BusinessTypeStep />,
  [SCREENS.OWNER_VERIFICATION]: <OwnerVerificationStep />,
  [SCREENS.KYC_DOCUMENTS]: <DocumentsStep />,
  [SCREENS.BANK_VERIFICATION]: <BankVerificationStep />,
  [SCREENS.PARTNERSHIP_DEED]: <PartnerContractStep />,
};
