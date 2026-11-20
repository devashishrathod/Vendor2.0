import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock, Lock, MapPin, Pencil, Store, TriangleAlert } from "lucide-react";
import { getErrorCode } from "@/services/http/apiError";
import OutletLocationSearch from "@/features/outlets/setup/components/brandOutlet/OutletLocationSearch";
import WorkingHoursEditor from "@/features/outlets/setup/components/brandOutlet/WorkingHoursEditor";
import MapModal from "@/features/outlets/setup/components/brandOutlet/modals/MapModal";
import Button from "../../components/ui/Button";
import StatusPill from "../../components/ui/StatusPill";
import { ONBOARDING_ERROR_CODES } from "../../config/screens";
import { createOutletLocation, getLocation, updateOutletLocation, upsertOutletHours } from "../../services/brandSetupApi";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import {
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
import OutletVerifyPanel from "./OutletVerifyPanel";

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

      <OutletVerifyPanel outlet={outlet} brandId={brandId} highlight={Boolean(highlight.verify)} openCodeOnMount={openCodeOnMount} onChanged={onChanged} />

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

      {mapPlace && <MapModal place={mapPlace} onClose={() => setMapPlace(null)} />}
    </article>
  );
}
