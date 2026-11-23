import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronRight, ClipboardCheck, LoaderCircle, MessageSquareWarning, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getErrorCode, getErrorDetails } from "@/services/http/apiError";
import BillingAddressCard from "@/features/subscriptions/components/BillingAddressCard";
import { toFormAddress, useBillingAddress } from "@/features/subscriptions/hooks/useBillingAddress";
import { BrandNameEditor, BusinessStatusEditor, CategoryEditor } from "../../components/layout/InlineEditors";
import { PreviewSection } from "../../components/layout/StepPreviewPage";
import ProfileStrengthCard from "../../components/strength/ProfileStrengthCard";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import { ONBOARDING_ROUTES, isWizardScreen } from "../../config/routes";
import { GROUP_LABELS, ONBOARDING_ERROR_CODES, SCREENS } from "../../config/screens";
import { CONTACT_VERIFY_KEYS, useContactVerify } from "../../hooks/useContactVerify";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { getBrandFeatures, getOutlets, getShowcaseAlbumsWithPhotos } from "../../services/brandSetupApi";
import { getKycDocuments, getVerificationHistory, submitOnboarding } from "../../services/onboardingApi";
import { useSavedBrandStore } from "../../store/brandStore";
import { useOnboardingStatusStore } from "../../store/statusStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { getGroupPreview } from "../../utils/stepPreview";
import SystemChecksCard from "./SystemChecksCard";
import VerificationTimeline from "./VerificationTimeline";
import {
  BILLING_SECTION,
  FIX_TARGETS,
  STRENGTH_ITEM_SCREENS,
  describeMissing,
  layoutSections,
  pointsForScreen,
  reviewAction,
} from "./reviewHelpers";

// Screens that are pages of their own, not sections to review.
const NOT_SECTIONS = new Set([SCREENS.ONBOARDING_REVIEW, SCREENS.UNDER_REVIEW, SCREENS.DASHBOARD]);

/** The billing address as one line, without repeating parts already in line 1. */
function billingText(address) {
  const a = toFormAddress(address);
  if (!a) return null;
  const rest = [a.line2, a.city, a.state, a.pin].filter((part) => part && !a.line1.includes(part));
  return [a.line1, ...rest].filter(Boolean).join(", ");
}

/**
 * Everything the review shows that the status doesn't carry: brand,
 * documents, outlets, features and (after a submit) the history. Read on
 * mount — returning from a fix remounts the page, so it is always fresh.
 */
