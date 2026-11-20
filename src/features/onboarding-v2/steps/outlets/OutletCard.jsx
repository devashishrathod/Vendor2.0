import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock, KeyRound, Lock, MapPin, Pencil, RefreshCw, Store, Trash2, TriangleAlert } from "lucide-react";
import { getErrorCode, getErrorDetails, getErrorStatus } from "@/services/http/apiError";
import OutletLocationSearch from "@/features/oulet/New folder/components/brandOutlet/OutletLocationSearch";
import WorkingHoursEditor from "@/features/oulet/New folder/components/brandOutlet/WorkingHoursEditor";
import MapModal from "@/features/oulet/New folder/components/brandOutlet/modals/MapModal";
import OtpVerifyModal from "@/features/oulet/New folder/components/brandOutlet/modals/OtpVerifyModal";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import StatusPill from "../../components/ui/StatusPill";
import { TextField } from "../../components/ui/TextField";
import { ONBOARDING_ERROR_CODES } from "../../config/screens";
import {
  cancelOutlet,
  createOutletLocation,
  fixOutletNumber,
  getLocation,
  signUpOutlet,
  updateOutletLocation,
  upsertOutletHours,
  verifyOutletManagerOtp,
} from "../../services/brandSetupApi";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import {
  MOBILE_FORMAT,
  OUTLET_STATES,
  OUTLET_TYPES,
  gstAddressText,
  hoursFromServer,
  hoursPayload,
  hoursProblem,
  isOutletVerified,
  locationText,
  outletLocationFromPlace,
} from "./outletHelpers";

// The server doesn't hold back a quick resend — the card waits this long between codes.
const RESEND_COOLDOWN_SECONDS = 60;

const formatWhen = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

/** OTP / resend failures → what the vendor reads. */
function otpErrorMessage(error) {
  const status = getErrorStatus(error);
  const retry = getErrorDetails(error)?.retryAfterSeconds;
  if (status === 429) return retry ? `A code was sent recently. Ask again in ${retry} seconds.` : "Too many codes. Please wait a little.";
  if (status === 403 && !getErrorCode(error)) return "Too many wrong tries. Send a new code.";
  if (status === 401) return /expired|missing/i.test(error?.message ?? "") ? "That code has expired. Send a new one." : "That code is wrong. Check it and try again.";
  return onboardingErrorMessage(error, "That didn't work. Please try again.");
}

