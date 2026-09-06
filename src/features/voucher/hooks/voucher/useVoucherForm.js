// src/hooks/voucher/useVoucherForm.js
// Add/Edit form state + submit logic, wired to the real VoucherService.js
// (createVoucher / updateVoucher / getVoucherById — multipart form-data).
// Field shape here matches VoucherForm.jsx's repeatable `offers` + `images`
// UI, which in turn matches the confirmed Postman `offers` array 1:1.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../onboarding/store/authStore";
import { useOnboardingStore } from "../../../onboarding/store/onboardingStore";
import useBrandData from "../../../brand/hooks/useBrandData";
import {
  getVoucherById,
  createVoucher,
  updateVoucher,
} from "../../services/voucher/VoucherService";

function createEmptyOffer() {
  return {
    title: "",
    minBillAmount: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscountAmount: "",
    usageType: "MULTIPLE",
    discountApplicableOn: "SUBTOTAL",
    isActive: true,
  };
}

function createEmptyForm() {
  return {
    voucherName: "",
    brandId: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    // Real outlet ids applied to `subBrandIds` on submit — the count
    // fields below are for display only (wire them up once you have an
    // outlet picker that returns real ids).
    selectedOutletIds: [],
    applicableOutlets: {
      selectedBrandOutletCount: 0,
      totalOutletsCount: 0,
      subBrandCount: 0,
      franchiseCount: 0,
    },
    searchTags: [],
    offers: [createEmptyOffer()],
    images: [], // newly-picked File objects, pending upload
    existingImageUrls: [], // already-uploaded urls (edit mode only)
    isSaveAsDraft: false,
    // Banner — add mode only. Changing an existing voucher's banner is a
    // separate flow (VoucherBannerModal.jsx, opened from VoucherTable),
    // not part of this form at all.
    bannerType: "IMAGE",
    bannerImage: null, // newly-picked File, pending upload
    bannerVideo: "",
    bannerGif: "",
  };
}

