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

export const MAX_SUB = {
  [STEPS.BASIC_DETAILS]:         3,
  [STEPS.BUSINESS_VERIFICATION]: 4,
  [STEPS.BANK_VERIFICATION]:     2,
  [STEPS.SYSTEM_VERIFY]:         1,
  [STEPS.PARTNER_CONTRACT]:      1,
};

export const STEP_ORDER = [
  STEPS.BASIC_DETAILS,
  STEPS.BUSINESS_VERIFICATION,
  STEPS.BANK_VERIFICATION,
  STEPS.SYSTEM_VERIFY,
  STEPS.PARTNER_CONTRACT,
];

const ALL_POSITIONS = STEP_ORDER.flatMap((step) =>
  Array.from({ length: MAX_SUB[step] ?? 1 }, (_, i) => ({
    step,
    subStep: i + 1,
  }))
);

function positionIndex(step, subStep) {
  return ALL_POSITIONS.findIndex(
    (p) => p.step === step && p.subStep === subStep
  );
}

const STEP_TO_SCREEN = {
  "1:1": "BUSINESS_NAME",
  "1:2": "REGISTRATION_STATUS",
  "1:3": "REGISTRATION_ENTITY_TYPE",
  "2:1": "PAN_VERIFICATION",
  "2:2": "PAN_READONLY",
  "2:3": "GST_VERIFICATION",
  "2:4": "GST_READONLY",
  "3:1": "BANK_VERIFICATION",
  "3:2": "BANK_READONLY",
  "4:1": "SYSTEM_VERIFICATION",
  "5:1": "PARTNERSHIP_DEED",
};

function syncAuthScreen(step, subStep) {
  const screen = STEP_TO_SCREEN[`${step}:${subStep}`];
  if (!screen) return;
  import("./authStore").then(({ useAuthStore }) => {
    useAuthStore.getState().advanceScreen(screen);
  });
}

// ✅ CHANGED: PARTNER_CONTRACT complete ho to kabhi back nahi
export function computeCanGoBack({ currentStep, currentSubStep, completedKeys }) {
  if (completedKeys.includes(`${STEPS.PARTNER_CONTRACT}:1`)) return false;
  const currentIdx = positionIndex(currentStep, currentSubStep);
  if (currentIdx <= 0) return false;
  if (completedKeys.length > 0) return false;
  return true;
}

export const useOnboardingStore = create(
  persist(
    (set, get) => ({
      currentStep:    STEPS.BASIC_DETAILS,
      currentSubStep: BASIC_SUB.BUSINESS_NAME,
      formData:       { ...initialFormData },
      loading:        false,
      error:          null,
      completedKeys:  [],
      verificationFailedChecks: [],
      returnToStepAfterEdit: null,

      markComplete: (step, subStep) =>
        set((s) => {
          const key = `${step}:${subStep}`;
          if (s.completedKeys.includes(key)) return {};
          return { completedKeys: [...s.completedKeys, key] };
        }),

      markStepComplete: (step) =>
        set((s) => {
          const max     = MAX_SUB[step] ?? 1;
          const newKeys = [];
          for (let i = 1; i <= max; i++) {
            const key = `${step}:${i}`;
            if (!s.completedKeys.includes(key)) newKeys.push(key);
          }
          if (newKeys.length === 0) return {};
          return { completedKeys: [...s.completedKeys, ...newKeys] };
        }),

      isCompleted: (step, subStep) =>
        get().completedKeys.includes(`${step}:${subStep}`),

      isStepFullyCompleted: (step) => {
        const maxSub = MAX_SUB[step] ?? 1;
        const keys   = get().completedKeys;
        for (let i = 1; i <= maxSub; i++) {
          if (!keys.includes(`${step}:${i}`)) return false;
        }
        return true;
      },

      isSubStepLocked: (step, subStep) =>
        get().completedKeys.includes(`${step}:${subStep}`),

      canGoBack: () => computeCanGoBack(get()),

      goBack: () =>
        set((s) => {
          if (!computeCanGoBack(s)) return {};

          const currentIdx = positionIndex(s.currentStep, s.currentSubStep);
          if (currentIdx <= 0) return {};

          for (let i = currentIdx - 1; i >= 0; i--) {
            const { step, subStep } = ALL_POSITIONS[i];
            if (!s.completedKeys.includes(`${step}:${subStep}`)) {
              return { currentStep: step, currentSubStep: subStep, error: null };
            }
          }

          return {};
        }),

      goToStep: (step, subStep = 1) => {
        syncAuthScreen(step, subStep);
        set({ currentStep: step, currentSubStep: subStep, error: null });
      },

      setSubStep: (subStep) => {
        const step = get().currentStep;
        syncAuthScreen(step, subStep);
        set({ currentSubStep: subStep, error: null });
      },

      nextStep: () =>
        set((s) => {
          const newStep = s.currentStep + 1;
          syncAuthScreen(newStep, 1);
          return { currentStep: newStep, currentSubStep: 1, error: null };
        }),

      prevStep: () =>
        set((s) => ({
          currentStep:    Math.max(1, s.currentStep - 1),
          currentSubStep: 1,
          error:          null,
        })),

      canNavigateToStep: (step) => {
        const s = get();
        const systemVerifyDone = s.isCompleted(STEPS.SYSTEM_VERIFY, 1);
        if (systemVerifyDone) return step === STEPS.PARTNER_CONTRACT;
        return step === s.currentStep;
      },

      setField: (key, value) =>
        set((s) => ({ formData: { ...s.formData, [key]: value } })),

      setLoading: (loading) => set({ loading }),
      setError:   (error)   => set({ error }),

      setPanDetails:  (data) => set((s) => ({ formData: { ...s.formData, panDetails:  data } })),
      setGstDetails:  (data) => set((s) => ({ formData: { ...s.formData, gstDetails:  data } })),
      setBankDetails: (data) => set((s) => ({ formData: { ...s.formData, bankDetails: data } })),
      setBrandId:     (id)   => set((s) => ({ formData: { ...s.formData, brandId:     id   } })),

      setVerificationFailedChecks: (failedKeys) =>
        set({ verificationFailedChecks: failedKeys }),

      setReturnToStepAfterEdit: (step, subStep = 1) =>
        set({ returnToStepAfterEdit: step != null ? { step, subStep } : null }),

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
        verificationFailedChecks: state.verificationFailedChecks,
        returnToStepAfterEdit:    state.returnToStepAfterEdit,
      }),
    },
  ),
);