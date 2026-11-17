import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, ChevronRight, Clock, Info, Loader2, Pencil, SkipForward, Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../../../../hooks/useBrand";
import AppTopBar from "@/components/common/AppTopBar";
import { useOnboardingV2Store } from "@/features/onboarding-v2/store/onboardingStore";
import { getCurrentSubscription } from "@/features/subscriptions/services/subscriptionApi";
import { ANALYTICS_EVENTS } from "@/constants/analytics";
import { trackEvent } from "@/utils/analytics";
import ErrorToast from "../../../../components/common/ErrorToast";
import SuccessToast from "../../../../components/common/SuccessToast";
import Select from "../../../../components/common/Select";

import { useCategories } from "../hooks/useCategories";
import { useWhatsappOtp, isValidPhone } from "../hooks/useWhatsappOtp";
import {
  finalizeOutlet,
  upsertWorkHours,
  getBrandById,
  OUTLET_TYPES,
} from "../services/brandOutletApi";
import {
  createLocation,
  mapLocationToSelectedPlace,
  buildLocationPayloadFromPlace,
  hasValidCoordinates,
  hasValidZipcode,
  ADDRESS_TYPES,
} from "../services/locationApi";
import { DEFAULT_WORKING_HOURS, OUTLET_TYPE_OPTIONS, MIN_ITEMS_PER_ALBUM } from "../constants/brandOutletConstants";

import {
  GuidelinesModal,
  MapModal,
  OtpVerifyModal,
  ListingFeaturesEditor,
  ShowcaseAlbumsEditor,
  WorkingHoursEditor,
  OutletLocationSearch,
  LiveLocationPicker,
  ReviewStep,
} from "../components/brandOutlet";
import CustomerPreview from "../components/brandOutlet/layout/CustomerPreview";
import ImageUploadTile from "../components/brandOutlet/layout/ImageUploadTile";
import OutletCard from "../components/brandOutlet/layout/OutletCard";
import OutletStepper from "../components/brandOutlet/layout/OutletStepper";
import SkipConfirmModal from "../components/brandOutlet/layout/SkipConfirmModal";
import { cacheOutletImage, clearOutletImages, readOutletImage } from "../utils/outletImageCache";

/** Header badge for a recommended section: Added / Skipped / Recommended. */
function SectionBadge({ done, skipped }) {
  if (done) {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
        Added
      </span>
    );
  }
  if (skipped) {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30">
        Skipped
      </span>
    );
  }
  return (
    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10.5px] font-bold text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/30">
      Recommended
    </span>
  );
}

/** "Skip for now" link under a recommended section's editor. */
function SkipRow({ onSkip }) {
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400">Recommended for faster approval. Don&apos;t have it ready?</p>
      <button
        type="button"
        onClick={onSkip}
        className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg px-3 text-xs font-bold text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:self-auto dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700"
      >
        <SkipForward size={13} aria-hidden="true" />
        Skip for now
      </button>
    </div>
  );
}

/** Shown in place of the editor once a section is skipped. */
function SkippedNotice({ name, onUndo }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-inset ring-amber-200 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-500/10 dark:ring-amber-500/30">
      <p className="flex items-start gap-2 text-[12.5px] leading-snug text-amber-900 dark:text-amber-200">
        <Clock size={15} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <span>
          <strong className="font-bold">You skipped {name}.</strong> Your outlet&apos;s approval may be delayed — add it any time to speed things up.
        </span>
      </p>
      <button
        type="button"
        onClick={onUndo}
        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 self-start rounded-lg bg-white px-3 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50 sm:self-auto dark:bg-gray-900 dark:text-emerald-400 dark:ring-emerald-500/30"
      >
        <Undo2 size={13} aria-hidden="true" />
        Add it now
      </button>
    </div>
  );
}

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const OUTLET_DRAFT_STORAGE_PREFIX = "trydood:create-brand-outlet-draft:";
const LOGO_MAX_MB = 1.5;
const COVER_MAX_MB = 3;

