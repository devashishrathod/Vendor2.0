import { useOnboardingStore, BASIC_SUB, BIZ_SUB } from "../store/onboardingStore";
import { STEPS } from "../constants/steps";
import {
  validateBusinessName, validatePAN, validateGST, validateBankDetails,
} from "../validation";

export function useOnboarding() {
  const store = useOnboardingStore();
  const {
    formData, setField, setLoading, setError,
    nextStep, goToStep, setSubStep,
    setPanDetails, setGstDetails, setBankDetails,
  } = store;

  // ── BASIC DETAILS sub-steps ───────────────────────────────────────────────

  const submitBusinessName = () => {
    const err = validateBusinessName(formData.businessName);
    if (err) return setError(err);
    setError(null);
    setSubStep(BASIC_SUB.REGISTRATION);           // → sub-step 2
  };

  const selectRegistration = (isRegistered) => {
    setField("isRegistered", isRegistered);
    if (isRegistered) setSubStep(BASIC_SUB.BUSINESS_TYPE); // → sub-step 3
    // unregistered → blocking modal handled in UI
  };

  const selectBusinessType = (type) => {
    setField("businessType", type);
    setError(null);
  };

  const submitBusinessType = () => {
    if (!formData.businessType) return setError("Please select a business type");
    nextStep(); // BASIC_DETAILS → BUSINESS_VERIFICATION (sub 1: PAN_ENTER)
  };

  // ── BUSINESS VERIFICATION sub-steps ──────────────────────────────────────

  const fetchPANDetails = async () => {
    const err = validatePAN(formData.pan);
    if (err) return setError(err);
    setLoading(true);
    try {
      const mockData = {
        panNumber: formData.pan.toUpperCase(),
        name: "ABC PRIVATE LIMITED",
        dateOfIncorporation: "15/06/2020",
        status: "Active",
        panType: "Company",
      };
      setPanDetails(mockData);
      setError(null);
      setSubStep(BIZ_SUB.PAN_READONLY);           // → sub-step 2
    } catch (e) {
      setError(e.message || "PAN not found or invalid");
    } finally {
      setLoading(false);
    }
  };

  const continuePAN = () => setSubStep(BIZ_SUB.GST_ENTER); // → sub-step 3

  const fetchGSTDetails = async () => {
    const err = validateGST(formData.gstin);
    if (err) return setError(err);
    setLoading(true);
    try {
      const mockData = {
        gstin: formData.gstin.toUpperCase(),
        legalName: "ABC PRIVATE LIMITED",
        tradeName: "ABC PRIVATE LIMITED",
        registrationDate: "15/06/2020",
        gstType: "Regular",
        status: "Active",
      };
      setGstDetails(mockData);
      setError(null);
      setSubStep(BIZ_SUB.GST_READONLY);           // → sub-step 4
    } catch (e) {
      setError(e.message || "GST not found or invalid");
    } finally {
      setLoading(false);
    }
  };

  const continueGST = () => nextStep(); // BUSINESS_VERIFICATION → SYSTEM_VERIFY

  // ── Remaining steps (unchanged logic) ────────────────────────────────────

  const runSystemVerification = async () => {
    setLoading(true);
    try {
      setField("systemVerified", true);
      nextStep(); // → BANK_ENTER
    } catch (e) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    const errors = validateBankDetails({
      accountNumber:     formData.bankAccount,
      ifsc:              formData.bankIfsc,
      accountHolderName: formData.bankHolderName,
    });
    if (errors) return setError(Object.values(errors)[0]);
    setLoading(true);
    try {
      const mockData = {
        bankName:          "HDFC BANK",
        accountNumber:     formData.bankAccount,
        ifscCode:          formData.bankIfsc.toUpperCase(),
        accountHolderName: formData.bankHolderName,
        accountType:       "Current Account",
      };
      setBankDetails(mockData);
      setError(null);
      nextStep(); // → BANK_READONLY
    } catch (e) {
      setError(e.message || "Bank verification failed");
    } finally {
      setLoading(false);
    }
  };

  const continueBank = () => nextStep(); // → PARTNER_CONTRACT

  return {
    ...store,
    submitBusinessName,
    selectRegistration,
    selectBusinessType,
    submitBusinessType,
    fetchPANDetails,
    continuePAN,
    fetchGSTDetails,
    continueGST,
    runSystemVerification,
    fetchBankDetails,
    continueBank,
  };
}