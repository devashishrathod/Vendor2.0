import {
  useOnboardingStore,
  BASIC_SUB,
  BIZ_SUB,
  BANK_SUB,
} from "../store/onboardingStore";
import {
  validateBusinessName,
  validateShortName,
  validatePAN,
  validateGST,
  validateBankDetails,
} from "../validation";

export function useOnboarding() {
  const store = useOnboardingStore();
  const {
    formData,
    setField,
    setLoading,
    setError,
    nextStep,
    goToStep,
    setSubStep,
    setPanDetails,
    setGstDetails,
    setBankDetails,
  } = store;

  // ── BASIC DETAILS (Step 1) ────────────────────────────────────────────────
  const submitBusinessName = () => {
    const nErr = validateBusinessName(formData.businessName);
    if (nErr) return setError(nErr);
    setError(null);
    setSubStep(BASIC_SUB.REGISTRATION);
  };

  const selectRegistration = (isRegistered) => {
    setField("isRegistered", isRegistered);
    if (isRegistered) setSubStep(BASIC_SUB.BUSINESS_TYPE);
    // unregistered → blocking modal handled in UI
  };

  const selectBusinessType = (type) => {
    setField("businessType", type);
    setError(null);
  };

  const submitBusinessType = () => {
    if (!formData.businessType)
      return setError("Please select a business type");
    nextStep(); // → BUSINESS_VERIFICATION
  };

  // ── BUSINESS VERIFICATION (Step 2) ───────────────────────────────────────
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
      setSubStep(BIZ_SUB.PAN_READONLY);
    } catch (e) {
      setError(e.message || "PAN not found or invalid");
    } finally {
      setLoading(false);
    }
  };

  const continuePAN = () => setSubStep(BIZ_SUB.GST_ENTER);

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
      setSubStep(BIZ_SUB.GST_READONLY);
    } catch (e) {
      setError(e.message || "GST not found or invalid");
    } finally {
      setLoading(false);
    }
  };

  const continueGST = () => nextStep(); // → SYSTEM_VERIFY

  // ── SYSTEM VERIFY (Step 3) ────────────────────────────────────────────────
  const runSystemVerification = async () => {
    setLoading(true);
    try {
      setField("systemVerified", true);
      nextStep(); // → BANK_VERIFICATION
    } catch (e) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ── BANK VERIFICATION (Step 4) ────────────────────────────────────────────
  const fetchBankDetails = async () => {
    const errors = validateBankDetails({
      accountNumber: formData.bankAccount,
      ifsc: formData.bankIfsc,
      accountHolderName: formData.bankHolderName,
    });
    if (errors) return setError(Object.values(errors)[0]);
    setLoading(true);
    try {
      const mockData = {
        bankName: "HDFC BANK",
        accountNumber: formData.bankAccount,
        ifscCode: formData.bankIfsc.toUpperCase(),
        accountHolderName: formData.bankHolderName,
        accountType: "Current Account",
      };
      setBankDetails(mockData);
      setError(null);
      setSubStep(BANK_SUB.READONLY); // → Bank ReadOnly (sub-step 2)
    } catch (e) {
      setError(e.message || "Bank verification failed");
    } finally {
      setLoading(false);
    }
  };

  const continueBank = () => nextStep(); // → PARTNER_CONTRACT (Step 5 = last)

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