export default function CreateBrandOutlet() {
  const { brand, loading } = useBrand();
  const navigate = useNavigate();

  // ── Brand form state ──
  const [brandName, setBrandName] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  // ⚠️ NOT independently confirmed from a Postman sample for
  // brands/update (only brandName/email/description/subCategoryId/
  // isOnboarding/showcaseSectionIds are documented there) — sent as a
  // `mobile` key per explicit instruction; verify the saved value once
  // tested and correct the key name here if it's wrong.
  const [brandMobile, setBrandMobile] = useState("");
  const [mobileSameAsWhatsapp, setMobileSameAsWhatsapp] = useState(false);
  const [brandDescription, setBrandDescription] = useState("");
  const [brandType, setBrandType] = useState("");
  const [brandSubType, setBrandSubType] = useState("");
  const [listingFeatures, setListingFeatures] = useState([]);
  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);
  const [showcaseAlbums, setShowcaseAlbums] = useState([]);
  const [logoFile, setLogoFile] = useState(null);

  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState("");
  // Brand cover image (PUT brands/update multipart `coverImage`) — optional.
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState("");

  // Shows a picked (or restored) file. `persist` also parks it in IndexedDB
  // so a page refresh before submit doesn't lose it.
  const applyLogoFile = useCallback((file) => {
    setLogoFile(file);
    setLogoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }, []);
  const applyCoverFile = useCallback((file) => {
    setCoverFile(file);
    setCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }, []);

  const handleLogoSelect = useCallback(
    (file) => {
      applyLogoFile(file);
      if (!file) setExistingLogoUrl("");
      cacheOutletImage(brand?._id, "logo", file);
    },
    [applyLogoFile, brand?._id],
  );

  const handleCoverSelect = useCallback(
    (file) => {
      applyCoverFile(file);
      if (!file) setExistingCoverUrl("");
      cacheOutletImage(brand?._id, "cover", file);
    },
    [applyCoverFile, brand?._id],
  );

  // Restore the logo / cover picked before a refresh.
  useEffect(() => {
    if (!brand?._id) return undefined;
    let active = true;
    Promise.all([readOutletImage(brand._id, "logo"), readOutletImage(brand._id, "cover")]).then(([logo, cover]) => {
      if (!active) return;
      if (logo) applyLogoFile(logo);
      if (cover) applyCoverFile(cover);
    });
    return () => {
      active = false;
    };
  }, [brand?._id, applyLogoFile, applyCoverFile]);

  const {
    categories,
    subCategories,
    categoriesLoading,
    subCategoriesLoading,
    categoriesError,
    subCategoriesError,
  } = useCategories(brandType);

  // ── Outlet form state ──
  const [outletType, setOutletType] = useState("");
  const [gstSameAsOutlet, setGstSameAsOutlet] = useState(false);
  // const [mapsLink, setMapsLink] = useState("");
  const [locationMode, setLocationMode] = useState("search");
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [savedLocationId, setSavedLocationId] = useState(null);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationSaveError, setLocationSaveError] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);

  const [workingHoursSaving, setWorkingHoursSaving] = useState(false);
  const [workingHoursSaveError, setWorkingHoursSaveError] = useState("");
  // Gates the final "Save & Process" button — only true right after a
  // successful upsertWorkHours call (or right after prefill confirms the
  // backend already has hours saved for this outlet). Reset to false the
  // moment hours are edited again, so a stale save can't silently pass the
  // gate.
  const [workingHoursSaved, setWorkingHoursSaved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [guidelineType, setGuidelineType] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // ── Wizard step (UI-only — purely controls which of the same fields/
  // handlers below are currently visible; no state shape, API call, or
  // validation rule changes with it). 1 = Basic Details, 2 = Outlet
  // Details, 3 = Review.
  const [wizardStep, setWizardStep] = useState(1);
  // Set when the vendor leaves "Review all details" to change something:
  // { scrollY } = where they were on the review, so they land back on the
  // same spot instead of walking through every step again.
  const [returnToReview, setReturnToReview] = useState(null);
  const [draftReady, setDraftReady] = useState(false);
  // Listing Features / Showcase can be skipped (with a confirmation).
  const [listingSkipped, setListingSkipped] = useState(false);
  const [showcaseSkipped, setShowcaseSkipped] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(null); // "listing" | "showcase" | null

  // Guards the one-time mount prefill effect so it can't double-fire (e.g.
  // React StrictMode double-invoke in dev) or fight with in-progress user
  // edits.
  const hydratedBrandDetailsRef = useRef(false);
  const outletDraftKey = brand?._id ? `${OUTLET_DRAFT_STORAGE_PREFIX}${brand._id}` : null;

  const brandWhatsappNumber = brand?.whatsappNumber || brand?.phone || brand?.mobile || "";

  const {
    outletWhatsapp,
    useBrandNumber,
    whatsappVerified,
    subBrandId,
    otpStage,
    otpValue,
    otpSending,
    otpConfirming,
    otpError,
    devOtpHint,
    hydrated: whatsappHydrated,
    setOtpValue,
    handleUseBrandNumberToggle,
    handleOutletWhatsappChange,
    restoreWhatsappDraft,
    sendOtp,
    resetOtp, // resend/reset — calls loginOrSignUp-with-whatsapp only
    confirmOtp,
    closeOtpModal,
    hydrateVerified,
    hydrateUnverifiedShell,
  } = useWhatsappOtp({ brandId: brand?._id, brandWhatsappNumber, isFirstOutlet: true });

  // While "Same as Brand WhatsApp Number" is checked, the field displays
  // (and saves) brandWhatsappNumber directly instead of a separately-stored
  // copy, so it stays live if that number changes — with no extra
  // state-sync effect needed. brandWhatsappNumber (not outletWhatsapp) is
  // used here because it's already available from the fetched brand
  // profile as soon as this Brand Details section renders, whereas
  // outletWhatsapp is only filled in later, in the Outlet Details section
  // further down this same page.
  const effectiveMobile = mobileSameAsWhatsapp ? brandWhatsappNumber : brandMobile;

  // ── Verify button: Case-aware — if a subBrand shell already exists
  // (subBrandId is already known, from either hydrateVerified or
  // hydrateUnverifiedShell on mount), just RESEND via
  // auth/loginOrSignUp-with-whatsapp (resetOtp). Only call sendOtp — which
  // creates a brand-new shell via subBrands/signUp-with-whatsapp — when no
  // shell exists yet (a genuinely new outlet, Case 3).
  const handleVerifyClick = useCallback(() => {
    if (subBrandId) {
      resetOtp();
    } else {
      sendOtp(outletType === "franchise" ? OUTLET_TYPES.FRANCHISE : OUTLET_TYPES.OUTLET);
    }
  }, [subBrandId, resetOtp, sendOtp, outletType]);

  const openGuideline = useCallback((type) => setGuidelineType(type), []);
  const closeGuideline = useCallback(() => setGuidelineType(null), []);

  // ── Toast notifications ──
  // Global, transient pop-up notifications layered on top of the
  // page — used for every error/success moment (WhatsApp OTP, location
  // save, working hours save, final submit) AND for the "this section is
  // locked" warnings below. The section-level inline red/amber/green text
  // stays as-is too, since that still drives button-gating and persistent
  // "is this saved / why is this locked?" context; these toasts are just
  // the attention-grabbing notification on top.
  const [toastError, setToastError] = useState(null); // { status, message, txnId } | null
  const [toastSuccess, setToastSuccess] = useState("");

  const showError = useCallback((message, status, txnId) => {
    if (!message) return;
    setToastError({ status, message, txnId });
  }, []);

  const showSuccess = useCallback((message) => {
    if (!message) return;
    setToastSuccess(message);
  }, []);

  // Any OTP error surfaced by the hook (send/resend/verify failures)
  // also pops a toast, in addition to the inline message already shown
  // inside OtpVerifyModal.
  useEffect(() => {
    if (otpError) showError(otpError);
  }, [otpError, showError]);

  // Gates Location, Working Hours, AND Outlet Type — all three are
  // meaningless/unpostable until the outlet's WhatsApp number is verified
  // (subBrandId only exists after that point, and upsertWorkHours /
  // finalizeOutlet both need it). Surface that in the UI by disabling all
  // three sections instead of letting the vendor fill them in and then
  // silently fail (or worse, lose the input) later.
  //
  // ⚠️ FIXED: this (and notifyBlocked below) used to be declared AFTER the
  // `if (loading) return ...` early-return further down. That's a Rules-of-
  // Hooks violation — `notifyBlocked` is a useCallback, and hooks can never
  // be skipped by an early return. On the first render (loading === true)
  // that useCallback call was never reached at all, so once loading flips
  // to false the render suddenly calls "one more hook than before",
  // triggering "Rendered more hooks than during the previous render."
  // Both are plain derived values/callbacks off state we already have, so
  // they're safe to compute unconditionally up here, before any return.
  const outletSectionsBlocked = !subBrandId;

  // Fired when the vendor clicks anywhere inside one of the three blocked
  // sections. Because the actual controls sit inside a
  // "pointer-events-none" wrapper, clicks on them fall through to this
  // handler on the enclosing (non-pointer-events-none) container instead
  // — so this only fires while genuinely blocked, and pops the same
  // message as a toast in addition to the inline amber note.
  const notifyBlocked = useCallback((message) => {
    if (outletSectionsBlocked) showError(message);
  }, [outletSectionsBlocked, showError]);

  // ⚠️ FIXED: guards against posting a location before subBrandId exists.
  // subBrandId is set inside useWhatsappOtp's sendOtp() (fires as soon as
  // "Verify" is clicked, before OTP confirmation) — or by hydrateVerified
  // on mount if this outlet's WhatsApp is already verified — so in the
  // normal top-to-bottom flow it's already available by the time a
  // location gets picked. This guard only protects the edge case where a
  // user somehow interacts with Location before verifying WhatsApp.
  const persistLocationPayload = useCallback(async (payload) => {
    if (!payload?.subBrandId) {
      setSavedLocationId(null);
      const msg = "Please verify your outlet's WhatsApp number first — we need that before saving a location.";
      setLocationSaveError(msg);
      showError(msg);
      return;
    }
    setLocationSaving(true);
    setLocationSaveError("");
    try {
      const res = await createLocation(payload);
      const saved = res?.data ?? res;
      setSavedLocationId(saved?._id || saved?.id || null);
      showSuccess("Outlet location saved.");
      return saved;
    } catch (err) {
      setSavedLocationId(null);
      const msg = err.message || "Couldn't save this location. Try again.";
      setLocationSaveError(msg);
      showError(msg);
    } finally {
      setLocationSaving(false);
    }
  }, [showError, showSuccess]);

  // ⚠️ FIXED: now passes subBrandId (not brandId) into the payload builder,
  // per the confirmed backend schema — a Brand Outlet's location is a
  // subBrand-level address (isSubBrandAddress: true), not a brand-level one.
  const persistSelectedPlace = useCallback((place) => {
    if (!place) {
      setSavedLocationId(null);
      setLocationSaveError("");
      return;
    }
    const payload = buildLocationPayloadFromPlace(place, {
      subBrandId,
      addressType: ADDRESS_TYPES.WORK,
    });
    if (!hasValidCoordinates(payload)) {
      setSavedLocationId(null);
      const msg = "This location is missing map coordinates — try picking it again.";
      setLocationSaveError(msg);
      showError(msg);
      return;
    }
    // ⚠️ FIXED: this check existed in locationApi.js (hasValidZipcode) but
    // was never actually called before hitting the backend — so a search
    // result Google returns with no postal_code (and no 6-digit PIN in its
    // formatted address either) sailed straight through to createLocation(),
    // which then 422'd with the backend's raw "Zip Code/Postal Code is
    // required" message. That's not a made-up frontend string — it's the
    // backend's own validation error — but showing it verbatim, sitting
    // inside the GST checkbox box, gave the vendor no idea it was actually
    // about the search RESULT they picked below. Catch it here instead, with
    // a message that points at the actual fix (pick a more specific result).
    if (!hasValidZipcode(payload)) {
      setSavedLocationId(null);
      const msg = "This search result doesn't include a PIN/zipcode — try picking a more specific result (e.g. with a full street address) from the list below.";
      setLocationSaveError(msg);
      showError(msg);
      return;
    }
    persistLocationPayload(payload);
  }, [subBrandId, persistLocationPayload, showError]);

  // ⚠️ CHANGED: the GST checkbox no longer auto-geocodes or auto-saves
  // anything. It used to forward-geocode the raw GST address text and
  // save that straight away — but geocoding free text doesn't reliably
  // return a full address_components breakdown, so fields like `district`
  // frequently came back empty and the backend rejected the save with
  // "Body.district is not allowed to be empty".
  //
  // New behaviour: checking the box just PREFILLS the search input with
  // the GST address text (as-is, no lookup) so the vendor doesn't have to
  // retype it. Nothing is saved yet — the vendor still has to pick the
  // matching result from the search dropdown themselves. That dropdown
  // pick is what gives us a real Google place with full
  // address_components, which is the only reliable source for
  // city/district/state/zipcode — and is what actually gets saved via
  // handleSelectPlace → persistSelectedPlace below.
  const prefillGstAddress = useCallback(() => {
    const gstAddr = brand?.gst?.address || {};
    const addressText = gstAddr.formattedAddress || gstAddr.location || gstAddr.address || "";

    setSelectedPlace({
      name: gstAddr.name || "GST Address",
      address: addressText,
      lat: null,
      lng: null,
      placeId: null,
      addressComponents: null,
      source: "gst",
    });

    // Nothing is saved yet — this is a text prefill only. Clear any
    // previous saved-location state so the UI doesn't claim a location is
    // saved until the vendor actually confirms one via search.
    setSavedLocationId(null);
    setLocationSaveError("");
  }, [brand]);

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlace(place);
    persistSelectedPlace(place);
  }, [persistSelectedPlace]);

  const handleGstSameToggle = useCallback((checked) => {
    setGstSameAsOutlet(checked);
    if (checked) {
      setLocationMode("search");
      prefillGstAddress();
    } else {
      // Start fresh — don't carry over the GST text prefill (which never
      // has coordinates) as if it were a real selected place.
      setSelectedPlace(null);
      setSavedLocationId(null);
      setLocationSaveError("");
    }
  }, [prefillGstAddress]);

  const switchLocationMode = useCallback((mode) => {
    setLocationMode(mode);
    setSelectedPlace(null);
    if (!gstSameAsOutlet) {
      setSavedLocationId(null);
      setLocationSaveError("");
    }
  }, [gstSameAsOutlet]);

  const handleSaveWorkingHours = useCallback(async () => {
    if (!subBrandId) return;
    setWorkingHoursSaving(true);
    setWorkingHoursSaveError("");
    try {
      await upsertWorkHours({ subBrandId, hours: workingHours });
      setWorkingHoursSaved(true);
      showSuccess("Working hours saved.");
    } catch (err) {
      const msg = err.message || "Couldn't save working hours. Try again.";
      setWorkingHoursSaveError(msg);
      showError(msg);
    } finally {
      setWorkingHoursSaving(false);
    }
  }, [subBrandId, workingHours, showError, showSuccess]);

  // Hours changed after a save → that save is now stale, require re-save
  // before the final "Save & Process" button unlocks again.
  const handleWorkingHoursChange = useCallback((next) => {
    setWorkingHours(next);
    setWorkingHoursSaved(false);
  }, []);

  // ── Prefill EVERYTHING from a single brands/get?brandId= call ──
  // getBrandById's response already carries brand-level fields (name,
  // description, category/subCategory, logo) AND — nested under
  // `firstSubBrand` — the outlet's outletType, WhatsApp verification
  // state, saved location, and saved working hours. Extracted into its
  // own function (not just a mount-effect IIFE) so it can ALSO be
  // re-run right after a live OTP confirm below — see the "post-verify
  // catch-up" effect — instead of only ever running once on mount.
  const hydrateOutletFromBrand = useCallback(async () => {
    if (!brand?._id) return;
    try {
      const res = await getBrandById(brand._id);
      const data = res?.data ?? res;
      if (!data) return { verifiedOutlet: false };

      // ── Brand-level fields ──
      if (data.brandName) setBrandName(data.brandName);
      if (data.email) setBrandEmail(data.email);
      if (data.description) setBrandDescription(data.description);
      if (data.categoryId) setBrandType(data.categoryId);
      if (data.subCategoryId) setBrandSubType(data.subCategoryId);
      if (data.logo) setExistingLogoUrl(data.logo);
      if (data.coverImage) setExistingCoverUrl(data.coverImage);

      const fsb = data.firstSubBrand;

      // ── Case 3: no firstSubBrand at all → brand-new outlet. Nothing
      // to hydrate here; the first "Verify" click will call sendOtp,
      // which creates the subBrand shell (subBrands/signUp-with-whatsapp)
      // AND sends the first OTP. Location/working-hours/outlet-type stay
      // blocked until that shell exists (outletSectionsBlocked = !subBrandId).
      if (!fsb) return { verifiedOutlet: false };

      // ── Outlet type ──
      // ⚠️ CONFIRM: OUTLET_TYPE_OPTIONS values assumed to be the
      // lowercase "outlet"/"franchise" strings, matching the existing
      // handleSave mapping (outletType === "franchise" ? FRANCHISE : OUTLET).
      if (fsb.outletType) {
        setOutletType(fsb.outletType === OUTLET_TYPES.FRANCHISE ? "franchise" : "outlet");
      }

      // ── WhatsApp number + verification ──
      // ⚠️ FIXED: was reading fsb.user?.isMobileVerified, which is a
      // different (mobile-OTP) flag that stays false even for an outlet
      // whose WhatsApp number IS verified — confirmed from a real
      // brands/get response where firstSubBrand.user.isWhatsappVerified
      // was true while isMobileVerified was false for the same outlet.
      // That mismatch is why a freshly-verified number could still show
      // as unverified again after a page refresh. isWhatsappVerified is
      // the real "is this outlet's WhatsApp number verified" flag.
      const isNumberVerified = !!fsb.user?.isWhatsappVerified;

      if (isNumberVerified && fsb._id) {
        // ── Case 1: shell exists AND already verified ──
        // Skip OTP entirely. Verify button disappears, "Already
        // verified for this outlet" shows instead.
        hydrateVerified({
          subBrandId: fsb._id,
          whatsappNumber: fsb.whatsappNumber,
        });
      } else if (fsb._id) {
  
        hydrateUnverifiedShell({
          subBrandId: fsb._id,
          whatsappNumber: fsb.whatsappNumber,
        });
      }

      // ── Location ──
      // The subBrand doc carries its saved location regardless of
      // whatsapp-verification status, so prefill it whenever present
      // (covers both Case 1 and Case 2). If absent, the section stays
      // blank and the vendor has to add one.
      if (fsb.location) {
        const place = mapLocationToSelectedPlace(fsb.location);
        setSelectedPlace(place);
        setSavedLocationId(fsb.location._id || fsb.location.id || null);
      }

      // ── Working hours ──
      // Same idea — prefill whenever the subBrand doc already has them
      // saved, regardless of verification status; otherwise stays at
      // DEFAULT_WORKING_HOURS and needs a fresh save.
      if (fsb.workHours) {
        const wh = { ...DEFAULT_WORKING_HOURS };
        WEEK_DAYS.forEach((d) => {
          if (fsb.workHours[d]) {
            wh[d] = {
              start: fsb.workHours[d].start,
              end: fsb.workHours[d].end,
              isOpen: fsb.workHours[d].isOpen,
            };
          }
        });
        setWorkingHours(wh);
        setWorkingHoursSaved(true); // already saved on the backend
      }
      return { verifiedOutlet: isNumberVerified && !!fsb._id };
    } catch (err) {
      console.error("Couldn't load existing brand/outlet details:", err.message);
      return { verifiedOutlet: false };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?._id]);

  useEffect(() => {
    if (!brand?._id || hydratedBrandDetailsRef.current) return;
    hydratedBrandDetailsRef.current = true;
    hydrateOutletFromBrand().then(({ verifiedOutlet } = {}) => {
      try {
        const savedDraft = outletDraftKey ? sessionStorage.getItem(outletDraftKey) : null;
        const draft = savedDraft ? JSON.parse(savedDraft) : null;
        if (draft && typeof draft === "object") {
          if (Number.isInteger(draft.wizardStep) && draft.wizardStep >= 1 && draft.wizardStep <= 3) setWizardStep(draft.wizardStep);
          if (draft.returnToReview && typeof draft.returnToReview === "object") setReturnToReview(draft.returnToReview);
          if (typeof draft.brandName === "string") setBrandName(draft.brandName);
          if (typeof draft.brandEmail === "string") setBrandEmail(draft.brandEmail);
          if (typeof draft.brandMobile === "string") setBrandMobile(draft.brandMobile);
          if (typeof draft.mobileSameAsWhatsapp === "boolean") setMobileSameAsWhatsapp(draft.mobileSameAsWhatsapp);
          if (typeof draft.brandDescription === "string") setBrandDescription(draft.brandDescription);
          if (typeof draft.brandType === "string") setBrandType(draft.brandType);
          if (typeof draft.brandSubType === "string") setBrandSubType(draft.brandSubType);
          if (Array.isArray(draft.listingFeatures)) setListingFeatures(draft.listingFeatures);
          if (Array.isArray(draft.showcaseAlbums)) setShowcaseAlbums(draft.showcaseAlbums);
          if (typeof draft.listingSkipped === "boolean") setListingSkipped(draft.listingSkipped);
          if (typeof draft.showcaseSkipped === "boolean") setShowcaseSkipped(draft.showcaseSkipped);
          if (draft.workingHours && typeof draft.workingHours === "object") setWorkingHours(draft.workingHours);
          if (typeof draft.workingHoursSaved === "boolean") setWorkingHoursSaved(draft.workingHoursSaved);
          if (typeof draft.outletType === "string") setOutletType(draft.outletType);
          if (typeof draft.gstSameAsOutlet === "boolean") setGstSameAsOutlet(draft.gstSameAsOutlet);
          if (typeof draft.locationMode === "string") setLocationMode(draft.locationMode);
          if ("selectedPlace" in draft) setSelectedPlace(draft.selectedPlace);
          if ("savedLocationId" in draft) setSavedLocationId(draft.savedLocationId);
          if (!verifiedOutlet) {
            restoreWhatsappDraft({ outletWhatsapp: draft.outletWhatsapp, useBrandNumber: draft.useBrandNumber });
          }
        }
      } catch (err) {
        console.error("Couldn't restore outlet form draft:", err);
      }
      // Category picked in the onboarding wizard (not saved on the backend
      // yet) fills the selects when neither the brand nor a draft has one.
      const { categoryId, subCategories: pickedSubs } = useOnboardingV2Store.getState().form;
      if (categoryId) {
        setBrandType((prev) => prev || categoryId);
        setBrandSubType((prev) => prev || pickedSubs?.[0]?.id || "");
      }
    }).finally(() => {
      try {
        setDraftReady(true);
        setLocationLoading(false);
      } catch (err) {
        console.error("Couldn't finish restoring outlet form draft:", err);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?._id]);

  useEffect(() => {
    if (!draftReady || !outletDraftKey) return;
    const draft = {
      wizardStep,
      returnToReview,
      brandName,
      brandEmail,
      brandMobile,
      mobileSameAsWhatsapp,
      brandDescription,
      brandType,
      brandSubType,
      listingFeatures,
      listingSkipped,
      showcaseSkipped,
      showcaseAlbums: showcaseAlbums.map((album) => ({
        id: album.id,
        name: album.name,
        persisted: album.persisted,
        media: (album.media || []).filter((media) => media.persisted).map((media) => ({
          id: media.id,
          type: media.type,
          preview: media.preview,
          thumbnail: media.thumbnail,
          month: media.month,
          isShowInVideoClips: media.isShowInVideoClips,
          persisted: true,
        })),
      })),
      workingHours,
      workingHoursSaved,
      outletType,
      gstSameAsOutlet,
      locationMode,
      selectedPlace,
      savedLocationId,
      outletWhatsapp,
      useBrandNumber,
    };
    try {
      sessionStorage.setItem(outletDraftKey, JSON.stringify(draft));
    } catch (err) {
      console.error("Couldn't save outlet form draft:", err);
    }
  }, [
    draftReady,
    outletDraftKey,
    wizardStep,
    returnToReview,
    brandName,
    brandEmail,
    brandMobile,
    mobileSameAsWhatsapp,
    brandDescription,
    brandType,
    brandSubType,
    listingFeatures,
    listingSkipped,
    showcaseSkipped,
    showcaseAlbums,
    workingHours,
    workingHoursSaved,
    outletType,
    gstSameAsOutlet,
    locationMode,
    selectedPlace,
    savedLocationId,
    outletWhatsapp,
    useBrandNumber,
  ]);

  // ── Post-verify catch-up: right after a LIVE OTP confirm (not the
  // mount-time hydration above — that only ever runs once), subBrandId
  // should already be set from sendOtp()'s own response. If it somehow
  // isn't by the time whatsappVerified flips true, Location/Working
  // Hours/Outlet Type stayed wrongly blocked until the vendor manually
  // refreshed the page — this re-fetches once instead, so they unlock
  // immediately without a reload.
  const postVerifyHydrateRef = useRef(false);
  useEffect(() => {
    if (!whatsappVerified) {
      postVerifyHydrateRef.current = false;
      return;
    }
    if (subBrandId || postVerifyHydrateRef.current) return;
    postVerifyHydrateRef.current = true;
    hydrateOutletFromBrand();
  }, [whatsappVerified, subBrandId, hydrateOutletFromBrand]);

  useEffect(() => {
    if (!loading && !brand?._id) setLocationLoading(false);
  }, [loading, brand?._id]);

  // Active plan for the Review step's locked "Plan" section — fetched once,
  // the first time the vendor reaches Review.
  const [subscription, setSubscription] = useState(null);
  const subscriptionRequestedRef = useRef(false);
  useEffect(() => {
    if (wizardStep !== 3 || subscriptionRequestedRef.current) return;
    subscriptionRequestedRef.current = true;
    getCurrentSubscription()
      .then((res) => setSubscription(res?.subscription ?? null))
      .catch((err) => console.error("Couldn't load current subscription:", err));
  }, [wizardStep]);

  // ⚠️ FIXED: this early return now happens AFTER every hook has been
  // called, on every single render (loading true or false). Nothing below
  // this line may declare a new hook — only plain derived consts and JSX.
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center  dark:bg-gray-900 text-sm text-gray-500">Loading...</div>;
  }

  const merchantToken = brand?.merchantId || "—";
  const gstAddress = brand?.gst?.address?.location || "";
  const outletAddress = gstSameAsOutlet ? gstAddress : (selectedPlace?.address || "");

  const handleCategoryChange = (value) => {
    setBrandType(value);
    setBrandSubType("");
  };

  const handleSave = async () => {
    if (!subBrandId || !brand?._id) return;
    setSaving(true);

    const subBrandPatch = {
      outletType: outletType === "franchise" ? OUTLET_TYPES.FRANCHISE : OUTLET_TYPES.OUTLET,
      description: brandDescription,
      isActive: true,
      ...(savedLocationId ? { locationId: savedLocationId } : {}),
    };

    const brandPayload = {
      brandName,
      email: brandEmail,
      // ⚠️ NOT independently confirmed from a Postman sample for
      // brands/update (only brandName/email/description/subCategoryId/
      // isOnboarding/showcaseSectionIds are documented there) — sent as a
      // `mobile` key per explicit instruction; verify the saved value once
      // tested and correct the key name here if it's wrong.
      mobile: effectiveMobile || undefined,
      description: brandDescription,
      subCategoryId: brandSubType,
      isOnboarding: true,
      // isActive removed — PUT /brands/update no longer accepts it (backend:
      // "isActive is not settable here. Use PUT /brands/admin/:brandId/status"),
      // since that's the vendor's account-active flag, admin-only now.
      showcaseSectionIds: showcaseAlbums.filter((a) => a.persisted).map((a) => a.id),
    };

    try {
      // ⚠️ workingHours arg removed — working hours are already persisted
      // independently via handleSaveWorkingHours, and this button is gated
      // behind workingHoursSaved being true, so they're guaranteed saved.
      await finalizeOutlet(subBrandId, subBrandPatch, brand._id, brandPayload, logoFile, coverFile);
      if (outletDraftKey) sessionStorage.removeItem(outletDraftKey);
      clearOutletImages(brand._id);
      setDraftReady(false);
      trackEvent(ANALYTICS_EVENTS.OUTLET_CREATED, { outlet_type: subBrandPatch.outletType });
      showSuccess("Outlet saved! Running verification…");
      // Fresh verification for this submit, not a result cached from before.
      try {
        sessionStorage.removeItem("v2-system-verify-result");
      } catch {
        /* ignore */
      }
      navigate("/verification");
    } catch (err) {
      console.error("Failed to save brand outlet:", err);
      showError(err.message || "Couldn't save your outlet. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Every showcase album that's been started must meet the same minimum
  // (MIN_ITEMS_PER_ALBUM) the album's own inline warning already shows —
  // this just makes that a hard block on final submit instead of a message
  // the vendor could ignore.
  const showcaseAlbumsMeetMinimum = showcaseAlbums.every((a) => a.media.length >= MIN_ITEMS_PER_ALBUM);

  // Advanced Details are required, not optional: at least 1 saved listing
  // feature and at least 1 saved showcase album with MIN_ITEMS_PER_ALBUM+
  // uploaded items. Only server-persisted items count, so an in-flight or
  // failed upload can't satisfy the gate. Gates both Step 1's Continue and
  // the final save (a restored draft could otherwise land past Step 1).
  const hasListingFeature = listingFeatures.some((f) => f.persisted);
  const hasShowcaseAlbum = showcaseAlbums.some(
    (a) => a.persisted && a.media.filter((m) => m.persisted).length >= MIN_ITEMS_PER_ALBUM
  );
  const showcaseComplete = hasShowcaseAlbum && showcaseAlbumsMeetMinimum;
  // Listing features + showcase are recommended, not mandatory: the vendor
  // can skip each one (after a "approval may be delayed" confirmation).
  const listingOk = hasListingFeature || listingSkipped;
  const showcaseOk = showcaseComplete || showcaseSkipped;
  const advancedDetailsOk = listingOk && showcaseOk;

  // Hours default to every day closed, and saving that still flips
  // workingHoursSaved — so also require at least one open day with both
  // times set, otherwise an outlet "open 0 days a week" could get through.
  const hasOpenDay = Object.values(workingHours || {}).some(
    (d) => d?.isOpen && d.start && d.end && d.start !== d.end
  );

  const canFinalSave =
    whatsappVerified && !!subBrandId && !!savedLocationId && workingHoursSaved && hasOpenDay && advancedDetailsOk;

  // ── Wizard step gates (UI-only — purely control when "Continue"/"Review
  // Outlet" become clickable; canFinalSave above, and everything it's built
  // from, is untouched). Sub-Category counts as satisfied once its list for
  // the chosen category has finished loading and is empty, or errored — so
  // a category with genuinely zero sub-categories (or a flaky API) can
  // never become an unrecoverable dead end under this new gate.
  const subCategorySatisfied =
    !!brandSubType ||
    (!!brandType && !subCategoriesLoading && (!!subCategoriesError || subCategories.length === 0));
  const canContinueStep1 =
    !!brandEmail.trim() && !!effectiveMobile.trim() && !!brandType && subCategorySatisfied && advancedDetailsOk;
  // Step 2 → Review: verified outlet WhatsApp (which also creates the
  // subBrand), a saved location, at least one open day, and saved hours —
  // and no location/hours save still in flight.
  const step2Missing = [
    !(whatsappVerified && subBrandId) && "Verify the outlet WhatsApp number",
    (!savedLocationId || locationSaving) && "Select and save the outlet location",
    !hasOpenDay && "Open at least 1 day with start and end time",
    (!workingHoursSaved || workingHoursSaving) && "Save working hours",
  ].filter(Boolean);
  const canContinueStep2 = step2Missing.length === 0;

  const categoryName = categories.find((c) => c._id === brandType)?.name || "";
  const subCategoryName = subCategories.find((s) => s._id === brandSubType)?.name || "";

  const outletTypeLabel = OUTLET_TYPE_OPTIONS.find((o) => o.value === outletType)?.label || "";
  // Category comes from onboarding (or the brand record); the picker is a
  // fallback only, so a missing category can never block the final save.
  const needsCategory =
    draftReady && (!brandType || (!brandSubType && !subCategoriesLoading && !subCategoriesError && subCategories.length > 0));
  const logoDisplayUrl = logoPreviewUrl || existingLogoUrl;
  const coverDisplayUrl = coverPreviewUrl || existingCoverUrl;
  const inputClass =
    "w-full rounded-[10px] border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.05)] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 sm:text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-700";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-gray-700 dark:text-gray-300";
  const primaryBtn =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
  // ── Review → edit → back to the same spot on Review ──
  const scrollToId = (id) =>
    setTimeout(() => {
      const el = id && document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);

  /** Leave the review for `step`, remembering where the vendor was. */
  const editFromReview = (step, targetId) => {
    setReturnToReview({ scrollY: window.scrollY });
    setWizardStep(step);
    scrollToId(targetId);
  };

  /** Straight back to the review, at the spot the vendor left from. */
  const backToReview = () => {
    const scrollY = returnToReview?.scrollY ?? 0;
    setReturnToReview(null);
    setWizardStep(3);
    setTimeout(() => window.scrollTo({ top: scrollY, behavior: "smooth" }), 80);
  };

  const selectStep = (step) => {
    if (step === 3 && returnToReview) backToReview();
    else setWizardStep(step);
  };

  const guidelineLink = (key) => (
    <button
      type="button"
      onClick={() => openGuideline(key)}
      className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
    >
      <Info size={13} aria-hidden="true" />
      Guidelines
    </button>
  );

  return (
    <div className="min-h-screen bg-app font-sans dark:bg-gray-950">
      {/* Toasts */}
      <ErrorToast error={toastError} onDismiss={() => setToastError(null)} />
      <SuccessToast message={toastSuccess} onDismiss={() => setToastSuccess("")} />

      {/* Modals */}
      {guidelineType && <GuidelinesModal type={guidelineType} onClose={closeGuideline} />}
      {otpStage && !whatsappVerified && (
        <OtpVerifyModal
          phone={outletWhatsapp}
          otpValue={otpValue}
          onOtpChange={setOtpValue}
          otpError={otpError}
          onConfirm={confirmOtp}
          onClose={closeOtpModal}
          onResend={resetOtp}
          resending={otpSending}
          confirming={otpConfirming}
          devOtpHint={devOtpHint}
        />
      )}
      {showMap && selectedPlace && (
        <div
          className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowMap(false)}
        >
          <MapModal place={selectedPlace} onClose={() => setShowMap(false)} />
        </div>
      )}

      <AppTopBar>
        <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
          Merchant Token: <span className="text-gray-900 dark:text-gray-100">{merchantToken}</span>
        </span>
      </AppTopBar>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {/* Header + 2-step tracker for Brand details / Outlet details. The
            review is a separate page after them with its own heading. */}
        {wizardStep !== 3 && (
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="h-9 w-1 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
              <div>
                <h1 className="text-xl font-extrabold leading-tight text-gray-900 sm:text-2xl dark:text-gray-100">
                  Create Your Brand Outlet
                </h1>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  You are just a few steps away from going live on Trydood.
                </p>
              </div>
            </div>
            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <OutletStepper currentStep={wizardStep} onSelect={selectStep} />
            </div>
          </div>
        )}

        {returnToReview && wizardStep !== 3 && (
          <div className="sticky top-16 z-20 mb-5 flex flex-col gap-2 rounded-2xl bg-sky-50/95 px-4 py-3 shadow-sm ring-1 ring-inset ring-sky-200 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:bg-sky-950/90 dark:ring-sky-500/30">
            <p className="flex items-start gap-2 text-[13px] text-sky-900 dark:text-sky-200">
              <Pencil size={15} className="mt-0.5 shrink-0 text-sky-700 dark:text-sky-400" aria-hidden="true" />
              <span>
                <strong className="font-bold">Editing from Review.</strong> Make your change, then go straight back — no need to
                redo the other steps.
              </span>
            </p>
            <button
              type="button"
              onClick={backToReview}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-sky-700 px-4 text-xs font-bold text-white hover:bg-sky-800"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to review
            </button>
          </div>
        )}

        {wizardStep === 1 && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              {/* ── Brand Details ── */}
              <OutletCard
                title="Brand Details"
                subtitle="Tell customers who you are — this stays the same across every outlet under this brand."
                action={guidelineLink("logo")}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <ImageUploadTile
                    label="Upload logo"
                    hint="Square · min 500×500"
                    previewUrl={logoDisplayUrl}
                    maxSizeMb={LOGO_MAX_MB}
                    onSelect={handleLogoSelect}
                    onError={showError}
                  />
                  <ImageUploadTile
                    shape="wide"
                    label="Upload cover image"
                    hint="Wide · 1200×400 recommended"
                    previewUrl={coverDisplayUrl}
                    maxSizeMb={COVER_MAX_MB}
                    onSelect={handleCoverSelect}
                    onError={showError}
                  />
                </div>
                <p className="mt-2 text-[11.5px] text-gray-500 dark:text-gray-400">
                  Logo and cover are optional — JPG, PNG, WebP or GIF. They make your listing stand out.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="brand-name" className={labelClass}>Brand name</label>
                    <input id="brand-name" value={brandName} disabled className={`${inputClass} capitalize`} />
                  </div>
                  <div>
                    <label htmlFor="brand-email" className={labelClass}>
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="brand-email"
                      type="email"
                      value={brandEmail}
                      onChange={(e) => setBrandEmail(e.target.value)}
                      placeholder="eg : hello@yourbrand.com"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="brand-mobile" className={labelClass}>
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <input
                        id="brand-mobile"
                        type="tel"
                        inputMode="numeric"
                        value={effectiveMobile}
                        disabled={mobileSameAsWhatsapp}
                        onChange={(e) => setBrandMobile(e.target.value)}
                        placeholder="eg : 9876543210"
                        className={`${inputClass} sm:max-w-xs`}
                      />
                      <label className="flex min-h-11 items-center gap-2 text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={mobileSameAsWhatsapp}
                          disabled={!brandWhatsappNumber}
                          onChange={(e) => setMobileSameAsWhatsapp(e.target.checked)}
                          className="size-4 accent-emerald-600 disabled:opacity-40"
                        />
                        Same as WhatsApp number
                        {brandWhatsappNumber ? ` (${brandWhatsappNumber})` : " (not available)"}
                      </label>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label htmlFor="brand-description" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                        Description <span className="font-normal text-gray-400">(optional)</span>
                      </label>
                      {guidelineLink("brandDescription")}
                    </div>
                    <textarea
                      id="brand-description"
                      value={brandDescription}
                      onChange={(e) => setBrandDescription(e.target.value)}
                      placeholder="eg : A cosy neighbourhood cafe known for its wood-fired pizzas and weekend live music."
                      rows={3}
                      maxLength={300}
                      className={`${inputClass} resize-none`}
                    />
                    <div className="mt-1 flex justify-between gap-3 text-[11px]">
                      <span className={brandDescription.trim().length >= 50 ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-gray-400"}>
                        50+ characters recommended
                      </span>
                      <span className="text-gray-400">{brandDescription.length}/300</span>
                    </div>
                  </div>
                </div>
              </OutletCard>

              {/* ── Category — already picked in onboarding; only shown as a
                  fallback when neither the brand nor onboarding has one ── */}
              {needsCategory && (
              <OutletCard title="Category" subtitle="We couldn't find the category you picked in onboarding — choose it again.">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Category <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={brandType}
                      onChange={handleCategoryChange}
                      options={categories.map((c) => ({ value: c._id, label: c.name }))}
                      placeholder={categoriesLoading ? "Loading categories…" : "eg : Food & Drinks"}
                      disabled={categoriesLoading}
                      className="border border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    />
                    {categoriesError && <p className="mt-1 text-xs text-red-500">{categoriesError}</p>}
                    {!categoriesLoading && !categoriesError && categories.length === 0 && (
                      <p className="mt-1 text-xs text-gray-400">No categories available right now.</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>
                      Sub-category <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={brandSubType}
                      onChange={setBrandSubType}
                      options={subCategories.map((s) => ({ value: s._id, label: s.name }))}
                      placeholder={subCategoriesLoading ? "Loading…" : "eg : Buffet restaurants"}
                      disabled={!brandType || subCategoriesLoading}
                      className="border border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    />
                    {subCategoriesError && <p className="mt-1 text-xs text-red-500">{subCategoriesError}</p>}
                    {brandType && !subCategoriesLoading && !subCategoriesError && subCategories.length === 0 && (
                      <p className="mt-1 text-xs text-gray-400">No sub-categories for this category.</p>
                    )}
                  </div>
                </div>
              </OutletCard>
              )}

              {/* ── Listing Features (recommended, skippable) ── */}
              <div id="outlet-listing-features" className="scroll-mt-24">
                <OutletCard
                  title={<span className="flex flex-wrap items-center gap-2">Listing Features <SectionBadge done={hasListingFeature} skipped={listingSkipped} /></span>}
                  subtitle="Up to 10 features that describe this listing (e.g. Free Wi-Fi, Parking, Live music). Each is saved immediately."
                  action={guidelineLink("listingFeatures")}
                >
                  {listingSkipped && !hasListingFeature ? (
                    <SkippedNotice name="listing features" onUndo={() => setListingSkipped(false)} />
                  ) : (
                    <>
                      <ListingFeaturesEditor features={listingFeatures} onChange={setListingFeatures} brandId={brand?._id} />
                      {!hasListingFeature && (
                        <SkipRow onSkip={() => setSkipConfirm("listing")} />
                      )}
                    </>
                  )}
                </OutletCard>
              </div>

              {/* ── Showcase Collection (recommended, skippable) ── */}
              <div id="outlet-showcase" className="scroll-mt-24">
                <OutletCard
                  title={<span className="flex flex-wrap items-center gap-2">Showcase Collection <SectionBadge done={showcaseComplete} skipped={showcaseSkipped} /></span>}
                  subtitle={`Up to 5 albums (Gallery, Menu, Ambience, Event…). Each album needs ${MIN_ITEMS_PER_ALBUM}+ photos or videos.`}
                  action={guidelineLink("showcase")}
                >
                  {showcaseSkipped && !showcaseComplete ? (
                    <SkippedNotice name="the showcase" onUndo={() => setShowcaseSkipped(false)} />
                  ) : (
                    <>
                      <ShowcaseAlbumsEditor albums={showcaseAlbums} onChange={setShowcaseAlbums} brandId={brand?._id} />
                      {!showcaseComplete && (
                        <SkipRow onSkip={() => setSkipConfirm("showcase")} />
                      )}
                    </>
                  )}
                </OutletCard>
              </div>

              <SkipConfirmModal
                open={Boolean(skipConfirm)}
                sectionName={skipConfirm === "listing" ? "Listing Features" : "Showcase"}
                onAddNow={() => setSkipConfirm(null)}
                onSkip={() => {
                  if (skipConfirm === "listing") setListingSkipped(true);
                  else setShowcaseSkipped(true);
                  setSkipConfirm(null);
                  // Came here from Review → skipping is the decision, so go straight back.
                  if (returnToReview) backToReview();
                }}
              />

              <div className="flex flex-col gap-3 rounded-2xl border border-[#E4E9E2] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 dark:border-gray-700 dark:bg-gray-800">
                {!advancedDetailsOk ? (
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                      <AlertTriangle size={16} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 text-xs leading-relaxed">
                      <p className="font-bold text-gray-900 dark:text-gray-100">Add or skip these to continue</p>
                      <ul className="mt-0.5 text-gray-600 dark:text-gray-400">
                        {!listingOk && <li>• Listing Features — add at least 1</li>}
                        {!showcaseOk && <li>• Showcase — 1 album with {MIN_ITEMS_PER_ALBUM}+ photos/videos</li>}
                      </ul>
                    </div>
                  </div>
                ) : listingSkipped && !hasListingFeature || showcaseSkipped && !showcaseComplete ? (
                  <p className="flex items-start gap-2 text-[12.5px] font-semibold text-amber-700 dark:text-amber-400">
                    <Clock size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    Ready — some sections skipped, so approval may take a little longer.
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <Check size={15} strokeWidth={3} aria-hidden="true" />
                    Brand details are ready
                  </p>
                )}
                <button
                  type="button"
                  onClick={returnToReview ? backToReview : () => setWizardStep(2)}
                  disabled={!canContinueStep1}
                  className={`${primaryBtn} w-full shrink-0 whitespace-nowrap sm:w-auto`}
                >
                  {returnToReview ? "Save & back to review" : "Continue to Outlet details"}
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:w-[340px] lg:shrink-0">
              <CustomerPreview
                coverUrl={coverDisplayUrl}
                logoUrl={logoDisplayUrl}
                brandName={brandName}
                categoryName={categoryName}
                subCategoryName={subCategoryName}
                description={brandDescription}
              />
            </aside>
          </div>
        )}

        {wizardStep === 2 && !returnToReview && (
          <button
            type="button"
            onClick={() => setWizardStep(1)}
            className="-mt-2 mb-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Brand details
          </button>
        )}

        {wizardStep === 2 && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              {/* ── Outlet Details (type + WhatsApp) ── */}
              <OutletCard
                title="Outlet Details"
                subtitle="Details specific to this particular outlet's location and presentation."
              >
                <label className="mb-4 flex min-h-11 items-center gap-2 text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={useBrandNumber}
                    onChange={(e) => handleUseBrandNumberToggle(e.target.checked)}
                    disabled={!brandWhatsappNumber || whatsappVerified}
                    className="size-4 accent-emerald-600 disabled:opacity-40"
                  />
                  Same as brand WhatsApp number
                  {brandWhatsappNumber ? ` (${brandWhatsappNumber})` : " (not available on your brand profile)"}
                </label>

                <div className={`grid gap-4 ${!whatsappVerified && !subBrandId ? "grid-cols-1 sm:grid-cols-[200px_1fr]" : "grid-cols-1"}`}>
                  {!whatsappVerified && !subBrandId && (
                    <div>
                      <label className={labelClass}>
                        Outlet type <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={outletType}
                        onChange={setOutletType}
                        options={OUTLET_TYPE_OPTIONS}
                        placeholder="eg : Outlet"
                        className="border border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="outlet-whatsapp" className={labelClass}>
                      Outlet WhatsApp number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        id="outlet-whatsapp"
                        type="tel"
                        inputMode="numeric"
                        value={outletWhatsapp}
                        onChange={(e) => handleOutletWhatsappChange(e.target.value)}
                        disabled={useBrandNumber || whatsappVerified}
                        placeholder="eg : 9876543210"
                        className={`${inputClass} sm:max-w-xs`}
                      />
                      {whatsappVerified ? (
                        <span className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          <Check size={13} strokeWidth={3} aria-hidden="true" />
                          {whatsappHydrated ? "Verified" : "Number verified"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyClick}
                          disabled={!isValidPhone(outletWhatsapp) || otpSending || (!subBrandId && !outletType)}
                          className={`${primaryBtn} px-5`}
                        >
                          {otpSending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                          {otpSending ? "Sending…" : subBrandId ? "Resend OTP" : "Send OTP"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Customers will reach this outlet on WhatsApp using this verified number.
                </p>
              </OutletCard>

              {/* ── Location ── */}
              <OutletCard
                title={<>Location <span className="text-red-500">*</span></>}
                subtitle="Help people in the area find your outlet."
                action={guidelineLink("location")}
              >
                {locationLoading && <p className="mb-3 text-xs text-gray-400">Loading your saved outlet location…</p>}
                <div onClick={() => notifyBlocked("Verify your outlet's WhatsApp number above before setting a location.")}>
                  <div className={outletSectionsBlocked ? "pointer-events-none opacity-50" : ""}>
                    {outletSectionsBlocked && (
                      <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                        Verify the outlet WhatsApp number first to set the location.
                      </p>
                    )}
                    <label className="mb-4 flex min-h-11 items-center gap-2 text-[13px] font-semibold text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={gstSameAsOutlet}
                        onChange={(e) => handleGstSameToggle(e.target.checked)}
                        disabled={outletSectionsBlocked}
                        className="size-4 accent-emerald-600"
                      />
                      GST address is the outlet address
                    </label>

                    <div className="mb-4 inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-700" role="tablist" aria-label="Location input">
                      {[
                        { mode: "search", label: "Search address" },
                        { mode: "live", label: "Use live location" },
                      ].map((tab) => (
                        <button
                          key={tab.mode}
                          type="button"
                          role="tab"
                          aria-selected={locationMode === tab.mode}
                          onClick={() => switchLocationMode(tab.mode)}
                          disabled={outletSectionsBlocked}
                          className={`min-h-9 rounded-lg px-3.5 text-xs font-bold transition-colors ${
                            locationMode === tab.mode
                              ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-400"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {locationMode === "search" ? (
                      <OutletLocationSearch selectedPlace={selectedPlace} onSelectPlace={handleSelectPlace} onShowMap={() => setShowMap(true)} onError={showError} />
                    ) : (
                      <LiveLocationPicker selectedPlace={selectedPlace} onSelectPlace={handleSelectPlace} onShowMap={() => setShowMap(true)} onError={showError} />
                    )}

                    {!locationSaveError && (locationSaving || savedLocationId) && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {locationSaving ? (
                          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Check size={13} strokeWidth={3} aria-hidden="true" />
                        )}
                        {locationSaving ? "Saving this location…" : "Location saved"}
                      </p>
                    )}
                  </div>
                </div>
              </OutletCard>
            </div>

            {/* ── Working Hours + next ── */}
            <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:w-[400px] lg:shrink-0">
              <OutletCard
                title={<>Working Hours <span className="text-red-500">*</span></>}
                subtitle="Set your open hours for each day of the week."
                action={guidelineLink("workingHours")}
              >
                <div onClick={() => notifyBlocked("Verify your outlet's WhatsApp number above before setting working hours.")}>
                  <div className={outletSectionsBlocked ? "pointer-events-none opacity-50" : ""}>
                    <WorkingHoursEditor
                      hours={workingHours}
                      onChange={handleWorkingHoursChange}
                      onSave={subBrandId ? handleSaveWorkingHours : undefined}
                      saving={workingHoursSaving}
                      hydrated={!locationLoading}
                    />
                    {workingHoursSaved && !workingHoursSaveError && (
                      <p className="mt-3 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:text-emerald-400 dark:ring-emerald-500/30">
                        <Check size={13} strokeWidth={3} aria-hidden="true" />
                        Working hours saved
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-700">
                  {!canContinueStep2 && (
                    <ul className="mb-3 flex flex-col gap-1 text-xs text-amber-700 dark:text-amber-400">
                      {step2Missing.map((m) => (
                        <li key={m}>• {m}</li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={returnToReview ? backToReview : () => setWizardStep(3)}
                    disabled={!canContinueStep2}
                    className={`${primaryBtn} w-full`}
                  >
                    {returnToReview ? "Save & back to review" : "Review your details"}
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </OutletCard>
            </aside>
          </div>
        )}

        {wizardStep === 3 && (
          <ReviewStep
            logoUrl={logoDisplayUrl}
            coverUrl={coverDisplayUrl}
            brandName={brandName}
            brandEmail={brandEmail}
            mobile={effectiveMobile}
            description={brandDescription}
            categoryName={categoryName}
            subCategoryName={subCategoryName}
            outletTypeLabel={outletTypeLabel}
            outletWhatsapp={outletWhatsapp}
            whatsappVerified={whatsappVerified}
            address={outletAddress}
            workingHours={workingHours}
            listingFeatureCount={listingFeatures.filter((f) => f.persisted).length}
            showcaseAlbums={showcaseAlbums}
            minItemsPerAlbum={MIN_ITEMS_PER_ALBUM}
            hasListingFeature={hasListingFeature}
            hasShowcaseAlbum={hasShowcaseAlbum}
            subscription={subscription}
            canFinalSave={canFinalSave}
            saving={saving}
            onEditStep1={() => editFromReview(1)}
            onEditStep2={() => editFromReview(2)}
            listingSkipped={listingSkipped && !hasListingFeature}
            showcaseSkipped={showcaseSkipped && !showcaseComplete}
            onOpenAdvanced={() => editFromReview(1, "outlet-listing-features")}
            onOpenShowcase={() => editFromReview(1, "outlet-showcase")}
            onAddListing={() => {
              // Un-skip so the editor shows, then jump to its card on Step 1.
              setListingSkipped(false);
              editFromReview(1, "outlet-listing-features");
            }}
            onAddShowcase={() => {
              setShowcaseSkipped(false);
              editFromReview(1, "outlet-showcase");
            }}
            onBack={() => {
              setReturnToReview(null);
              setWizardStep(2);
            }}
            onCreate={handleSave}
          />
        )}
      </main>
    </div>
  );
}