function useReviewData(brandId, attemptNumber) {
  const loadBrand = useSavedBrandStore((s) => s.load);
  const brand = useSavedBrandStore((s) => s.brand);
  const [extra, setExtra] = useState({ documents: null, outlets: null, features: null, showcase: null, history: [], ready: false, error: "" });

  const reload = useCallback(() => {
    if (!brandId) return Promise.resolve();
    return Promise.all([
      loadBrand({ force: true }),
      getKycDocuments().then((res) => res?.data ?? null),
      getOutlets(brandId),
      getBrandFeatures(brandId),
      attemptNumber > 0 ? getVerificationHistory() : Promise.resolve([]),
      // Photos are nice to have — the review still opens without them.
      getShowcaseAlbumsWithPhotos().catch((error) => {
        console.error("Showcase albums fetch failed:", error);
        return null;
      }),
    ])
      .then(([, documents, outlets, features, history, showcase]) => setExtra({ documents, outlets, features, showcase, history, ready: true, error: "" }))
      .catch((error) => {
        console.error("Review data fetch failed:", error);
        setExtra((e) => ({ ...e, ready: true, error: onboardingErrorMessage(error, "We couldn't load all of your details.") }));
      });
  }, [attemptNumber, brandId, loadBrand]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { brand, ...extra, reload };
}

/**
 * ONBOARDING_REVIEW — "Review all details" (guide §6), and the same page
 * in REMEDIATION after a rejection / revoke (§7.2, reason on top). Sections
 * come from the server's groups; each shows ✏️ / Add (+N) / 🔒 from
 * `status.editable`. A fix opens that screen and its save returns here (the
 * server's screen doesn't move). Right side: `systemChecks` (no total score)
 * and profile strength. Submit → UNDER_REVIEW; 422 `missing` → a Fix link
 * per code.
 */
export default function ReviewStep() {
  const navigate = useNavigate();
  const { status, openScreen, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);
  const verification = status?.verification ?? {};
  const isRemediation = status?.editMode === "REMEDIATION";
  const data = useReviewData(status?.brandId, verification.attemptNumber ?? 0);
  const billing = useBillingAddress();
  const contactVerify = useContactVerify();

  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [missing, setMissing] = useState([]);
  const [error, setError] = useState("");
  const billingRef = useRef(null);

  const groups = useMemo(() => {
    if (!status) return [];
    const previewData = { status, brand: data.brand, documents: data.documents, outlets: data.outlets, features: data.features, showcase: data.showcase };
    return (status.groups ?? []).map((group) => {
      const sections = getGroupPreview(group.key, previewData).filter((s) => !NOT_SECTIONS.has(s.screenId));
      // Billing address sits with the plan (guide §4.11) and is always editable.
      if (group.key === "AGREEMENT_PLAN") {
        sections.push({ screenId: BILLING_SECTION, title: "Billing address", rows: [{ label: "Address", value: billingText(billing.billingAddress), wide: true }] });
      }
      return { key: group.key, title: GROUP_LABELS[group.key] ?? group.key, sections };
    });
  }, [billing.billingAddress, data.brand, data.documents, data.features, data.outlets, data.showcase, status]);

  const canOpen = useCallback((screen) => reviewAction(screen, status) !== "locked" && isWizardScreen(screen), [status]);

  const openFix = useCallback(
    (screen) => {
      if (screen === BILLING_SECTION) {
        setEditingId(BILLING_SECTION);
        billingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (canOpen(screen)) openScreen(screen);
    },
    [canOpen, openScreen],
  );

  const fixMissing = useCallback(
    (item) => {
      if (item.target === FIX_TARGETS.BILLING) openFix(BILLING_SECTION);
      else if (item.target === FIX_TARGETS.PLAN) navigate(ONBOARDING_ROUTES.PLAN);
      else if (item.screen && isWizardScreen(item.screen)) openScreen(item.screen);
    },
    [navigate, openFix, openScreen],
  );

  // An inline edit saved: follow the server if the screen moved (only a
  // business-status switch does), and show the saved values.
  const reloadData = data.reload;
  const afterInlineSave = useCallback(
    (saved) => {
      goToServerScreen(saved?.currentScreen);
      reloadData();
    },
    [goToServerScreen, reloadData],
  );

  const saveBilling = useCallback(
    async (parts) => {
      await billing.save(parts);
      fetchStatus().catch((err) => console.error("Onboarding status refresh failed:", err));
      setEditingId(null);
    },
    [billing, fetchStatus],
  );

  const gstAddress = billing.gstin ? toFormAddress(billing.gstAddress) : null;
  const savedBilling = toFormAddress(billing.billingAddress);

  const inlineEditors = {
    [SCREENS.BRAND_NAME]: (done) => <BrandNameEditor onDone={done} onSaved={afterInlineSave} />,
    [SCREENS.BUSINESS_CATEGORY]: (done) => <CategoryEditor onDone={done} onSaved={afterInlineSave} />,
    [SCREENS.REGISTRATION_STATUS]: (done) => <BusinessStatusEditor onDone={done} onSaved={afterInlineSave} />,
    [BILLING_SECTION]: (done) => (
      <div className="flex flex-col gap-2">
        <BillingAddressCard
          value={{ ...(savedBilling ?? { line1: "", line2: "", city: "", state: gstAddress?.state ?? "", pin: "" }), sameAsGst: false }}
          gstAddress={gstAddress}
          onChange={saveBilling}
          isSaved={Boolean(savedBilling)}
        />
        <Button variant="ghost" onClick={done} className="self-end">
          Cancel
        </Button>
      </div>
    ),
  };

  const startEdit = (section, action) => {
    if (action === "inline") setEditingId(section.screenId);
    else openScreen(section.screenId);
  };

  const submit = async () => {
    setSubmitting(true);
    setMissing([]);
    setError("");
    try {
      const res = await submitOnboarding();
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Onboarding submit failed:", err);
      const code = getErrorCode(err);
      if (code === ONBOARDING_ERROR_CODES.STEP_INCOMPLETE) {
        setMissing(describeMissing(getErrorDetails(err)?.missing, data.outlets ?? []));
      } else if (code === ONBOARDING_ERROR_CODES.LOCKED || code === ONBOARDING_ERROR_CODES.LEGAL_FIELD_LOCKED) {
        // Already under review / approved elsewhere — say so and follow the server.
        setError(onboardingErrorMessage(err, "Your brand is already with our team."));
        goToServerScreen(null);
      } else {
        setError(onboardingErrorMessage(err, "We couldn't submit right now. Please try again."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const strength = status?.profileStrength;
  const selectableKeys = [
    ...Object.entries(STRENGTH_ITEM_SCREENS)
      .filter(([, screen]) => canOpen(screen))
      .map(([key]) => key),
    ...CONTACT_VERIFY_KEYS,
  ];
  const selectStrengthItem = (key) => (CONTACT_VERIFY_KEYS.includes(key) ? contactVerify.open(key) : openFix(STRENGTH_ITEM_SCREENS[key]));

  if (!status || !data.ready) {
    return (
      <p className="flex items-center gap-2 py-10 text-sm text-gray-500 dark:text-gray-400" role="status">
        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        Loading your details…
      </p>
    );
  }

  const reason = verification.isRevoked ? verification.revokeReason : verification.rejectionReason;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.10)] sm:rounded-[20px] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <div className="p-4 sm:p-6">
        <header className="flex items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-500 shadow-[0_0_0_6px_#F4FBF7] ring-1 ring-emerald-200 sm:size-[52px] sm:rounded-[14px] dark:bg-emerald-500/10 dark:shadow-none dark:ring-emerald-500/30">
            <ClipboardCheck size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-[22px] dark:text-gray-50">
              {isRemediation ? "Update your details" : "Review all details"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Check everything before you {isRemediation ? "resubmit" : "submit"}. Locked sections change only through support.
            </p>
          </div>
        </header>

        {isRemediation && (
          <div className="mt-4">
            <Notice tone="warning" icon={MessageSquareWarning} title={verification.isRevoked ? "Your approval was withdrawn" : "Our team asked for a few changes"}>
              {reason || "Please check your details and resubmit."}
            </Notice>
          </div>
        )}

        {data.error && (
          <div className="mt-3">
            <Notice tone="error">{data.error}</Notice>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-w-0 flex-col gap-4">
            {groups.map((group) => (
              <div key={group.key}>
                <h2 className="mb-2 text-sm font-extrabold text-gray-900 dark:text-gray-100">{group.title}</h2>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {layoutSections(group.sections).map(({ section, full }) => {
                    const action = reviewAction(section.screenId, status);
                    const editing = editingId === section.screenId;
                    return (
                      <div
                        key={section.screenId}
                        ref={section.screenId === BILLING_SECTION ? billingRef : undefined}
                        className={full || editing ? "col-span-full" : ""}
                      >
                        <PreviewSection
                          section={section}
                          editing={editing}
                          wide={full}
                          dense
                          canEdit={action !== "locked" && (action === "inline" || isWizardScreen(section.screenId))}
                          editLabel={action === "add" ? "Add" : "Edit"}
                          points={action === "add" ? pointsForScreen(section.screenId, strength) : 0}
                          onStartEdit={() => startEdit(section, action)}
                          renderEditor={inlineEditors[section.screenId] ?? (() => null)}
                          onDone={() => setEditingId(null)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* top-20 clears the 64px sticky page header. */}
          <aside className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
            <SystemChecksCard checks={status.systemChecks ?? []} onFix={openFix} canFix={canOpen} />
            <ProfileStrengthCard
              strength={strength}
              isVerified={status.isVerified}
              maxItems={4}
              selectableKeys={selectableKeys}
              onSelectItem={selectStrengthItem}
            />
            <VerificationTimeline rows={data.history} />
          </aside>
        </div>
      </div>

      <footer className="flex flex-col gap-3 rounded-b-2xl border-t border-gray-200 bg-[#FCFDFC] px-4 py-3 sm:rounded-b-[20px] sm:px-6 dark:border-gray-800 dark:bg-gray-900">
        {missing.length > 0 && (
          <div className="rounded-xl bg-amber-50 p-3.5 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
            <p className="flex items-center gap-2 text-[13px] font-bold text-amber-900 dark:text-amber-200">
              <TriangleAlert size={15} aria-hidden="true" />
              Still needed before you can submit
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {missing.map((item) => (
                <li key={item.code} className="flex min-h-9 items-center justify-between gap-2 text-[13px] text-amber-900 dark:text-amber-200">
                  {item.label}
                  {(item.target || (item.screen && isWizardScreen(item.screen))) && (
                    <button
                      type="button"
                      onClick={() => fixMissing(item)}
                      className="inline-flex min-h-8 items-center gap-0.5 rounded-lg px-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                    >
                      Fix
                      <ChevronRight size={13} aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FormError message={error} />
          <Button onClick={submit} loading={submitting} icon={ArrowRight} className="sm:ml-auto">
            {isRemediation ? "Resubmit for review" : "Submit for review"}
          </Button>
        </div>
      </footer>
      {contactVerify.modal}
    </section>
  );
}
