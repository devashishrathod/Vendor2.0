import { useCallback, useMemo, useState } from "react";
import { BRANCHES } from "@/features/onboarding-v2/config/onboardingFlow";
import { maskForReview } from "@/features/onboarding-v2/steps/payout/bankHelpers";
import BankCorrection from "./BankCorrection";
import BasicDetailsCorrection from "./BasicDetailsCorrection";
import CorrectionPanel from "./CorrectionPanel";
import GstCorrection from "./GstCorrection";
import PanCorrection from "./PanCorrection";
import { BRANCH_LABELS, brandBranch, isStatusLocked } from "./correctionHelpers";

/**
 * "Fix your details" for a rejected brand on the Under Review page, with
 * the onboarding v2 logic:
 * - the path (GST / registered without GST / not registered) comes from the brand record
 * - GST is asked only on the GST path
 * - the legal name comes from the re-verified GST (GST path) or PAN (other paths)
 * - the GST registration fixes the business type; the PAN only suggests it
 * - nothing here moves the backend onboarding screen
 * @param {{ brand: object, brandId: string, onSaved: (message: string) => void }} props
 */
export default function RejectedCorrections({ brand, brandId, onSaved }) {
  // Path from the brand record; changes only when an unlocked business
  // status is re-saved in Basic Details.
  const [branch, setBranch] = useState(() => brandBranch(brand));
  const statusLocked = useMemo(() => isStatusLocked(brand, branch), [brand, branch]);

  const [legalName, setLegalName] = useState(brand?.legalBusinessName || "");
  const [lockedEntity, setLockedEntity] = useState(null);
  const [suggestedEntity, setSuggestedEntity] = useState(null);
  // A re-verified GSTIN carries the business PAN (characters 3–12).
  const [panFromGstin, setPanFromGstin] = useState("");
  const [savedSections, setSavedSections] = useState({});

  const markSaved = useCallback((key) => setSavedSections((prev) => ({ ...prev, [key]: true })), []);

  const handleGstSaved = useCallback(
    ({ gstin, legalName: name, entityType }) => {
      if (name) setLegalName(name);
      if (entityType) setLockedEntity(entityType);
      setPanFromGstin(gstin.slice(2, 12));
      markSaved("gst");
      onSaved("GST details saved.");
    },
    [markSaved, onSaved],
  );

  const handlePanSaved = useCallback(
    ({ legalName: name, suggestedEntity: entity }) => {
      if (name) setLegalName(name);
      if (entity) setSuggestedEntity(entity);
      markSaved("pan");
      onSaved("PAN details saved.");
    },
    [markSaved, onSaved],
  );

  const handleBankSaved = useCallback(() => {
    markSaved("bank");
    onSaved("Bank details saved.");
  }, [markSaved, onSaved]);

  const initialPan = panFromGstin || brand?.pan?.pan || "";

  return (
    <div className="space-y-4">
      <CorrectionPanel title="Basic Details" defaultOpen>
        <BasicDetailsCorrection
          brand={brand}
          brandId={brandId}
          branch={branch}
          statusLocked={statusLocked}
          onBranchChange={setBranch}
          lockedEntity={lockedEntity}
          suggestedEntity={suggestedEntity}
          onSaved={onSaved}
        />
      </CorrectionPanel>

      <CorrectionPanel title="Business Details" summary={BRANCH_LABELS[branch]}>
        <div className="space-y-3">
          {branch === BRANCHES.GST && (
            <CorrectionPanel title="GST" nested saved={savedSections.gst} summary={brand?.gst?.gstNumber || "Not added"}>
              <GstCorrection initialGstin={brand?.gst?.gstNumber} onSaved={handleGstSaved} />
            </CorrectionPanel>
          )}

          <CorrectionPanel
            title={branch === BRANCHES.UNREGISTERED ? "Owner PAN" : "Business PAN"}
            nested
            saved={savedSections.pan}
            summary={brand?.pan?.pan || "Not added"}
          >
            {/* Remounts with the new prefill when a re-verified GSTIN changes the business PAN. */}
            <PanCorrection key={initialPan} brandId={brandId} branch={branch} initialPan={initialPan} onSaved={handlePanSaved} />
          </CorrectionPanel>

          <CorrectionPanel
            title="Bank account"
            nested
            saved={savedSections.bank}
            summary={brand?.bank?.accountNumber ? maskForReview(brand.bank.accountNumber) : "Not added"}
          >
            <BankCorrection initialBank={brand?.bank} legalName={legalName} onSaved={handleBankSaved} />
          </CorrectionPanel>
        </div>
      </CorrectionPanel>
    </div>
  );
}