/** A part of the card that stays locked until the manager's number is verified. */
function Part({ icon: Icon, title, done, highlight, locked, children }) {
  return (
    <div
      className={`rounded-xl p-3.5 ring-1 ring-inset ${
        highlight ? "bg-red-50/60 ring-red-300 dark:bg-red-500/10 dark:ring-red-500/40" : "bg-gray-50 ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900 dark:text-gray-100">
          <Icon size={15} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          {title}
        </p>
        {locked ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
            <Lock size={11} aria-hidden="true" />
            After verification
          </span>
        ) : done ? (
          <StatusPill icon={Check}>Saved</StatusPill>
        ) : (
          <StatusPill tone="warning">Needed</StatusPill>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * One outlet on OUTLET_DETAILS (guide §4.13), in the server's order:
 * WhatsApp number → manager's code → location → work hours. Location and
 * hours stay locked until the number is verified (409 OUTLET_NOT_VERIFIED).
 * Resend = signUp-with-whatsapp again (#34); fix a mistyped number (#34a)
 * or cancel (#34b) only while never verified.
 * @param {{
 *   outlet: object, brandId: string, index: number,
 *   highlight?: { verify?: boolean, location?: boolean, hours?: boolean },
 *   gstAddress?: object|null, canChange: boolean,
 *   openCodeOnMount?: boolean,
 *   onChanged: () => Promise<unknown>|void,
 * }} props
 */
export default function OutletCard({ outlet, brandId, index, highlight = {}, gstAddress, canChange, openCodeOnMount = false, onChanged }) {
  const verified = isOutletVerified(outlet);
  const neverVerified = outlet.verificationState === OUTLET_STATES.NEVER_VERIFIED;
  const cardRef = useRef(null);
  const [message, setMessage] = useState("");

  // ── Manager's code ──
  const [otpOpen, setOtpOpen] = useState(openCodeOnMount && neverVerified);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);
  const [codeNote, setCodeNote] = useState("");
  // A code was just sent when the card opens on its entry (new outlet).
  const [cooldown, setCooldown] = useState(openCodeOnMount && neverVerified ? RESEND_COOLDOWN_SECONDS : 0);
  const [fixing, setFixing] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [fixBusy, setFixBusy] = useState(false);
  const [cancelAsk, setCancelAsk] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  // ── Location ──
  const [savedLocation, setSavedLocation] = useState(outlet.location ?? null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [useGst, setUseGst] = useState(false);
  const [locSaving, setLocSaving] = useState(false);
  const [mapPlace, setMapPlace] = useState(null);
  const hasLocation = Boolean(outlet.locationId || savedLocation);

  // ── Hours ──
  const [hours, setHours] = useState(() => hoursFromServer(outlet.workHours));
  const [hoursDirty, setHoursDirty] = useState(false);
  const [hoursSaving, setHoursSaving] = useState(false);
  const hasHours = Boolean(outlet.workHoursId || outlet.workHours);

  // The list row may carry only `locationId` — read the address to show it.
  useEffect(() => {
    if (savedLocation || !outlet.locationId) return undefined;
    let active = true;
    getLocation(outlet.locationId)
      .then((res) => active && setSavedLocation(res?.data ?? null))
      .catch((err) => console.error("Outlet location fetch failed:", err));
    return () => {
      active = false;
    };
  }, [outlet.locationId, savedLocation]);

  // Ticks the resend cooldown down once a second while it runs.
  const cooling = cooldown > 0;
  useEffect(() => {
    if (!cooling) return undefined;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooling]);

  // A highlighted card (continue said it's missing something) scrolls into view.
  const highlighted = Boolean(highlight.verify || highlight.location || highlight.hours);
  useEffect(() => {
    if (highlighted) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlighted]);

  const run = useCallback(async (setBusy, action, fallback) => {
    setBusy(true);
    setMessage("");
    try {
      await action();
      return true;
    } catch (err) {
      console.error("Outlet action failed:", err);
      if (getErrorCode(err) === ONBOARDING_ERROR_CODES.OUTLET_STATE_CHANGED) await onChanged();
      setMessage(onboardingErrorMessage(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  }, [onChanged]);

  const confirmOtp = async () => {
    if (!/^\d{6}$/.test(otp) || confirming) return;
    setConfirming(true);
    setOtpError("");
    try {
      await verifyOutletManagerOtp({ whatsappNumber: outlet.whatsappNumber, otp });
      setOtpOpen(false);
      setOtp("");
      await onChanged();
    } catch (err) {
      console.error("Outlet manager OTP failed:", err);
      setOtpError(otpErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  const resendCode = async () => {
    if (cooling || resending) return;
    setResending(true);
    setOtpError("");
    setMessage("");
    setCodeNote("");
    try {
      const res = await signUpOutlet({ brandId, whatsappNumber: outlet.whatsappNumber, outletType: outlet.outletType || OUTLET_TYPES.OUTLET });
      const data = res?.data ?? {};
      if (data.otpSent === false) {
        const text = data.otpError || "The code couldn't be sent. Try again shortly.";
        if (otpOpen) setOtpError(text);
        else setMessage(text);
      } else {
        setCodeNote(`A new code was sent to ${outlet.whatsappNumber}.`);
      }
      setCooldown(data.retryAfterSeconds || RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      console.error("Outlet code resend failed:", err);
      const text = otpErrorMessage(err);
      if (otpOpen) setOtpError(text);
      else setMessage(text);
      const retry = getErrorDetails(err)?.retryAfterSeconds;
      if (retry) setCooldown(retry);
    } finally {
      setResending(false);
    }
  };

  const saveNewNumber = async () => {
    if (!MOBILE_FORMAT.test(newNumber)) return setMessage("Enter a valid 10-digit WhatsApp number.");
    const ok = await run(setFixBusy, async () => {
      const res = await fixOutletNumber(outlet._id, newNumber);
      if (res?.data?.otpSent === false && res.data.otpError) setOtpError(res.data.otpError);
    }, "We couldn't change the number.");
    if (ok) {
      setFixing(false);
      setNewNumber("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      await onChanged();
      setOtpOpen(true);
    }
  };

  const confirmCancel = async () => {
    const ok = await run(setCancelBusy, () => cancelOutlet(outlet._id), "We couldn't cancel this outlet.");
    setCancelAsk(false);
    if (ok) await onChanged();
  };

  const saveLocation = async (place) => {
    setSelectedPlace(place);
    if (!place || place.source === "gst") return;
    const { payload, problem } = outletLocationFromPlace(place, outlet._id);
    if (problem) return setMessage(problem);
    const ok = await run(setLocSaving, async () => {
      const existingId = outlet.locationId || savedLocation?._id;
      const res = existingId ? await updateOutletLocation(existingId, payload) : await createOutletLocation(payload);
      setSavedLocation(res?.data ?? null);
    }, "We couldn't save this location.");
    if (ok) {
      setEditingLocation(false);
      setSelectedPlace(null);
      setUseGst(false);
      await onChanged();
    }
  };

  const toggleGst = (checked) => {
    setUseGst(checked);
    // A text prefill only — the vendor still picks the exact result from the list.
    setSelectedPlace(checked ? { source: "gst", name: "GST address", address: gstAddressText(gstAddress), lat: null, lng: null } : null);
  };

  const saveHours = async () => {
    const problem = hoursProblem(hours);
    if (problem) return setMessage(problem);
    const ok = await run(setHoursSaving, () => upsertOutletHours(outlet._id, hoursPayload(hours)), "We couldn't save the work hours.");
    if (ok) {
      setHoursDirty(false);
      await onChanged();
    }
  };

  // Under review: a saved location / hours can't change (409 ONBOARDING_LOCKED).
  const canEditLocation = verified && (!hasLocation || canChange);
  const canEditHours = verified && (!hasHours || canChange);
  const showSearch = canEditLocation && (!hasLocation || editingLocation);

  const title = `${outlet.outletType === OUTLET_TYPES.FRANCHISE ? "Franchise" : "Outlet"} ${index + 1}`;

  return (
    <article
      ref={cardRef}
      className={`flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-inset sm:p-5 dark:bg-gray-900 ${
        highlighted ? "ring-2 ring-red-400 dark:ring-red-500/60" : "ring-gray-200 dark:ring-gray-800"
      }`}
      aria-label={title}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Store size={17} aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manager WhatsApp {outlet.whatsappNumber}
              {outlet.uniqueId ? ` · ${outlet.uniqueId}` : ""}
            </p>
          </div>
        </div>
        {neverVerified ? (
          <StatusPill tone="warning">Waiting for the manager&apos;s code</StatusPill>
        ) : outlet.verificationState === OUTLET_STATES.REVERIFY ? (
          <StatusPill tone="warning">Number changed — manager must verify</StatusPill>
        ) : (
          <StatusPill icon={Check}>Verified</StatusPill>
        )}
      </header>

      {neverVerified && (
        <div
          className={`flex flex-col gap-3 rounded-xl p-3.5 ring-1 ring-inset ${
            highlight.verify ? "bg-red-50/60 ring-red-300 dark:bg-red-500/10 dark:ring-red-500/40" : "bg-amber-50/70 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30"
          }`}
        >
          <p className="text-[13px] text-amber-900 dark:text-amber-200">
            We sent a 6-digit code to the manager&apos;s WhatsApp. Enter it to verify this outlet.
            {formatWhen(outlet.holdExpiresAt) && (
              <span className="mt-1 flex items-center gap-1 text-xs font-semibold">
                <Clock size={12} aria-hidden="true" />
                Verify by {formatWhen(outlet.holdExpiresAt)}, or this outlet is cancelled automatically.
              </span>
            )}
          </p>
          {fixing ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <TextField
                  id={`fix-number-${outlet._id}`}
                  label="Correct WhatsApp number"
                  inputMode="numeric"
                  maxLength={10}
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setFixing(false)} disabled={fixBusy}>
                  Cancel
                </Button>
                <Button onClick={saveNewNumber} loading={fixBusy} disabled={!MOBILE_FORMAT.test(newNumber)}>
                  Save number
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setOtpOpen(true)} icon={KeyRound} iconPosition="start">
                Enter code
              </Button>
              <Button variant="secondary" onClick={resendCode} loading={resending} disabled={cooling} icon={RefreshCw} iconPosition="start">
                {cooling ? `Resend in ${cooldown}s` : "Resend code"}
              </Button>
              <Button variant="ghost" onClick={() => setFixing(true)} icon={Pencil} iconPosition="start">
                Fix number
              </Button>
              <Button variant="ghost" onClick={() => setCancelAsk(true)} icon={Trash2} iconPosition="start">
                Cancel outlet
              </Button>
            </div>
          )}
          {codeNote && (
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400" role="status">
              {codeNote}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Part icon={MapPin} title="Location" done={hasLocation} highlight={highlight.location} locked={!verified}>
          {!verified ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">Verify the outlet&apos;s WhatsApp number first.</p>
          ) : showSearch ? (
            <div className="flex flex-col gap-2">
              {gstAddress && (
                <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-[12.5px] font-medium text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={useGst} onChange={(e) => toggleGst(e.target.checked)} className="size-4 accent-emerald-600" />
                  GST address is the outlet address
                </label>
              )}
              <OutletLocationSearch
                selectedPlace={selectedPlace}
                onSelectPlace={saveLocation}
                onShowMap={(place) => setMapPlace(place)}
                onError={(text) => setMessage(text)}
              />
              {useGst && <p className="text-[11.5px] text-gray-500 dark:text-gray-400">Pick the matching result from the list to save it.</p>}
              {locSaving && <p className="text-xs text-gray-500">Saving location…</p>}
              {hasLocation && (
                <Button variant="ghost" onClick={() => setEditingLocation(false)}>
                  Keep the saved address
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] text-gray-700 dark:text-gray-300">{locationText(savedLocation) || "Address saved"}</p>
              {canEditLocation && (
                <Button variant="ghost" onClick={() => setEditingLocation(true)} icon={Pencil} iconPosition="start">
                  Change
                </Button>
              )}
            </div>
          )}
        </Part>

        <Part icon={Clock} title="Work hours" done={hasHours && !hoursDirty} highlight={highlight.hours} locked={!verified}>
          {!verified ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">Verify the outlet&apos;s WhatsApp number first.</p>
          ) : canEditHours ? (
            <div className="flex flex-col gap-2">
              <WorkingHoursEditor
                hours={hours}
                onChange={(next) => {
                  setHours(next);
                  setHoursDirty(true);
                }}
              />
              {(hoursDirty || !hasHours) && (
                <Button onClick={saveHours} loading={hoursSaving} className="self-end">
                  Save hours
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-600 dark:text-gray-400">Saved. Hours change after the review.</p>
          )}
        </Part>
      </div>

      {message && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          <TriangleAlert size={13} className="mt-px shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}

      {otpOpen && (
        <OtpVerifyModal
          phone={outlet.whatsappNumber}
          otpValue={otp}
          onOtpChange={(value) => {
            setOtp(value);
            setOtpError("");
          }}
          otpError={otpError}
          onConfirm={confirmOtp}
          onClose={() => setOtpOpen(false)}
          onResend={resendCode}
          resending={resending}
          confirming={confirming}
        />
      )}
      {cancelAsk && (
        <ConfirmDialog
          title="Cancel this outlet?"
          message="It is removed, its slot comes back to your plan and the number is free again."
          confirmLabel="Cancel outlet"
          cancelLabel="Keep it"
          busy={cancelBusy}
          onConfirm={confirmCancel}
          onCancel={() => setCancelAsk(false)}
        />
      )}
      {mapPlace && <MapModal place={mapPlace} onClose={() => setMapPlace(null)} />}
    </article>
  );
}
