// Temporary local plan data. Once GET /api/plans and GET /api/plans/:id
// are live on the backend, delete this file and use subscriptionApi.js instead.

export const PLANS = [
  {
    id: "basic",
    name: "Basic Plan",
    tagline: "Best for individuals getting started",
    yearlyPrice: 1999,
    originalPrice: 4000,
    billingCycle: "Yearly Plan",
    discountPercent: 50,
    renewalDate: "February 2027",
    duration: "One Year Plan – 365 Days Plan Active",
    igstRate: 0.18,
    features: ["Basic listing", "Email support", "1 team member"],
  },
  {
    id: "advanced",
    name: "Advanced Plan",
    tagline: "Best for growing vendors",
    yearlyPrice: 3999,
    originalPrice: 7000,
    billingCycle: "Yearly Plan",
    discountPercent: 43,
    renewalDate: "February 2027",
    duration: "One Year Plan – 365 Days Plan Active",
    igstRate: 0.18,
    features: ["Priority listing", "Priority support", "5 team members"],
  },
  {
    id: "premium",
    name: "Premium Plan",
    tagline: "Best for established businesses",
    yearlyPrice: 6999,
    originalPrice: 12000,
    billingCycle: "Yearly Plan",
    discountPercent: 42,
    renewalDate: "February 2027",
    duration: "One Year Plan – 365 Days Plan Active",
    igstRate: 0.18,
    features: ["Featured listing", "24x7 support", "Unlimited team members"],
  },
];

export const PLANS_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p]));

export const VALID_PROMO_CODES = {
  SAVE10: 10,
  YOGA20: 20,
  WELCOME2026: 18,
};