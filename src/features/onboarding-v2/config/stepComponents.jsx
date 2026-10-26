import BankDetailsStep from "../steps/bank/BankDetailsStep";
import BusinessNameStep from "../steps/basic/BusinessNameStep";
import CategoryStep from "../steps/basic/CategoryStep";
import EntityTypeStep from "../steps/basic/EntityTypeStep";
import RegistrationStatusStep from "../steps/basic/RegistrationStatusStep";
import BusinessDocumentsStep from "../steps/documents/BusinessDocumentsStep";
import PartnerContractStep from "../steps/PartnerContractStep";
import { bankConfig } from "../steps/verification/bank.config";
import { gstConfig } from "../steps/verification/gst.config";
import { panConfig } from "../steps/verification/pan.config";
import VerifyDetailsStep from "../steps/verification/VerifyDetailsStep";
import VerifyEnterStep from "../steps/verification/VerifyEnterStep";
import { SCREENS } from "./onboardingFlow";

// Screen id → the element that renders it. Kept apart from
// onboardingFlow.js so the flow config stays plain data.
export const STEP_ELEMENTS = {
  [SCREENS.BUSINESS_NAME]: <BusinessNameStep />,
  [SCREENS.BUSINESS_CATEGORY]: <CategoryStep />,
  [SCREENS.REGISTRATION_STATUS]: <RegistrationStatusStep />,
  [SCREENS.ENTITY_TYPE]: <EntityTypeStep />,
  [SCREENS.PAN_VERIFICATION]: <VerifyEnterStep config={panConfig} />,
  [SCREENS.PAN_REVIEW]: <VerifyDetailsStep config={panConfig} />,
  [SCREENS.GST_VERIFICATION]: <VerifyEnterStep config={gstConfig} />,
  [SCREENS.GST_REVIEW]: <VerifyDetailsStep config={gstConfig} />,
  [SCREENS.BUSINESS_DOCUMENTS]: <BusinessDocumentsStep />,
  [SCREENS.BANK_VERIFICATION]: <BankDetailsStep />,
  [SCREENS.BANK_REVIEW]: <VerifyDetailsStep config={bankConfig} />,
  [SCREENS.PARTNER_CONTRACT]: <PartnerContractStep />,
};