// Combine a yyyy-mm-dd date input + an HH:mm time input into an ISO
// datetime string. Parsed as UTC (trailing "Z") so picking 2026-08-20 /
// 00:00 always sends "2026-08-20T00:00:00.000Z" — without it, `new Date()`
// parses the string as the browser's local time and `.toISOString()`
// shifts it by the local UTC offset (e.g. IST would send the previous
// day's evening instead of midnight).
function toIsoDateTime(dateStr, timeStr) {
  if (!dateStr) return undefined;
  const date = new Date(`${dateStr}T${timeStr || "00:00"}:00.000Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

// Split an ISO datetime back into { date: "yyyy-mm-dd", time: "HH:mm" } for
// prefilling the form inputs in edit mode.
function fromIsoDateTime(iso) {
  if (!iso) return { date: "", time: "" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toISOString().slice(11, 16),
  };
}

// `version` is one item from GET /vouchers/versions/get-all (see
// getVoucherById) — the flat fields (name, description, tags, startAt,
// endAt, images, offers) belong to this version; brandId only exists on
// the nested `version.voucher`.
function voucherToForm(version) {
  const empty = createEmptyForm();
  if (!version) return empty;

  const start = fromIsoDateTime(version.startAt);
  const end = fromIsoDateTime(version.endAt);

  // images come back as [{ url, storage, sortOrder, _id }], not bare
  // strings — the form only tracks the url.
  const imageUrls = Array.isArray(version.images)
    ? version.images.map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean)
    : [];

  return {
    ...empty,
    voucherName: version.name || "",
    brandId: version.voucher?.brandId || version.brandId || "",
    description: version.description || "",
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    // NOTE: the confirmed versions/get-all response doesn't include
    // subBrandIds on either the version or its nested voucher — nothing to
    // prefill here yet. Add it once the backend returns it on read.
    selectedOutletIds: version.subBrandIds || version.voucher?.subBrandIds || [],
    searchTags: version.tags || [],
    isSaveAsDraft: version.status === "DRAFT",
    existingImageUrls: imageUrls,
    offers:
      Array.isArray(version.offers) && version.offers.length > 0
        ? version.offers.map((offer) => ({
          ...createEmptyOffer(),
          ...offer,
        }))
        : [createEmptyOffer()],
  };
}

function formToPayload(form) {
  const finalSubBrandIDs = Array.isArray(form.selectedOutletIds)
    ? form.selectedOutletIds
    : form.selectedOutletIds
      ? [form.selectedOutletIds]
      : [];

const FinalSearchTags = Array.isArray(form.searchTags)
  ? form.searchTags
  : form.searchTags
    ? [form.searchTags]
    : [];
  return {
    brandId: form.brandId,
    name: form.voucherName,
    description: form.description,
    tags: FinalSearchTags,
    startAt: toIsoDateTime(form.startDate, form.startTime),
    endAt: toIsoDateTime(form.endDate, form.endTime),
    subBrandIds: finalSubBrandIDs,
    isSaveAsDraft: form.isSaveAsDraft,
    offers: form.offers.map((offer, index) => ({
      title: offer.title,
      minBillAmount: Number(offer.minBillAmount) || 0,
      discountType: offer.discountType,
      discountValue: Number(offer.discountValue) || 0,
      maxDiscountAmount: Number(offer.maxDiscountAmount) || 0,
      usageType: offer.usageType,
      discountApplicableOn: offer.discountApplicableOn,
      sortOrder: index + 1,
      isActive: offer.isActive,
    })),
    images: form.images,
    existingImageUrls: form.existingImageUrls,
    bannerType: form.bannerType,
    bannerImage: form.bannerImage,
    bannerVideo: form.bannerVideo,
    bannerGif: form.bannerGif,
  };
}

// Builds the diff-style patch PUT /vouchers/update/:id expects (see
// VoucherService.js's updateVoucher/buildVoucherUpdateFormData for the
// confirmed newX/removedX contract) by comparing the current (edited) form
// against the ORIGINAL version fetched on mount. Edit-mode only —
// formToPayload/createVoucher above are completely untouched.
function formToUpdatePatch(form, originalVersion) {
  const originalTags = originalVersion?.tags || [];
  const currentTags = Array.isArray(form.searchTags) ? form.searchTags : [];
  const newTags = currentTags.filter((tag) => !originalTags.includes(tag));
  const removedTags = originalTags.filter((tag) => !currentTags.includes(tag));

  // Offers loaded from the API keep their real `_id` (voucherToForm spreads
  // the raw offer over createEmptyOffer()); offers added during this edit
  // session never get one — that's how "existing" vs. "new" is told apart.
  const currentOfferIds = form.offers.map((offer) => offer._id).filter(Boolean);
  const originalOfferIds = (originalVersion?.offers || []).map((offer) => offer._id).filter(Boolean);
  const removedOfferIds = originalOfferIds.filter((id) => !currentOfferIds.includes(id));
  const newOffers = form.offers
    .filter((offer) => !offer._id)
    .map((offer, index) => ({
      title: offer.title,
      minBillAmount: Number(offer.minBillAmount) || 0,
      discountType: offer.discountType,
      discountValue: Number(offer.discountValue) || 0,
      maxDiscountAmount: Number(offer.maxDiscountAmount) || 0,
      usageType: offer.usageType,
      discountApplicableOn: offer.discountApplicableOn,
      sortOrder: index + 1,
      isActive: offer.isActive,
    }));

  // form.existingImageUrls only tracks bare URLs (see voucherToForm), so a
  // removed image is found by url and mapped back to its subdocument _id
  // via the originally-fetched images array (which does carry `_id`).
  const originalImages = Array.isArray(originalVersion?.images) ? originalVersion.images : [];
  const urlToImageId = new Map(
    originalImages
      .filter((img) => img && typeof img === "object" && img.url)
      .map((img) => [img.url, img._id])
  );
  const removeImageIds = originalImages
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter((url) => url && !form.existingImageUrls.includes(url))
    .map((url) => urlToImageId.get(url))
    .filter(Boolean);

  // NOTE: the confirmed versions/get-all response doesn't return
  // subBrandIds on the version (see voucherToForm's note above), so there's
  // nothing real to diff against yet — every currently-selected outlet
  // comes through as "new" until the backend starts returning the
  // original list on read.
  const originalSubBrandIds = originalVersion?.subBrandIds || originalVersion?.voucher?.subBrandIds || [];
  const currentSubBrandIds = Array.isArray(form.selectedOutletIds) ? form.selectedOutletIds : [];
  const newSubBrandIds = currentSubBrandIds.filter((id) => !originalSubBrandIds.includes(id));
  const removeSubBrandIds = originalSubBrandIds.filter((id) => !currentSubBrandIds.includes(id));

  return {
    name: form.voucherName,
    description: form.description,
    startAt: toIsoDateTime(form.startDate, form.startTime),
    endAt: toIsoDateTime(form.endDate, form.endTime),
    newTags,
    removedTags,
    newOffers,
    removedOfferIds,
    newImages: form.images,
    removeImageIds,
    newSubBrandIds,
    removeSubBrandIds,
  };
}

export default function useVoucherForm(voucherId) {
  const navigate = useNavigate();
  const isEditMode = Boolean(voucherId) && voucherId !== "new";
  // brandId is never a visible form field — it's resolved from the
  // logged-in vendor's session and sent silently in the submit payload.
  // Prefer onboardingStore.formData.brandId: it's stamped the moment the
  // brand is created (Step2VerifyOTP / Step1 addBasicDetails) and persists
  // across reloads. authStore.user.brandId is only a fallback because
  // authStore.user is captured once at login/verify-OTP and is never
  // refetched afterwards — a vendor who completed onboarding in the same
  // session without logging out again would otherwise still read an empty
  // brandId off `user` and hit "Path brandId is required" on submit.
  const onboardingBrandId = useOnboardingStore((s) => s.formData.brandId);
  const authUserBrandId = useAuthStore((s) => s.user?.brandId);
  const candidateBrandId = onboardingBrandId || authUserBrandId;
  // Round-trips the candidate id through GET /brands/get — the same
  // useBrandData hook BrandPage.jsx uses — so we send the backend's own
  // confirmed brand._id rather than trusting whatever's cached locally.
  const { data: brand } = useBrandData(candidateBrandId);
  const sessionBrandId = brand?._id || candidateBrandId;

  const [form, setForm] = useState(createEmptyForm);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  // Snapshot of the version exactly as loaded — formToUpdatePatch diffs the
  // current (edited) form against this to build the newX/removedX patch.
  const originalVersionRef = useRef(null);

  useEffect(() => {
    if (!isEditMode) return;
    setIsLoading(true);
    getVoucherById(voucherId)
      .then((res) => {
        const version = res?.data?.data?.[0];
        if (!version) {
          setError("Voucher not found.");
          return;
        }
        originalVersionRef.current = version;
        setForm(voucherToForm(version));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [voucherId, isEditMode]);

  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setOutletField = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      applicableOutlets: { ...prev.applicableOutlets, [field]: value },
    }));
  }, []);

  // Called from VoucherOutletPickerModal's "Confirm & Submit". It hands
  // back { ids, subBrandCount, franchiseCount, totalAvailable } — computed
  // there since that's where the fetched outlets' types live.
  const setSelectedOutlets = useCallback((selection) => {
    const ids = Array.isArray(selection) ? selection : selection?.ids || [];
    setForm((prev) => ({
      ...prev,
      selectedOutletIds: ids,
      applicableOutlets: {
        ...prev.applicableOutlets,
        selectedBrandOutletCount: ids.length,
        totalOutletsCount: selection?.totalAvailable ?? prev.applicableOutlets.totalOutletsCount,
        subBrandCount: selection?.subBrandCount ?? 0,
        franchiseCount: selection?.franchiseCount ?? 0,
      },
    }));
  }, []);

  // ── Offers (repeatable) ─────────────────────────────────────
  const addOffer = useCallback(() => {
    setForm((prev) => ({ ...prev, offers: [...prev.offers, createEmptyOffer()] }));
  }, []);

  const removeOffer = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      offers: prev.offers.length > 1 ? prev.offers.filter((_, i) => i !== index) : prev.offers,
    }));
  }, []);

  const setOfferField = useCallback((index, field, value) => {
    setForm((prev) => ({
      ...prev,
      offers: prev.offers.map((offer, i) =>
        i === index ? { ...offer, [field]: value } : offer
      ),
    }));
  }, []);

  // ── Images ───────────────────────────────────────────────────
  // Max 5 images total (existing + newly picked); extra picks beyond the
  // limit are dropped with an inline error. At least MIN_IMAGES is required
  // to submit at all (enforced in submit() below).
  const MAX_IMAGES = 5;
  const MIN_IMAGES = 3;

  const addImages = useCallback((fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setForm((prev) => {
      const remaining = MAX_IMAGES - prev.existingImageUrls.length - prev.images.length;
      if (remaining <= 0) {
        setError(`You can upload a maximum of ${MAX_IMAGES} images.`);
        return prev;
      }
      if (files.length > remaining) {
        setError(`You can upload a maximum of ${MAX_IMAGES} images.`);
      }
      return { ...prev, images: [...prev.images, ...files.slice(0, remaining)] };
    });
  }, []);

  const removeImage = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }, []);

  // Only removes the url from the form's pending payload — if you need to
  // delete it from the backend immediately, also call
  // deleteVoucherImage(voucherId, imageId) from VoucherService.js.
  const removeExistingImage = useCallback((url) => {
    setForm((prev) => ({
      ...prev,
      existingImageUrls: prev.existingImageUrls.filter((u) => u !== url),
    }));
  }, []);

  // ── Search tags ──────────────────────────────────────────────
  const addTag = useCallback(() => {
    const value = tagInput.trim();
    if (!value) return;
    setForm((prev) =>
      prev.searchTags.includes(value)
        ? prev
        : { ...prev, searchTags: [...prev.searchTags, value] }
    );
    setTagInput("");
  }, [tagInput]);

  const removeTag = useCallback((tag) => {
    setForm((prev) => ({
      ...prev,
      searchTags: prev.searchTags.filter((t) => t !== tag),
    }));
  }, []);

  const handleTagKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  // ── Submit ───────────────────────────────────────────────────
  const submit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      if (form.existingImageUrls.length + form.images.length < MIN_IMAGES) {
        setError(`Please upload at least ${MIN_IMAGES} voucher images.`);
        return;
      }
      if (form.selectedOutletIds.length === 0) {
        setError("Please select at least one outlet or franchise this voucher applies to.");
        return;
      }
      const brandId = form.brandId || sessionBrandId;
      if (!brandId) {
        setError("No brand is linked to your account yet. Please complete onboarding first.");
        return;
      }
      setIsSubmitting(true);
      setUploadProgress(0);
      setError(null);
      try {
        const saved = isEditMode
          ? await updateVoucher(voucherId, formToUpdatePatch(form, originalVersionRef.current), setUploadProgress)
          : await createVoucher(formToPayload({ ...form, brandId }), setUploadProgress);
        const savedId = saved?.id ?? saved?._id ?? voucherId;
        setSuccessMessage(isEditMode ? "Voucher updated successfully!" : "Voucher created successfully!");
        // Brief pause so the success toast is actually visible before this
        // component unmounts on navigation.
        await new Promise((resolve) => setTimeout(resolve, 900));
        navigate(`/vouchers`);
        return saved;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, isEditMode, voucherId, navigate, sessionBrandId]
  );

  return {
    form,
    setField,
    setOutletField,
    setSelectedOutlets,
    addOffer,
    removeOffer,
    setOfferField,
    addImages,
    removeImage,
    removeExistingImage,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagKeyDown,
    isEditMode,
    isLoading,
    isSubmitting,
    uploadProgress,
    error,
    clearError: () => setError(null),
    successMessage,
    clearSuccessMessage: () => setSuccessMessage(""),
    submit,
  };
}