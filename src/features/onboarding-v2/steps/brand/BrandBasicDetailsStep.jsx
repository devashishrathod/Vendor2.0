import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, LoaderCircle, Lock, Store } from "lucide-react";
import { getErrorCode, getErrorDetails } from "@/services/http/apiError";
import CustomerPreview from "../../components/brand/CustomerPreview";
import ImageUploadTile from "../../components/brand/ImageUploadTile";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextAreaField, TextField } from "../../components/ui/TextField";
import { ONBOARDING_ERROR_CODES } from "../../config/screens";
import { openStrengthItems } from "../../components/strength/strengthLevels";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { updateBrandProfile } from "../../services/brandSetupApi";
import { continueScreen } from "../../services/onboardingApi";
import { useSavedBrand, useSavedBrandStore } from "../../store/brandStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";

const LOGO_MAX_MB = 1.5;
const COVER_MAX_MB = 3;
const DESCRIPTION_MAX = 1000;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_FORMAT = /^[6-9]\d{9}$/;

// `continue` → 422 ONBOARDING_STEP_INCOMPLETE `missing` codes (API doc #23g).
const MISSING_MESSAGES = {
  LOGO: "Add your logo.",
  EMAIL: "Add your email.",
  MOBILE: "Add a contact number.",
};

// Profile items the server scores on this screen (guide §11) — shown as "+N".
const PROFILE_HINT_KEYS = ["LOGO", "COVER_IMAGE", "DESCRIPTION"];

/** Preview URL for a picked file, revoked when it changes or unmounts. */
function useFilePreview(file, fallbackUrl) {
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => objectUrl && URL.revokeObjectURL(objectUrl), [objectUrl]);
  return objectUrl ?? fallbackUrl ?? null;
}

