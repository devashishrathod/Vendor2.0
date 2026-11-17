import { BRANCHES, SCREENS } from "../config/onboardingFlow";
import { readGstRecord, readPanRecord } from "../steps/verification/verificationRecords";

// Read-only summary of what the vendor entered / got verified on a
// completed screen — shown in the sidebar's preview popup.

const STATUS_LABELS = {
  [BRANCHES.GST]: "I have GST",
  [BRANCHES.REG_NO_GST]: "Registered, no GST",
  [BRANCHES.UNREGISTERED]: "Not registered",
};

const titleCase = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const maskAccount = (acc = "") => (acc ? `XXXX XXXX ${String(acc).slice(-4)}` : null);

function gstRows(form) {
  const r = readGstRecord(form.gstDetails);
  return [
    { label: "GSTIN", value: r.gstNumber || form.gstin },
    { label: "Legal business name", value: r.legalName },
    { label: "Trade name", value: r.tradeName },
    { label: "Business structure", value: r.constitution },
    { label: "Status", value: r.registrationStatus },
    { label: "Registered address", value: r.address, wide: true },
  ];
}

function panRows(form) {
  const r = readPanRecord(form.panDetails);
  return [
    { label: "Business PAN", value: r.pan || form.pan },
    { label: "Legal business name", value: r.name },
    { label: "PAN type", value: r.panType },
    { label: "Date of incorporation", value: r.dateOfIncorporation },
    { label: "Address", value: r.address, wide: true },
  ];
}

function bankRows(form) {
  const result = form.bankDetails?.result ?? form.bankDetails ?? {};
  return [
    { label: "Account number", value: maskAccount(form.bank?.accountNumber) },
    { label: "IFSC", value: result.account_ifsc || form.bank?.ifsc },
    { label: "Bank", value: [result.bank_name, result.bank_branch].filter(Boolean).join(" · ") || null },
    { label: "Account type", value: form.bank?.accountType ? titleCase(form.bank.accountType) : null },
    { label: "Account holder", value: result.account_holder_name || form.bank?.beneficiary },
  ];
}

/**
 * Every completed sub-step, grouped under its main step, for the single
 * "Preview your details" popup. Groups with nothing completed are left out.
 * @param {{ label: string, subs: { label: string, screenId: string, state: string }[] }[]} groups
 * @param {{ form: object, branch: string|null, skipped: string[] }} state
 * @returns {{ label: string, sections: ReturnType<typeof getStepPreview>[] }[]}
 */
export function getAllPreviews(groups, state) {
  return groups
    .map((group) => {
      const seen = new Set();
      const sections = group.subs
        .filter((sub) => sub.state === "done")
        .map((sub) => {
          const section = getStepPreview(sub.screenId, state);
          // screenId = where the preview's edit (pencil) button goes.
          return section && { ...section, screenId: sub.screenId };
        })
        .filter((section) => section && !seen.has(section.title) && seen.add(section.title));
      return { label: group.label, sections };
    })
    .filter((group) => group.sections.length > 0);
}

/**
 * @param {string} screenId
 * @param {{ form: object, branch: string|null, skipped: string[] }} state
 * @returns {{ title: string, rows: { label: string, value: string|null, wide?: boolean }[], note?: string }|null}
 */
export function getStepPreview(screenId, { form, branch, skipped }) {
  switch (screenId) {
    case SCREENS.BRAND_NAME:
      return { title: "Brand name", rows: [{ label: "Brand name", value: form.brandName }] };
    case SCREENS.CATEGORY:
      return {
        title: "Category",
        rows: [
          { label: "Category", value: form.categoryName },
          { label: "Sub-categories", value: (form.subCategories || []).map((s) => s.name).join(", ") || null },
        ],
      };
    case SCREENS.BUSINESS_STATUS:
      return { title: "Business status", rows: [{ label: "Business status", value: STATUS_LABELS[branch] || null }] };
    case SCREENS.GST_ENTER:
    case SCREENS.GST_REVIEW:
      return { title: "GST details", rows: gstRows(form) };
    case SCREENS.PAN_ENTER:
    case SCREENS.PAN_REVIEW:
      return { title: "Business PAN", rows: panRows(form) };
    case SCREENS.BUSINESS_TYPE:
      return { title: "Business entity", rows: [{ label: "Business entity", value: form.entityType ? titleCase(form.entityType) : null }] };
    case SCREENS.OWNER_PAN:
    case SCREENS.OWNER_PAN_REVIEW: {
      const kyc = form.ownerKyc || {};
      const r = readPanRecord(kyc.panDetails);
      return {
        title: "PAN details",
        rows: [
          { label: "Owner PAN", value: kyc.pan },
          { label: "Name on PAN", value: kyc.panName || r.name },
          { label: "PAN type", value: r.panType },
          { label: "Aadhaar linked", value: r.aadhaarLinked },
          { label: "Address", value: r.address, wide: true },
        ],
      };
    }
    case SCREENS.OWNER_KYC: {
      const kyc = form.ownerKyc || {};
      const rows = [
        { label: "Owner PAN", value: kyc.pan },
        { label: "Name on PAN", value: kyc.panName },
      ];
      if (branch === BRANCHES.UNREGISTERED) {
        rows.push({
          label: "Identity",
          value: kyc.idMethod === "upload" ? `${titleCase(kyc.idType || "ID")} uploaded` : kyc.idVerified ? "Aadhaar via DigiLocker" : null,
        });
      }
      return { title: branch === BRANCHES.UNREGISTERED ? "Owner verification" : "Business PAN", rows };
    }
    case SCREENS.DOCUMENTS: {
      const docs = (form.documents || []).filter((d) => d.status === "uploaded");
      if (skipped.includes(SCREENS.DOCUMENTS) || docs.length === 0) {
        return { title: "Business documents", rows: [], note: "Skipped — you can add documents later from your profile." };
      }
      return { title: "Business documents", rows: docs.map((d) => ({ label: d.title || "Document", value: d.fileName })) };
    }
    case SCREENS.BANK_ENTER:
    case SCREENS.BANK_REVIEW:
      if (skipped.includes(SCREENS.BANK_ENTER) || !form.bankDetails) {
        return { title: "Bank details", rows: [], note: "Skipped — add a bank account later to start selling vouchers." };
      }
      return { title: "Bank details", rows: bankRows(form) };
    case SCREENS.PARTNER_CONTRACT:
      return { title: "Partner contract", rows: [{ label: "Accepted on", value: formatDate(form.contractAcceptedAt) }, { label: "Accepted by", value: form.legalName }] };
    default:
      return null;
  }
}
