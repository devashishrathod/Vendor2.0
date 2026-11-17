// Business documents to suggest for the category the vendor picked in Basic
// Details. The backend has no "documents per category" endpoint yet, so this
// lives here (used by pendingApi.fetchRequiredDocuments) — matched by
// keywords in the category / sub-category names; first match wins.
// `required` chips are red, `optional` chips green. Only the matched
// category's documents are shown, nothing generic on top.

const CATEGORY_DOCUMENTS = [
  {
    match: /liquor|bar\b|pub\b|brewer|wine/,
    required: ["Liquor licence", "FSSAI licence"],
    optional: ["Shop & Establishment"],
  },
  {
    match: /pharma|chemist|medical store|drug/,
    required: ["Drug licence"],
    optional: ["Pharmacist registration", "Shop & Establishment"],
  },
  {
    match: /food|restaurant|cafe|café|bakery|dining|kitchen|beverage|sweet|cloud kitchen|catering|dhaba|juice|ice cream/,
    required: ["FSSAI licence"],
    optional: ["Shop & Establishment", "Trade licence"],
  },
  {
    match: /grocery|kirana|supermarket|mart|dairy|meat|fruit|vegetable/,
    required: ["FSSAI licence"],
    optional: ["Shop & Establishment"],
  },
  {
    match: /clinic|hospital|doctor|dental|diagnostic|lab|physio|health/,
    required: ["Clinical establishment registration"],
    optional: ["Medical council registration", "Shop & Establishment"],
  },
  {
    match: /hotel|stay|resort|homestay|hostel|lodge/,
    required: [],
    optional: ["Hotel / tourism registration", "Trade licence", "FSSAI licence"],
  },
  {
    match: /beauty|salon|spa|wellness|cosmetic|grooming|barber|parlour|parlor/,
    required: [],
    optional: ["Shop & Establishment", "Trade licence"],
  },
  {
    match: /gym|fitness|sport|yoga|dance|martial/,
    required: [],
    optional: ["Shop & Establishment", "Trade licence"],
  },
  {
    match: /educat|school|coaching|class|course|tuition|academy|institute/,
    required: [],
    optional: ["Institute registration", "Shop & Establishment"],
  },
  {
    match: /travel|tour|holiday|trip/,
    required: [],
    optional: ["Tourism registration", "Shop & Establishment"],
  },
  {
    match: /jewel|gold|diamond|silver/,
    required: [],
    optional: ["BIS hallmark registration", "Shop & Establishment"],
  },
  {
    match: /auto|car\b|bike|vehicle|motor|garage/,
    required: [],
    optional: ["Trade licence", "Shop & Establishment"],
  },
];

// Registration proof for the business entity (Business Entity step).
const ENTITY_DOCUMENTS = {
  PRIVATE_LIMITED: "Certificate of Incorporation",
  PUBLIC_LIMITED: "Certificate of Incorporation",
  LLP: "LLP incorporation certificate",
  PARTNERSHIP: "Partnership deed",
};

// Any other category: the general licences every shop has.
const DEFAULT_DOCUMENTS = { required: [], optional: ["Shop & Establishment", "Trade licence"] };

/**
 * Documents for the vendor's category + sub-categories, plus the entity's
 * registration proof (e.g. Partnership deed) when the entity is known.
 * @param {{ categoryName?: string, subCategoryNames?: string[], entityType?: string|null }} selection
 * @returns {{ required: string[], optional: string[] }}
 */
export function documentsForCategory({ categoryName = "", subCategoryNames = [], entityType = null }) {
  const text = [categoryName, ...subCategoryNames].join(" ").toLowerCase();
  const found = CATEGORY_DOCUMENTS.find((entry) => entry.match.test(text)) ?? DEFAULT_DOCUMENTS;
  const entityDoc = ENTITY_DOCUMENTS[entityType];
  const optional = entityDoc ? [entityDoc, ...found.optional.filter((d) => d !== entityDoc)] : [...found.optional];
  return { required: [...found.required], optional };
}
