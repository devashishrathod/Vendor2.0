import { create } from "zustand";
import { STEPS } from "../constants/steps";

export const BASIC_SUB = { NAME: 1, REGISTRATION: 2, BUSINESS_TYPE: 3 };
export const BIZ_SUB   = { PAN_ENTER: 1, PAN_READONLY: 2, GST_ENTER: 3, GST_READONLY: 4 };
export const BANK_SUB  = { ENTER: 1, READONLY: 2 };  // NEW

const initialFormData = {
  businessName:            "",
  shortName:               "",
  isRegistered:            null,
  businessType:            "",
  pan:                     "",
  panDetails:              null,
  gstin:                   "",
  gstDetails:              null,
  systemVerified:          false,
  bankAccount:             "",
  bankIfsc:                "",
  bankHolderName:          "",
  bankDetails:             null,
  partnerContractAccepted: false,
};

export const useOnboardingStore = create((set) => ({
  currentStep:    STEPS.BASIC_DETAILS,
  currentSubStep: BASIC_SUB.NAME,
  formData:       { ...initialFormData },
  loading:        false,
  error:          null,

  goToStep: (step, subStep = 1) =>
    set({ currentStep: step, currentSubStep: subStep, error: null }),

  setSubStep: (subStep) => set({ currentSubStep: subStep, error: null }),

  nextStep: () =>
    set((s) => ({ currentStep: s.currentStep + 1, currentSubStep: 1, error: null })),

  prevStep: () =>
    set((s) => ({
      currentStep:    Math.max(1, s.currentStep - 1),
      currentSubStep: 1,
      error:          null,
    })),

  setField: (key, value) =>
    set((s) => ({ formData: { ...s.formData, [key]: value } })),

  setLoading: (loading) => set({ loading }),
  setError:   (error)   => set({ error }),

  setPanDetails:  (data) => set((s) => ({ formData: { ...s.formData, panDetails: data } })),
  setGstDetails:  (data) => set((s) => ({ formData: { ...s.formData, gstDetails: data } })),
  setBankDetails: (data) => set((s) => ({ formData: { ...s.formData, bankDetails: data } })),

  reset: () => set({
    currentStep:    STEPS.BASIC_DETAILS,
    currentSubStep: BASIC_SUB.NAME,
    formData:       { ...initialFormData },
    error:          null,
    loading:        false,
  }),
}));