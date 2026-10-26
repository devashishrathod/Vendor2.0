import {
  Car,
  HeartPulse,
  House,
  Pill,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Utensils,
  Wrench,
} from "lucide-react";
import { BRANCHES } from "../config/onboardingFlow";

// Licence the documents step suggests for a category, keyed by `licence`
// on each category below.
export const LICENCES = Object.freeze({
  FSSAI: "FSSAI licence",
  DRUG: "Drug licence",
  GENERAL: "Shop & Establishment",
});

export const LICENCE_HINTS = Object.freeze({
  [LICENCES.FSSAI]: "Shown for food categories.",
  [LICENCES.DRUG]: "Shown for pharmacy categories.",
  [LICENCES.GENERAL]: "Other categories see Udyam, Shop & Establishment or Trade licence.",
});

// UI-only sample data until GET /categories/getAll + /subCategories/getAll
// are wired in. Same shape the API mapping should produce.
export const SAMPLE_CATEGORIES = [
  { id: "food", name: "Food & drinks", icon: Utensils, licence: LICENCES.FSSAI, subCategories: ["Cafe", "Restaurant", "Bakery", "Cloud kitchen", "Sweets & snacks", "Juice bar"] },
  { id: "fashion", name: "Fashion", icon: Shirt, licence: LICENCES.GENERAL, subCategories: ["Clothing", "Footwear", "Accessories", "Jewellery"] },
  { id: "beauty", name: "Beauty & wellness", icon: Sparkles, licence: LICENCES.GENERAL, subCategories: ["Salon", "Spa", "Cosmetics", "Barber"] },
  { id: "pharmacy", name: "Pharmacy", icon: Pill, licence: LICENCES.DRUG, subCategories: ["Chemist", "Ayurvedic store", "Medical supplies"] },
  { id: "electronics", name: "Electronics", icon: Smartphone, licence: LICENCES.GENERAL, subCategories: ["Mobiles", "Appliances", "Computers", "Repairs"] },
  { id: "home", name: "Home & living", icon: House, licence: LICENCES.GENERAL, subCategories: ["Furniture", "Decor", "Kitchenware"] },
  { id: "services", name: "Services", icon: Wrench, licence: LICENCES.GENERAL, subCategories: ["Laundry", "Repairs", "Cleaning", "Tailoring"] },
  { id: "health", name: "Health & fitness", icon: HeartPulse, licence: LICENCES.GENERAL, subCategories: ["Gym", "Yoga studio", "Clinic"] },
  { id: "grocery", name: "Grocery", icon: ShoppingBag, licence: LICENCES.FSSAI, subCategories: ["Supermarket", "Kirana store", "Organic store"] },
  { id: "auto", name: "Automotive", icon: Car, licence: LICENCES.GENERAL, subCategories: ["Car wash", "Service centre", "Spare parts"] },
];

// Category tiles shown before "More" expands the rest.
export const VISIBLE_CATEGORY_COUNT = 7;

// Business type — values match the backend BUSINESS_ENTITY_TYPE enum.
export const PRIMARY_ENTITY_TYPES = [
  { value: "PROPRIETORSHIP", label: "Proprietorship", description: "One owner runs the business" },
  { value: "PARTNERSHIP", label: "Partnership", description: "Two or more partners" },
  { value: "LLP", label: "LLP", description: "Limited liability partnership" },
  { value: "PRIVATE_LIMITED", label: "Pvt. Ltd.", description: "Private limited company" },
];

export const MORE_ENTITY_TYPES = [
  { value: "PUBLIC_LIMITED", label: "Public Limited" },
  { value: "ONE_PERSON_COMPANY", label: "One Person Company" },
  { value: "TRUST", label: "Trust" },
  { value: "NGO", label: "NGO" },
  { value: "SOCIETY", label: "Society" },
  { value: "OTHERS", label: "Others" },
];

// Values match the backend BANK_ACCOUNT_TYPES enum.
export const BANK_ACCOUNT_TYPES = [
  { value: "SAVINGS", label: "Savings" },
  { value: "CURRENT", label: "Current" },
  { value: "NRE", label: "NRE" },
  { value: "NRO", label: "NRO" },
  { value: "OD", label: "OD" },
  { value: "CC", label: "CC" },
  { value: "OTHER", label: "Other" },
];

// Business documents: suggested titles per branch. `null` is replaced by
// the selected category's licence.
export const DOCUMENT_SUGGESTIONS = {
  [BRANCHES.REGISTERED]: [null, "Shop & Establishment", "Trade licence", "Shop photo", "Rent agreement"],
  [BRANCHES.UNREGISTERED]: ["Aadhaar (masked)", "Voter ID", null, "Electricity bill", "Shop photo", "Rent agreement"],
};

export const DOCUMENT_RULES = Object.freeze({
  maxSizeBytes: 5 * 1024 * 1024,
  minImageSidePx: 800,
  acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
  accept: ".pdf,.jpg,.jpeg,.png",
  maxTitleLength: 60,
});

export const NAME_LIMITS = Object.freeze({
  legalMax: 60,
  brandMin: 2,
  brandMax: 15,
});

export const PARTNER_AGREEMENT_URL = "https://trydood.com/partner-agreement";
export const TERMS_URL = "https://trydood.com/terms-of-service";
export const HELPDESK_EMAIL = "helpdesk@trydood.com";

// Same summary clauses the current partner contract step shows.
export const PARTNER_TERMS = [
  {
    title: "Partnership Scope",
    body: "This agreement governs the relationship between Trydood and the Partner for the purpose of delivering services as outlined in the onboarding documentation.",
  },
  {
    title: "Roles & Responsibilities",
    body: "The Partner agrees to maintain accurate business information, comply with applicable laws, and fulfil all obligations as described in the Trydood Partner Handbook.",
  },
  {
    title: "Revenue & Payments",
    body: "Payouts will be processed per the agreed schedule. Trydood reserves the right to withhold payments in case of policy violations or disputed transactions.",
  },
];
