import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/Logo1.jpg";
import { useBrand } from "../../../../hooks/useBrand";
import { useLogout } from "@/hooks/useLogout";

import { useCategories } from "../hooks/useCategories";
import { useWhatsappOtp, isValidPhone } from "../hooks/useWhatsappOtp";
import {
  finalizeOutlet,
  upsertWorkHours,
  getBrandWithSubBrand,
  OUTLET_TYPES,
} from "../services/brandOutletApi";
import {
  createLocation,
  getBrandLocation,
  mapLocationToSelectedPlace,
  buildLocationPayloadFromPlace,
  buildLocationPayloadFromGstAddress,
  hasValidCoordinates,
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

export default function CreateBrandOutlet() {
  const { brand, loading } = useBrand();
  const navigate = useNavigate();
  const { handleLogout } = useLogout();

  // ── Brand form state ──
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandType, setBrandType] = useState("");
  const [brandSubType, setBrandSubType] = useState("");
  const [listingFeatures, setListingFeatures] = useState([]);
  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);
  const [showcaseAlbums, setShowcaseAlbums] = useState([]);
  const [logoFile, setLogoFile] = useState(null);

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
  // successful upsertWorkHours call. Reset to false the moment hours are
  // edited again, so a stale save can't silently pass the gate.
  const [workingHoursSaved, setWorkingHoursSaved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [guidelineType, setGuidelineType] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Guards each one-time mount effect so it can't double-fire (e.g. React
  // StrictMode double-invoke in dev) or fight with in-progress user edits.
  const hydratedLocationRef = useRef(false);
  const hydratedWhatsappRef = useRef(false);

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
  } = useWhatsappOtp({ brandId: brand?._id, brandWhatsappNumber, isFirstOutlet: true });

  const openGuideline = useCallback((type) => setGuidelineType(type), []);
  const closeGuideline = useCallback(() => setGuidelineType(null), []);

  const persistLocationPayload = useCallback(async (payload) => {
    setLocationSaving(true);
    setLocationSaveError("");
    try {
      const res = await createLocation(payload);
      const saved = res?.data ?? res;
      setSavedLocationId(saved?._id || saved?.id || null);
      return saved;
    } catch (err) {
      setSavedLocationId(null);
      setLocationSaveError(err.message || "Couldn't save this location. Try again.");
    } finally {
      setLocationSaving(false);
    }
  }, []);

  const persistSelectedPlace = useCallback((place) => {
    if (!place) {
      setSavedLocationId(null);
      setLocationSaveError("");
      return;
    }
    const payload = buildLocationPayloadFromPlace(place, {
      brandId: brand?._id,
      addressType: ADDRESS_TYPES.WORK,
    });
    if (!hasValidCoordinates(payload)) {
      setSavedLocationId(null);
      setLocationSaveError("This location is missing map coordinates — try picking it again.");
      return;
    }
    persistLocationPayload(payload);
  }, [brand?._id, persistLocationPayload]);

  // GST checked → build the payload from brand.gst.address AND surface it
  // as `selectedPlace` too, so OutletLocationSearch's input shows the
  // resolved address and its "show map" button works off the same data.
  const persistGstAddress = useCallback(() => {
    const gstAddr = brand?.gst?.address || {};
    const payload = buildLocationPayloadFromGstAddress(gstAddr, {
      brandId: brand?._id,
      addressType: ADDRESS_TYPES.WORK,
    });

    setSelectedPlace({
      name: gstAddr.name || "GST Address",
      address: gstAddr.location || gstAddr.address || "",
      lat: payload.lat ?? payload.latitude ?? null,
      lng: payload.lng ?? payload.longitude ?? null,
      placeId: gstAddr.placeId || null,
      addressComponents: gstAddr.addressComponents || null,
      source: "gst",
    });

    if (!hasValidCoordinates(payload)) {
      setSavedLocationId(null);
      setLocationSaveError("Your GST address doesn't have map coordinates on file — search or pin the outlet location manually instead.");
      return;
    }
    persistLocationPayload(payload);
  }, [brand, persistLocationPayload]);

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlace(place);
    persistSelectedPlace(place);
  }, [persistSelectedPlace]);

  const handleGstSameToggle = useCallback((checked) => {
    setGstSameAsOutlet(checked);
    if (checked) {
      setLocationMode("search");
      persistGstAddress();
    } else if (selectedPlace) {
      persistSelectedPlace(selectedPlace);
    } else {
      setSavedLocationId(null);
      setLocationSaveError("");
    }
  }, [persistGstAddress, persistSelectedPlace, selectedPlace]);

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
    } catch (err) {
      setWorkingHoursSaveError(err.message || "Couldn't save working hours. Try again.");
    } finally {
      setWorkingHoursSaving(false);
    }
  }, [subBrandId, workingHours]);

  // Hours changed after a save → that save is now stale, require re-save
  // before the final "Save & Process" button unlocks again.
  const handleWorkingHoursChange = useCallback((next) => {
    setWorkingHours(next);
    setWorkingHoursSaved(false);
  }, []);

  // ── Prefill: load the brand's already-saved outlet location on mount ──
  useEffect(() => {
    if (!brand?._id || hydratedLocationRef.current) return;
    hydratedLocationRef.current = true;
    (async () => {
      try {
        const loc = await getBrandLocation(brand._id);
        if (loc) {
          const place = mapLocationToSelectedPlace(loc);
          setSelectedPlace(place);
          setSavedLocationId(loc._id || loc.id || null);
        }
      } catch (err) {
        console.error("Couldn't load existing outlet location:", err.message);
      } finally {
        setLocationLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?._id]);

  useEffect(() => {
    if (!loading && !brand?._id) setLocationLoading(false);
  }, [loading, brand?._id]);

  // ── Prefill: if this brand already has a verified outlet subBrand,
  // skip OTP entirely — hydrate whatsappVerified/subBrandId directly. ──
  useEffect(() => {
    if (!brand?._id || hydratedWhatsappRef.current) return;
    hydratedWhatsappRef.current = true;
    (async () => {
      try {
        const info = await getBrandWithSubBrand(brand._id);
        if (info?.whatsappVerified && info.subBrandId) {
          hydrateVerified({
            subBrandId: info.subBrandId,
            whatsappNumber: info.whatsappNumber,
          });
        }
      } catch (err) {
        console.error("Couldn't check existing outlet verification:", err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?._id]);

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
      description: brandDescription,
      subCategoryId: brandSubType,
      isOnboarding: true,
      isActive: true,
      showcaseSectionIds: showcaseAlbums.filter((a) => a.persisted).map((a) => a.id),
    };

    try {
      // ⚠️ workingHours arg removed — working hours are already persisted
      // independently via handleSaveWorkingHours, and this button is gated
      // behind workingHoursSaved being true, so they're guaranteed saved.
      await finalizeOutlet(subBrandId, subBrandPatch, brand._id, brandPayload, logoFile);
      navigate("/under-review");
    } catch (err) {
      console.error("Failed to save brand outlet:", err);
    } finally {
      setSaving(false);
    }
  };

  const canFinalSave = whatsappVerified && !!subBrandId && !!savedLocationId && workingHoursSaved;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Your Brand Outlet</h1>
            <p className="text-sm text-gray-500 mt-1">You are just a few steps away from listing your event on Trydood!</p>
          </div>
          <div className="border-2 border-dashed border-blue-300 rounded-xl px-6 py-3 bg-blue-50 text-sm font-semibold text-gray-700 whitespace-nowrap">
            Merchant Token : <span className="text-gray-900">{merchantToken}</span>
          </div>
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* ══════════════════════ BRAND FORM ══════════════════════ */}
        <div className="brand-form-section">
          <FormDivider title="Brand Details" subtitle="Tell customers who you are — this stays the same across every outlet under this brand." />

          <SectionCard>
            <SectionHeader title="Brand Logo" subtitle="Upload Your Brand Identity Logo" guidelineKey="logo" onGuidelineClick={openGuideline} />
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Brand Description</label>
              <button onClick={() => openGuideline("brandDescription")} className="text-sm text-blue-500 hover:underline whitespace-nowrap flex items-center gap-1">
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 transition-colors bg-white text-gray-800 resize-none"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 appearance-none bg-white text-gray-700 disabled:opacity-50"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 appearance-none bg-white text-gray-700 disabled:opacity-50"
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
        {/* Order: WhatsApp Number → Location → Working Hours → Outlet Type */}
        <div className="outlet-form-section">
          <FormDivider title="Outlet Details" subtitle="Details specific to this particular outlet's location and presentation." />

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
                className="w-4 h-4 accent-indigo-600 cursor-pointer disabled:opacity-40"
              />
              Use my Brand's WhatsApp number
              {brandWhatsappNumber ? ` (${brandWhatsappNumber})` : " (not available on your brand profile)"}
            </label>
            <div className="flex gap-2 max-w-sm">
              <input
                type="tel"
                value={outletWhatsapp}
                onChange={(e) => handleOutletWhatsappChange(e.target.value)}
                disabled={useBrandNumber || whatsappVerified}
                placeholder="eg : 9876543210"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white text-gray-700 disabled:bg-gray-100 disabled:text-gray-500"
              />
              {!whatsappVerified && (
                <button
                  onClick={sendOtp}
                  disabled={!isValidPhone(outletWhatsapp) || otpSending}
                  className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isValidPhone(outletWhatsapp) && !otpSending ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {otpSending ? "Sending…" : "Verify"}
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

            <div className="border border-gray-200 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="gstSame"
                  checked={gstSameAsOutlet}
                  onChange={(e) => handleGstSameToggle(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                />
                <div>
                  <label htmlFor="gstSame" className="text-sm font-bold text-gray-800 cursor-pointer">
                    GST Address Is The Same As The Outlet Location.
                  </label>
                  <p className="text-sm text-gray-500 mt-0.5">Search and select your Outlet address</p>
                </div>
              </div>

              {(locationSaving || locationSaveError || (savedLocationId && gstSameAsOutlet)) && (
                <p className={`text-xs mt-3 ${locationSaveError ? "text-red-500" : "text-emerald-600"}`}>
                  {locationSaving ? "Saving this address…" : locationSaveError ? locationSaveError : "✓ GST address saved as your outlet location."}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-4 px-1">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                <input type="checkbox" checked={locationMode === "search"} onChange={() => switchLocationMode("search")} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                Search My Outlet Location
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                <input type="checkbox" checked={locationMode === "live"} onChange={() => switchLocationMode("live")} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                Use My Live Location
              </label>
            </div>

            {locationMode === "search" ? (
              <OutletLocationSearch selectedPlace={selectedPlace} onSelectPlace={handleSelectPlace} onShowMap={() => setShowMap(true)} />
            ) : (
              <LiveLocationPicker selectedPlace={selectedPlace} onSelectPlace={handleSelectPlace} onShowMap={() => setShowMap(true)} />
            )}

            {!gstSameAsOutlet && (locationSaving || locationSaveError || savedLocationId) && (
              <p className={`text-xs mt-3 px-1 ${locationSaveError ? "text-red-500" : "text-emerald-600"}`}>
                {locationSaving ? "Saving this location…" : locationSaveError ? locationSaveError : "✓ Location saved."}
              </p>
            )}
          </SectionCard>

          {/* ── 3. Working Hours ── */}
          <SectionCard>
            <SectionHeader title="Working Hours" subtitle="Set your open hours for each day of the week." guidelineKey="workingHours" onGuidelineClick={openGuideline} />
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
          </SectionCard>

          {/* ── 4. Outlet Type ── */}
          <SectionCard>
            <SectionHeader title="Outlet Type" subtitle="Is this a standalone outlet, or part of a franchise network?" />
            <div className="max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Type *</label>
              <div className="relative">
                <select
                  value={outletType}
                  onChange={(e) => setOutletType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 appearance-none bg-white text-gray-700"
                >
                  <option value="">eg : Outlet</option>
                  {OUTLET_TYPE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
                <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Create ── */}
        <button
          onClick={handleSave}
          disabled={saving || !canFinalSave}
          className="w-full bg-[#1a1a2e] text-white font-semibold py-4 rounded-2xl text-base hover:bg-[#2d2d5e] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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