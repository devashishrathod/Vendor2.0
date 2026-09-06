import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/Logo1.jpg";
import { useBrand } from "../../../../hooks/useBrand";
import { useLogout } from "@/hooks/useLogout";
import ErrorToast from "../../../../components/common/ErrorToast";
import SuccessToast from "../../../../components/common/SuccessToast";

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
import { DEFAULT_WORKING_HOURS, OUTLET_TYPE_OPTIONS } from "../constants/brandOutletConstants";

import {
  GuidelinesModal,
  MapModal,
  OtpVerifyModal,
  SectionCard,
  SectionHeader,
  FormDivider,
  UploadBox,
  ListingFeaturesEditor,
  ShowcaseAlbumsEditor,
  WorkingHoursEditor,
  OutletLocationSearch,
  LiveLocationPicker,
} from "../components/brandOutlet";

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function CreateBrandOutlet() {
  const { brand, loading } = useBrand();
  const navigate = useNavigate();
  const { handleLogout } = useLogout();

  // ── Brand form state ──
  const [brandName, setBrandName] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandType, setBrandType] = useState("");
  const [brandSubType, setBrandSubType] = useState("");
  const [listingFeatures, setListingFeatures] = useState([]);
  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);
  const [showcaseAlbums, setShowcaseAlbums] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  // Vendor ne pehle se logo upload kiya ho to uska URL yahan aata hai
  // (brands/get response se) — sirf preview ke liye. Jab tak user naya
  // file na chune, upload par existingLogoUrl hi kaam aayega (naya file
  // select hote hi preview automatically switch ho jaata hai).
  const [existingLogoUrl, setExistingLogoUrl] = useState("");

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
  const [mapsLink, setMapsLink] = useState("");
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

  // Guards the one-time mount prefill effect so it can't double-fire (e.g.
  // React StrictMode double-invoke in dev) or fight with in-progress user
  // edits.
  const hydratedBrandDetailsRef = useRef(false);

  const brandWhatsappNumber = brand?.whatsappNumber || brand?.phone || brand?.mobile || "";

  const {
    outletWhatsapp,
    useBrandNumber,
    whatsappVerified,
    subBrandId,
    otpStage,
    otpValue,
    otpSending,
    otpError,
    devOtpHint,
    hydrated: whatsappHydrated,
    setOtpValue,
    handleUseBrandNumberToggle,
    handleOutletWhatsappChange,
    sendOtp,
    resetOtp, // resend/reset — calls loginOrSignUp-with-whatsapp only
    confirmOtp,
    closeOtpModal,
    hydrateVerified,
    hydrateUnverifiedShell,
  } = useWhatsappOtp({ brandId: brand?._id, brandWhatsappNumber, isFirstOutlet: true });

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
      if (!data) return;

      // ── Brand-level fields ──
      if (data.brandName) setBrandName(data.brandName);
      if (data.email) setBrandEmail(data.email);
      if (data.description) setBrandDescription(data.description);
      if (data.categoryId) setBrandType(data.categoryId);
      if (data.subCategoryId) setBrandSubType(data.subCategoryId);
      if (data.logo) setExistingLogoUrl(data.logo);

      const fsb = data.firstSubBrand;

      // ── Case 3: no firstSubBrand at all → brand-new outlet. Nothing
      // to hydrate here; the first "Verify" click will call sendOtp,
      // which creates the subBrand shell (subBrands/signUp-with-whatsapp)
      // AND sends the first OTP. Location/working-hours/outlet-type stay
      // blocked until that shell exists (outletSectionsBlocked = !subBrandId).
      if (!fsb) return;

      // ── Outlet type ──
      // ⚠️ CONFIRM: OUTLET_TYPE_OPTIONS values assumed to be the
      // lowercase "outlet"/"franchise" strings, matching the existing
      // handleSave mapping (outletType === "franchise" ? FRANCHISE : OUTLET).
      if (fsb.outletType) {
        setOutletType(fsb.outletType === OUTLET_TYPES.FRANCHISE ? "franchise" : "outlet");
      }

      // ── WhatsApp number + verification ──
      // fsb.user.isMobileVerified is the real "is this outlet's
      // WhatsApp number verified" flag returned by brands/get.
      const isNumberVerified = !!fsb.user?.isMobileVerified;

      if (isNumberVerified && fsb._id) {
        // ── Case 1: shell exists AND already verified ──
        // Skip OTP entirely. Verify button disappears, "Already
        // verified for this outlet" shows instead.
        hydrateVerified({
          subBrandId: fsb._id,
          whatsappNumber: fsb.whatsappNumber,
        });
      } else if (fsb._id) {
        // ── Case 2: shell exists but NOT verified yet ──
        // Prefill subBrandId + number, but leave whatsappVerified false.
        // The Verify button (handleVerifyClick above) will see
        // subBrandId already set and call resetOtp (just resends via
        // auth/loginOrSignUp-with-whatsapp) instead of sendOtp — so we
        // never try to recreate a shell that's already there.
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
    } catch (err) {
      console.error("Couldn't load existing brand/outlet details:", err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?._id]);

  useEffect(() => {
    if (!brand?._id || hydratedBrandDetailsRef.current) return;
    hydratedBrandDetailsRef.current = true;
    hydrateOutletFromBrand().finally(() => setLocationLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?._id]);

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

  // ⚠️ FIXED: this early return now happens AFTER every hook has been
  // called, on every single render (loading true or false). Nothing below
  // this line may declare a new hook — only plain derived consts and JSX.
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading...</div>;
  }

  const merchantToken = brand?.merchantId || "—";
  const gstAddress = brand?.gst?.address?.location || "";
  const outletAddress = gstSameAsOutlet ? gstAddress : (selectedPlace?.address || "");

  const handleCategoryChange = (e) => {
    setBrandType(e.target.value);
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
      await finalizeOutlet(subBrandId, subBrandPatch, brand._id, brandPayload, logoFile);
      showSuccess("Outlet saved! Redirecting…");
      navigate("/under-review");
    } catch (err) {
      console.error("Failed to save brand outlet:", err);
      showError(err.message || "Couldn't save your outlet. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const canFinalSave = whatsappVerified && !!subBrandId && !!savedLocationId && workingHoursSaved;

  return (
    <div className="min-h-screen bg-[#F8FAF7] font-sans">
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

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
            <img
              src={logo}
              alt="Trydood"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <span className="text-emerald-400 text-xs font-bold hidden">T</span>
          </div>
        </div>

        <div className="absolute top-4 right-5 z-20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors duration-150 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-9 rounded-full bg-emerald-500 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Create Your Brand Outlet</h1>
              <p className="text-sm text-gray-500 mt-1">You are just a few steps away from listing your event on Trydood!</p>
            </div>
          </div>
          <div className="border border-emerald-100 rounded-xl px-6 py-3 bg-emerald-50 text-sm font-semibold text-gray-700 whitespace-nowrap">
            Merchant Token : <span className="text-gray-900">{merchantToken}</span>
          </div>
        </div>

        {/* ══════════════════════ BRAND FORM ══════════════════════ */}
        <div className="brand-form-section bg-emerald-50/40 border border-emerald-100 rounded-3xl p-4 sm:p-6 mb-8">
          <FormDivider
            title="Brand Details"
            subtitle="Tell customers who you are — this stays the same across every outlet under this brand."
            icon={
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <SectionCard>
            <SectionHeader title="Brand Logo" subtitle="Upload Your Brand Identity Logo" guidelineKey="logo" onGuidelineClick={openGuideline} />
            {existingLogoUrl && !logoFile && (
              <div className="mb-3 flex items-center gap-3">
                <img
                  src={existingLogoUrl}
                  alt="Current brand logo"
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
                <span className="text-xs text-gray-500">Current logo — upload a new file below to replace it.</span>
              </div>
            )}
            <UploadBox
              accept="image/*"
              mediaType="image"
              sizeRule="1:1 ratio (min 500×500 px)"
              sizeLimit="1.5 MB"
              maxFiles={1}
              onFileSelect={(file) => setLogoFile(file)}
            />
          </SectionCard>

          <SectionCard>
            <SectionHeader title="Brand Email" subtitle="Used for order and account notifications." />
            <input
              type="email"
              value={brandEmail}
              onChange={(e) => setBrandEmail(e.target.value)}
              placeholder="eg : hello@yourbrand.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white text-gray-700"
            />
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Brand Description</label>
              <button onClick={() => openGuideline("brandDescription")} className="text-sm text-emerald-600 hover:underline whitespace-nowrap flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                More Guidelines
              </button>
            </div>
            <textarea
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              placeholder="eg : A cosy neighbourhood cafe known for its wood-fired pizzas and weekend live music."
              rows={4}
              maxLength={300}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 transition-colors bg-white text-gray-800 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{brandDescription.length}/300</p>
          </SectionCard>

          <SectionCard>
            <SectionHeader title="Brand Type" subtitle="Add category and sub-category tags to help the right audience discover your event." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <div className="relative">
                  <select
                    value={brandType}
                    onChange={handleCategoryChange}
                    disabled={categoriesLoading}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 appearance-none bg-white text-gray-700 disabled:opacity-50"
                  >
                    <option value="">{categoriesLoading ? "Loading categories…" : "eg : Food & Drinks"}</option>
                    {categories.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                  </select>
                  <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {categoriesError && <p className="text-xs text-red-500 mt-1">{categoriesError}</p>}
                {!categoriesLoading && !categoriesError && categories.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No categories available right now.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-Category</label>
                <div className="relative">
                  <select
                    value={brandSubType}
                    onChange={(e) => setBrandSubType(e.target.value)}
                    disabled={!brandType || subCategoriesLoading}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 appearance-none bg-white text-gray-700 disabled:opacity-50"
                  >
                    <option value="">{subCategoriesLoading ? "Loading…" : "eg : buffet restaurants"}</option>
                    {subCategories.map((s) => (<option key={s._id} value={s._id}>{s.name}</option>))}
                  </select>
                  <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {subCategoriesError && <p className="text-xs text-red-500 mt-1">{subCategoriesError}</p>}
                {brandType && !subCategoriesLoading && !subCategoriesError && subCategories.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No sub-categories for this category.</p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader
              title="Listing Features"
              subtitle="Add up to 10 active features that describe this listing. Each is saved immediately."
              guidelineKey="listingFeatures"
              onGuidelineClick={openGuideline}
            />
            <ListingFeaturesEditor features={listingFeatures} onChange={setListingFeatures} brandId={brand?._id} />
          </SectionCard>

          <SectionCard>
            <SectionHeader
              title="Showcase Collection"
              subtitle="Create up to 5 albums (e.g. Gallery Photo, Menu Photo, Ambience Photo, Event Photo) and upload photos or videos to each. Need something else? Add My Custom Collection."
              guidelineKey="showcase"
              onGuidelineClick={openGuideline}
            />
            <ShowcaseAlbumsEditor albums={showcaseAlbums} onChange={setShowcaseAlbums} brandId={brand?._id} />
          </SectionCard>
        </div>

        {/* ══════════════════════ OUTLET FORM ══════════════════════ */}
        {/* Order: WhatsApp Number (+ Outlet Type) → Location → Working Hours */}
        <div className="outlet-form-section bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 mb-8">
          <FormDivider
            title="Outlet Details"
            subtitle="Details specific to this particular outlet's location and presentation."
            icon={
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6" />
              </svg>
            }
          />

          {/* ── 1. Outlet WhatsApp Number ── */}
          <SectionCard>
            <SectionHeader title="Outlet WhatsApp Number" subtitle="Customers will reach this outlet on WhatsApp using this verified number." />
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet WhatsApp Number *</label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useBrandNumber}
                onChange={(e) => handleUseBrandNumberToggle(e.target.checked)}
                disabled={!brandWhatsappNumber}
                className="w-4 h-4 accent-emerald-600 cursor-pointer disabled:opacity-40"
              />
              Same as Brand Business WhatsApp Number
              {brandWhatsappNumber ? ` (${brandWhatsappNumber})` : " (not available on your brand profile)"}
            </label>
            {!whatsappVerified && !subBrandId && (
              <div className="max-w-sm mb-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Type *</label>
                <div className="relative">
                  <select
                    value={outletType}
                    onChange={(e) => setOutletType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 appearance-none bg-white text-gray-700"
                  >
                    <option value="">eg : Outlet</option>
                    {OUTLET_TYPE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                  </select>
                  <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
            <div className="flex gap-2 max-w-sm">
              <input
                type="tel"
                value={outletWhatsapp}
                onChange={(e) => handleOutletWhatsappChange(e.target.value)}
                disabled={useBrandNumber || whatsappVerified}
                placeholder="eg : 9876543210"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white text-gray-700 disabled:bg-gray-100 disabled:text-gray-500"
              />
              {!whatsappVerified && (
                <button
                  onClick={handleVerifyClick}
                  disabled={!isValidPhone(outletWhatsapp) || otpSending || (!subBrandId && !outletType)}
                  className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isValidPhone(outletWhatsapp) && !otpSending && (subBrandId || outletType)
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {otpSending && (
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  {otpSending ? "Sending…" : otpStage ? "Resend" : "Verify"}
                </button>
              )}
            </div>
            {useBrandNumber && !whatsappVerified && (
              <p className="text-xs text-amber-600 mt-2">This number is pulled from your brand profile, but still needs to be verified for this outlet.</p>
            )}
            {whatsappVerified && (
              <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {whatsappHydrated ? "Already verified for this outlet" : "Number verified"}
              </p>
            )}
            {!whatsappVerified && <p className="text-xs text-gray-400 mt-2">Verify your WhatsApp number to enable Save & Process.</p>}
          </SectionCard>

          {/* ── 2. Location ── */}
          <SectionCard>
            <SectionHeader
              title="Location"
              subtitle="Help people in the area discover your event and let attendees know where to show up."
              guidelineKey="location"
              onGuidelineClick={openGuideline}
            />

            {locationLoading && (
              <p className="text-xs text-gray-400 mb-3">Loading your saved outlet location…</p>
            )}
            {/* {outletSectionsBlocked && !locationLoading && (
              <p className="text-xs text-amber-600 mb-3">
                Verify your outlet's WhatsApp number above before setting a location.
              </p>
            )} */}

            <div onClick={() => notifyBlocked("Verify your outlet's WhatsApp number above before setting a location.")}>
              <div className={outletSectionsBlocked ? "opacity-50 pointer-events-none" : ""}>
                <div className="border border-gray-200 rounded-xl p-4 mb-5">
                  <div className="flex items-start gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="gstSame"
                      checked={gstSameAsOutlet}
                      onChange={(e) => handleGstSameToggle(e.target.checked)}
                      disabled={outletSectionsBlocked}
                      className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="gstSame" className="text-sm font-bold text-gray-800 cursor-pointer">
                        GST Address Is The Same As The Outlet Location.
                      </label>
                      <p className="text-sm text-gray-500 mt-0.5">Search and select your Outlet address</p>
                    </div>
                  </div>

                  {/* {gstSameAsOutlet && !savedLocationId && !locationSaving && !locationSaveError && (
                    <p className="text-xs text-amber-600 mt-3">
                      We've filled in your GST address below — pick the matching result from the dropdown to confirm and save it.
                    </p>
                  )} */}

                  {/* Saving/success status only here — any error is about the
                      search RESULT picked below, so it's shown there instead,
                      right next to the control the vendor needs to fix it. */}
                  {!locationSaveError && (locationSaving || (savedLocationId && gstSameAsOutlet)) && (
                    <p className="text-xs mt-3 text-emerald-600">
                      {locationSaving ? "Saving this address…" : "✓ GST address saved as your outlet location."}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-6 mb-4 px-1">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                    <input type="checkbox" checked={locationMode === "search"} onChange={() => switchLocationMode("search")} disabled={outletSectionsBlocked} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                    Search My Outlet Location
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                    <input type="checkbox" checked={locationMode === "live"} onChange={() => switchLocationMode("live")} disabled={outletSectionsBlocked} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                    Use My Live Location
                  </label>
                </div>

                {locationMode === "search" ? (
                  <OutletLocationSearch selectedPlace={selectedPlace} onSelectPlace={handleSelectPlace} onShowMap={() => setShowMap(true)} />
                ) : (
                  <LiveLocationPicker selectedPlace={selectedPlace} onSelectPlace={handleSelectPlace} onShowMap={() => setShowMap(true)} />
                )}

                {(locationSaving || locationSaveError || (savedLocationId && !gstSameAsOutlet)) && (
                  <p className={`text-xs mt-3 px-1 flex items-start gap-1.5 ${locationSaveError ? "text-red-500" : "text-emerald-600"}`}>
                    {locationSaveError && (
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>
                      {locationSaving ? "Saving this location…" : locationSaveError ? locationSaveError : "✓ Location saved."}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ── 3. Working Hours ── */}
          <SectionCard>
            <SectionHeader title="Working Hours" subtitle="Set your open hours for each day of the week." guidelineKey="workingHours" onGuidelineClick={openGuideline} />

            {/* Blocked until the outlet's WhatsApp number is verified —
                upsertWorkHours needs subBrandId, which doesn't exist yet. */}
            {/* {outletSectionsBlocked && (
              <p className="text-xs text-amber-600 mb-3">
                Verify your outlet's WhatsApp number above before setting working hours.
              </p>
            )} */}

            <div onClick={() => notifyBlocked("Verify your outlet's WhatsApp number above before setting working hours.")}>
              <div className={outletSectionsBlocked ? "opacity-50 pointer-events-none" : ""}>
                <WorkingHoursEditor
                  hours={workingHours}
                  onChange={handleWorkingHoursChange}
                  onSave={subBrandId ? handleSaveWorkingHours : undefined}
                  saving={workingHoursSaving}
                />
                {workingHoursSaveError && <p className="text-xs text-red-500 mt-2">{workingHoursSaveError}</p>}
                {workingHoursSaved && !workingHoursSaveError && (
                  <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Working hours saved.
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

        </div>

        {/* ── Create ── */}
        <button
          onClick={handleSave}
          disabled={saving || !canFinalSave}
          className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl text-base tracking-wide hover:bg-emerald-600 active:scale-[0.99] transition-all shadow-sm shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2"
        >
          {saving
            ? "Saving…"
            : !whatsappVerified
              ? "Verify WhatsApp Number to Continue"
              : !savedLocationId
                ? "Select & Save Your Outlet Location"
                : !workingHoursSaved
                  ? "Save Working Hours to Continue"
                  : "Save & Process"}
        </button>
      </div>
    </div>
  );
}