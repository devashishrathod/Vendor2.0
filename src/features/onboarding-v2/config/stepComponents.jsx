import PartnerContractStep from "../steps/agreement/PartnerContractStep";
import BrandNameStep from "../steps/basics/BrandNameStep";
import BusinessStatusStep from "../steps/basics/BusinessStatusStep";
import CategoryStep from "../steps/basics/CategoryStep";
import BankEnterStep from "../steps/payout/BankEnterStep";
import BankReviewStep from "../steps/payout/BankReviewStep";
import BusinessTypeStep from "../steps/verification/BusinessTypeStep";
import DocumentsStep from "../steps/verification/DocumentsStep";
import GstEnterStep from "../steps/verification/GstEnterStep";
import GstReviewStep from "../steps/verification/GstReviewStep";
import OwnerKycReviewStep from "../steps/verification/OwnerKycReviewStep";
import OwnerKycStep from "../steps/verification/OwnerKycStep";
import OwnerPanEnterStep from "../steps/verification/OwnerPanEnterStep";
import OwnerPanReviewStep from "../steps/verification/OwnerPanReviewStep";
import PanEnterStep from "../steps/verification/PanEnterStep";
import PanReviewStep from "../steps/verification/PanReviewStep";
import { SCREENS } from "./onboardingFlow";

// Screen id → the element that renders it inside the onboarding shell.
// Screens with a `route` (plan, payment, outlet) are pages, not listed here.
export const STEP_ELEMENTS = {
  [SCREENS.BRAND_NAME]: <BrandNameStep />,
  [SCREENS.CATEGORY]: <CategoryStep />,
  [SCREENS.BUSINESS_STATUS]: <BusinessStatusStep />,
  [SCREENS.GST_ENTER]: <GstEnterStep />,
  [SCREENS.GST_REVIEW]: <GstReviewStep />,
  [SCREENS.PAN_ENTER]: <PanEnterStep />,
  [SCREENS.PAN_REVIEW]: <PanReviewStep />,
  [SCREENS.BUSINESS_TYPE]: <BusinessTypeStep />,
  [SCREENS.OWNER_PAN]: <OwnerPanEnterStep />,
  [SCREENS.OWNER_PAN_REVIEW]: <OwnerPanReviewStep />,
  [SCREENS.OWNER_KYC]: <OwnerKycStep />,
  [SCREENS.OWNER_KYC_REVIEW]: <OwnerKycReviewStep />,
  [SCREENS.DOCUMENTS]: <DocumentsStep />,
  [SCREENS.BANK_ENTER]: <BankEnterStep />,
  [SCREENS.BANK_REVIEW]: <BankReviewStep />,
  [SCREENS.PARTNER_CONTRACT]: <PartnerContractStep />,
};