/** A saved image the vendor may not change right now (under review: add only). */
function LockedImage({ url, label, wide }) {
  return (
    <div className={wide ? "min-w-0 flex-1" : "w-[120px] shrink-0"}>
      <div className={`relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 ${wide ? "h-[120px] w-full" : "size-[120px]"}`}>
        <img src={url} alt={label} className="h-full w-full object-cover" />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/45 py-1 text-[11px] font-semibold text-white">
          <Lock size={11} aria-hidden="true" />
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * The form, initialised once from the saved brand.
 * @param {{ brand: object }} props
 */
function BasicDetailsForm({ brand }) {
  const { status, isViewingPast, closeScreen, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const mergeBrand = useSavedBrandStore((s) => s.mergeBrand);
  const reloadBrand = useSavedBrandStore((s) => s.load);

  // Under review (`editable.profile.change: false`) only empty fields can be filled.
  const canChange = status?.editable?.profile?.change !== false;
  const locked = (value) => Boolean(value) && !canChange;

  const whatsappNumber = brand.whatsappNumber ?? "";
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [description, setDescription] = useState(brand.description ?? "");
  const [email, setEmail] = useState(brand.email ?? "");
  const [sameAsWhatsapp, setSameAsWhatsapp] = useState(Boolean(whatsappNumber && brand.mobile === whatsappNumber));
  const [mobile, setMobile] = useState(brand.mobile && brand.mobile !== whatsappNumber ? brand.mobile : "");
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [tried, setTried] = useState(false);
  const [serverMissing, setServerMissing] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const logoPreview = useFilePreview(logoFile, logoRemoved ? null : brand.logo);
  const coverPreview = useFilePreview(coverFile, coverRemoved ? null : brand.coverImage);

  const mobileValue = sameAsWhatsapp ? whatsappNumber : mobile;
  const fieldErrors = {
    logo: (tried && !logoPreview) || serverMissing.includes("LOGO") ? MISSING_MESSAGES.LOGO : "",
    email:
      tried && !EMAIL_FORMAT.test(email.trim())
        ? email.trim()
          ? "Enter a valid email address."
          : MISSING_MESSAGES.EMAIL
        : serverMissing.includes("EMAIL")
          ? MISSING_MESSAGES.EMAIL
          : "",
    mobile:
      tried && !MOBILE_FORMAT.test(mobileValue)
        ? mobileValue
          ? "Enter a valid 10-digit mobile number."
          : MISSING_MESSAGES.MOBILE
        : serverMissing.includes("MOBILE")
          ? MISSING_MESSAGES.MOBILE
          : "",
  };
  const formValid = Boolean(logoPreview) && EMAIL_FORMAT.test(email.trim()) && MOBILE_FORMAT.test(mobileValue);

  const hints = openStrengthItems(status?.profileStrength).filter((item) => PROFILE_HINT_KEYS.includes(item.key));

  const pickLogo = useCallback((file) => {
    setLogoFile(file);
    setLogoRemoved(!file);
    setServerMissing((m) => m.filter((c) => c !== "LOGO"));
  }, []);
  const pickCover = useCallback((file) => {
    setCoverFile(file);
    setCoverRemoved(!file);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setTried(true);
      if (!formValid || saving) return;
      setSaving(true);
      setError("");
      setServerMissing([]);
      try {
        // Only what changed. Clearing a saved description isn't sent (the
        // server keeps the old one); a logo can be replaced, not removed.
        const changes = {};
        const nextDescription = description.trim();
        if (nextDescription && nextDescription !== (brand.description ?? "")) changes.description = nextDescription;
        if (email.trim() !== (brand.email ?? "")) changes.email = email.trim();
        if (sameAsWhatsapp) {
          if (brand.mobile !== whatsappNumber) changes.useWhatsappAsMobile = true;
        } else if (mobile !== (brand.mobile ?? "")) {
          changes.mobile = mobile;
        }
        if (Object.keys(changes).length > 0 || logoFile || coverFile) {
          const res = await updateBrandProfile(changes, { logo: logoFile, coverImage: coverFile });
          mergeBrand(res?.data);
          reloadBrand({ force: true }).catch((err) => console.error("Brand refresh failed:", err));
        }
        if (isViewingPast) {
          closeScreen();
          return;
        }
        const next = await continueScreen();
        goToServerScreen(next?.data?.currentScreen);
      } catch (err) {
        if (handleFlowError(err)) return;
        console.error("Saving brand details failed:", err);
        const code = getErrorCode(err);
        if (code === ONBOARDING_ERROR_CODES.STEP_INCOMPLETE) {
          setServerMissing(getErrorDetails(err)?.missing ?? []);
          setError("Fill in the highlighted fields to continue.");
        } else {
          if (code === ONBOARDING_ERROR_CODES.OWNER_NUMBER_NOT_VERIFIED) setSameAsWhatsapp(false);
          setError(onboardingErrorMessage(err, "We couldn't save your brand details. Please try again."));
        }
      } finally {
        setSaving(false);
      }
    },
    [
      brand.description,
      brand.email,
      brand.mobile,
      closeScreen,
      coverFile,
      description,
      email,
      formValid,
      goToServerScreen,
      handleFlowError,
      isViewingPast,
      logoFile,
      mergeBrand,
      mobile,
      reloadBrand,
      sameAsWhatsapp,
      saving,
      whatsappNumber,
    ],
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepCard
        icon={Store}
        title="Your brand details"
        subtitle="How customers see your brand. Logo, email and a contact number are needed to continue."
        aside={
          <div className="flex flex-col gap-3">
            <CustomerPreview
              coverUrl={coverPreview}
              logoUrl={logoPreview}
              brandName={brand.brandName}
              categoryName={brand.category?.name}
              subCategoryName={brand.subCategories?.[0]?.name ?? brand.subCategory?.name}
              description={description}
            />
            {hints.length > 0 && (
              <div className="rounded-xl bg-white/70 px-3.5 py-3 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/60 dark:ring-gray-700">
                <p className="text-[12px] font-bold text-gray-800 dark:text-gray-200">Make your profile stronger</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {hints.map((item) => (
                    <li key={item.key} className="flex items-center justify-between gap-2 text-[12px] text-gray-600 dark:text-gray-400">
                      <span>{item.label}</span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">+{item.points}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        }
        footer={
          <StepFooter start={<FormError message={error} />}>
            <Button type="submit" loading={saving} icon={ArrowRight}>
              {saving ? "Saving…" : isViewingPast ? "Save" : "Continue"}
            </Button>
          </StepFooter>
        }
      >
        {!canChange && (
          <p className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:ring-gray-700">
            <Lock size={12} aria-hidden="true" />
            Your profile is under review — you can fill empty fields; saved ones change after the review.
          </p>
        )}

        <div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {locked(brand.logo) ? (
              <LockedImage url={brand.logo} label="Logo" />
            ) : (
              <ImageUploadTile label="Logo" hint="Square, at least 500 × 500" previewUrl={logoPreview} maxSizeMb={LOGO_MAX_MB} onSelect={pickLogo} />
            )}
            {locked(brand.coverImage) ? (
              <LockedImage url={brand.coverImage} label="Cover" wide />
            ) : (
              <ImageUploadTile
                label="Cover image"
                hint="Wide · 1200 × 400 recommended (optional)"
                shape="wide"
                previewUrl={coverPreview}
                maxSizeMb={COVER_MAX_MB}
                onSelect={pickCover}
              />
            )}
          </div>
          {fieldErrors.logo && (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.logo}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="brand-name"
            label="Brand name"
            value={brand.brandName ?? ""}
            disabled
            helper="Set in Basic Details"
            rightSlot={
              <span className="grid size-10 place-items-center text-gray-400" aria-hidden="true">
                <Lock size={15} />
              </span>
            }
          />
          <TextField
            id="brand-email"
            label="Email"
            required
            type="email"
            autoComplete="email"
            placeholder="hello@yourbrand.com"
            value={email}
            disabled={locked(brand.email)}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email || undefined}
          />
        </div>

        <div className="flex flex-col gap-2">
          <TextField
            id="brand-mobile"
            label="Contact number"
            required
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            maxLength={10}
            value={mobileValue}
            disabled={sameAsWhatsapp || locked(brand.mobile)}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            error={fieldErrors.mobile || undefined}
          />
          {whatsappNumber && !locked(brand.mobile) && (
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 self-start text-[13px] font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={sameAsWhatsapp}
                onChange={(e) => setSameAsWhatsapp(e.target.checked)}
                className="size-4 rounded border-gray-300 accent-emerald-600"
              />
              Same as my WhatsApp number ({whatsappNumber})
            </label>
          )}
        </div>

        <TextAreaField
          id="brand-description"
          label="Description"
          optional
          hint="50+ characters help customers find you."
          placeholder="e.g. A cosy neighbourhood café known for its wood-fired pizzas and weekend live music."
          maxLength={DESCRIPTION_MAX}
          value={description}
          disabled={locked(brand.description)}
          onChange={(e) => setDescription(e.target.value)}
          counter={`${description.trim().length} / ${DESCRIPTION_MAX}`}
        />
      </StepCard>
    </form>
  );
}

/**
 * BRAND_BASIC_DETAILS (guide §4.12): logo, cover, description, email and
 * contact number (or "Same as my WhatsApp number" → `useWhatsappAsMobile`),
 * saved with PUT /brands/update, then POST continue. `continue` answering
 * 422 with `missing` LOGO / EMAIL / MOBILE highlights that field. The brand
 * name is read-only here. Opened from Back / the review page, it only saves.
 */
export default function BrandBasicDetailsStep() {
  const { brand, error } = useSavedBrand();

  if (!brand) {
    return (
      <StepCard icon={Store} title="Your brand details">
        {error ? (
          <FormError message={onboardingErrorMessage(error, "We couldn't load your brand.")} />
        ) : (
          <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" role="status">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            Loading your brand…
          </p>
        )}
      </StepCard>
    );
  }
  return <BasicDetailsForm key={brand._id} brand={brand} />;
}
