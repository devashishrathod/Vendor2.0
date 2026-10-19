// GA4 event names for the vendor funnel: login → onboarding steps →
// subscription → outlet setup → review → dashboard. `login`, `sign_up`,
// `begin_checkout` and `purchase` are GA4 recommended events, so GA's own
// reports pick them up without any custom setup.
export const ANALYTICS_EVENTS = Object.freeze({
  OTP_REQUESTED:            "otp_requested",
  LOGIN:                    "login",
  SIGN_UP:                  "sign_up",
  ONBOARDING_STEP_VIEW:     "onboarding_step_view",
  ONBOARDING_STEP_COMPLETE: "onboarding_step_complete",
  BEGIN_CHECKOUT:           "begin_checkout",
  PURCHASE:                 "purchase",
  PAYMENT_FAILED:           "payment_failed",
  OUTLET_CREATED:           "outlet_created",
  ONBOARDING_COMPLETE:      "onboarding_complete",
});

export const LOGIN_METHOD = "whatsapp_otp";
