import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STEPS } from "../constants/steps";

export const BASIC_SUB = {
  BUSINESS_NAME:            1,
  REGISTRATION_STATUS:      2,
  REGISTRATION_ENTITY_TYPE: 3,
};

export const BIZ_SUB = {
  PAN_VERIFICATION: 1,
  PAN_READONLY:     2,
  GST_VERIFICATION: 3,
  GST_READONLY:     4,
};

export const BANK_SUB = {
  BANK_VERIFICATION: 1,
  BANK_READONLY:     2,
};

export const SYSTEM_SUB  = { SYSTEM_VERIFICATION: 1 };
export const PARTNER_SUB = { PARTNERSHIP_DEED: 1 };

// Which failed check key maps to which step for "Edit" navigation
export const FAILED_CHECK_STEP_MAP = {
  pan:       { step: STEPS.BUSINESS_VERIFICATION, subStep: BIZ_SUB.PAN_VERIFICATION },
  gst:       { step: STEPS.BUSINESS_VERIFICATION, subStep: BIZ_SUB.GST_VERIFICATION },
  panGst:    { step: STEPS.BUSINESS_VERIFICATION, subStep: BIZ_SUB.PAN_VERIFICATION },
  bank:      { step: STEPS.BANK_VERIFICATION,     subStep: BANK_SUB.BANK_VERIFICATION },
  entity:    { step: STEPS.BUSINESS_VERIFICATION, subStep: BIZ_SUB.PAN_VERIFICATION },
  duplicate: { step: STEPS.BUSINESS_VERIFICATION, subStep: BIZ_SUB.PAN_VERIFICATION },
};

const initialFormData = {
  brandId:                 null,
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

const MAX_SUB = {
  [STEPS.BASIC_DETAILS]:         3,
  [STEPS.BUSINESS_VERIFICATION]: 4,
  [STEPS.BANK_VERIFICATION]:     2,
  [STEPS.SYSTEM_VERIFY]:         1,
  [STEPS.PARTNER_CONTRACT]:      1,
};

export const useOnboardingStore = create(
  persist(
    (set, get) => ({
      currentStep:    STEPS.BASIC_DETAILS,
      currentSubStep: BASIC_SUB.BUSINESS_NAME,
      formData:       { ...initialFormData },
      loading:        false,
      error:          null,

      // completed steps track karne ke liye
      completedKeys: [],

      // ✅ NEW: verification ke baad failed/warned check keys store karo
      // e.g. ["pan", "bank"] — in steps pe warning icon show hoga sidebar mein
      verificationFailedChecks: [],

      // ✅ NEW: edit ke baad system verify pe wapas aana hai
      // null = normal flow, STEPS.SYSTEM_VERIFY = edit ke baad return
      returnToStepAfterEdit: null,

      // Ek step/subStep ko complete mark karo
      markComplete: (step, subStep) =>
        set((s) => {
          const key = `${step}:${subStep}`;
          if (s.completedKeys.includes(key)) return {};
          return { completedKeys: [...s.completedKeys, key] };
        }),

      // Check karo kya step:subStep complete hai
      isCompleted: (step, subStep) => {
        const key = `${step}:${subStep}`;
        return get().completedKeys.includes(key);
      },

      goToStep: (step, subStep = 1) =>
        set({ currentStep: step, currentSubStep: subStep, error: null }),

      setSubStep: (subStep) => set({ currentSubStep: subStep, error: null }),

      nextStep: () =>
        set((s) => ({
          currentStep:    s.currentStep + 1,
          currentSubStep: 1,
          error:          null,
        })),

      prevStep: () =>
        set((s) => ({
          currentStep:    Math.max(1, s.currentStep - 1),
          currentSubStep: 1,
          error:          null,
        })),

      goBack: () =>
        set((s) => {
          const { currentStep, currentSubStep } = s;
          if (currentSubStep > 1) {
            return { currentSubStep: currentSubStep - 1, error: null };
          }
          if (currentStep <= STEPS.BASIC_DETAILS) {
            return {};
          }
          const prevStep    = currentStep - 1;
          const prevSubStep = MAX_SUB[prevStep] ?? 1;
          return { currentStep: prevStep, currentSubStep: prevSubStep, error: null };
        }),

      setField: (key, value) =>
        set((s) => ({ formData: { ...s.formData, [key]: value } })),

      setLoading: (loading) => set({ loading }),
      setError:   (error)   => set({ error }),

      setPanDetails:  (data) => set((s) => ({ formData: { ...s.formData, panDetails:  data } })),
      setGstDetails:  (data) => set((s) => ({ formData: { ...s.formData, gstDetails:  data } })),
      setBankDetails: (data) => set((s) => ({ formData: { ...s.formData, bankDetails: data } })),
      setBrandId:     (id)   => set((s) => ({ formData: { ...s.formData, brandId:     id   } })),

      // ✅ NEW: verification result set karo — failed/warned check keys save karo
      setVerificationFailedChecks: (failedKeys) =>
        set({ verificationFailedChecks: failedKeys }),

      // ✅ NEW: edit ke baad return target set karo
      setReturnToStepAfterEdit: (step, subStep = 1) =>
        set({ returnToStepAfterEdit: step != null ? { step, subStep } : null }),

      // ✅ NEW: return target clear karo
      clearReturnToStepAfterEdit: () =>
        set({ returnToStepAfterEdit: null }),

      reset: () =>
        set({
          currentStep:              STEPS.BASIC_DETAILS,
          currentSubStep:           BASIC_SUB.BUSINESS_NAME,
          formData:                 { ...initialFormData },
          completedKeys:            [],
          verificationFailedChecks: [],
          returnToStepAfterEdit:    null,
          error:                    null,
          loading:                  false,
        }),
    }),
    {
      name:    "onboarding-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep:              state.currentStep,
        currentSubStep:           state.currentSubStep,
        formData:                 state.formData,
        completedKeys:            state.completedKeys,
        verificationFailedChecks: state.verificationFailedChecks,  // ✅ persist
        returnToStepAfterEdit:    state.returnToStepAfterEdit,      // ✅ persist
      }),
    },
  ),
);