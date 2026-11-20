import { useEffect, useState } from "react";
import { Clock, KeyRound, Pencil, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { getErrorCode, getErrorDetails, getErrorStatus } from "@/services/http/apiError";
import OtpVerifyModal from "@/features/oulet/New folder/components/brandOutlet/modals/OtpVerifyModal";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { TextField } from "../../components/ui/TextField";
import { ONBOARDING_ERROR_CODES } from "../../config/screens";
import { cancelOutlet, fixOutletNumber, signUpOutlet, verifyOutletManagerOtp } from "../../services/brandSetupApi";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { MOBILE_FORMAT, OUTLET_STATES, OUTLET_TYPES } from "./outletHelpers";

const formatWhen = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

/** OTP / resend failures → what the vendor reads. */
function otpErrorMessage(error) {
  const status = getErrorStatus(error);
  const retry = getErrorDetails(error)?.retryAfterSeconds;
  if (status === 429) return retry ? "A code was sent recently — you can ask for a new one when the timer ends." : "Too many codes. Please wait a little.";
  if (status === 403 && !getErrorCode(error)) return "Too many wrong tries. Send a new code.";
  if (status === 401) return /expired|missing/i.test(error?.message ?? "") ? "That code has expired. Send a new one." : "That code is wrong. Check it and try again.";
  return onboardingErrorMessage(error, "That didn't work. Please try again.");
}

/**
 * An outlet whose manager hasn't verified (guide §4.13, API doc #34–#34b):
 * NEVER_VERIFIED → enter the code, resend (signUp-with-whatsapp again),
 * fix a mistyped number, or cancel (slot comes back), with the hold timer;
 * REVERIFY (admin changed the number) → enter the code or resend. The
 * resend countdown comes only from a 429's `details.retryAfterSeconds`.
 * Renders nothing for a verified outlet.
 * @param {{
 *   outlet: object, brandId: string,
 *   highlight?: boolean, openCodeOnMount?: boolean,
 *   onChanged: () => Promise<unknown>|void,
 * }} props
 */
export default function OutletVerifyPanel({ outlet, brandId, highlight = false, openCodeOnMount = false, onChanged }) {
  const neverVerified = outlet.verificationState === OUTLET_STATES.NEVER_VERIFIED;
  const reverify = outlet.verificationState === OUTLET_STATES.REVERIFY;
  const [message, setMessage] = useState("");
  const [otpOpen, setOtpOpen] = useState(openCodeOnMount && (neverVerified || reverify));
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);
  const [codeNote, setCodeNote] = useState("");
  // Seconds until the server allows another code — only ever from a 429's
  // `details.retryAfterSeconds` (the server enforces 60 s / 5 an hour).
  const [cooldown, setCooldown] = useState(0);
  const [fixing, setFixing] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [fixBusy, setFixBusy] = useState(false);
  const [cancelAsk, setCancelAsk] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  // Ticks the resend cooldown down once a second while it runs.
  const cooling = cooldown > 0;
  useEffect(() => {
    if (!cooling) return undefined;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooling]);

  if (!neverVerified && !reverify) return null;

  const run = async (setBusy, action, fallback) => {
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
  };

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
      if (data.retryAfterSeconds) setCooldown(data.retryAfterSeconds);
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
      if (res?.data?.retryAfterSeconds) setCooldown(res.data.retryAfterSeconds);
    }, "We couldn't change the number.");
    if (ok) {
      setFixing(false);
      setNewNumber("");
      await onChanged();
      setOtpOpen(true);
    }
  };

  const confirmCancel = async () => {
    const ok = await run(setCancelBusy, () => cancelOutlet(outlet._id), "We couldn't cancel this outlet.");
    setCancelAsk(false);
    if (ok) await onChanged();
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl p-3.5 ring-1 ring-inset ${
        highlight ? "bg-red-50/60 ring-red-300 dark:bg-red-500/10 dark:ring-red-500/40" : "bg-amber-50/70 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30"
      }`}
    >
      <p className="text-[13px] text-amber-900 dark:text-amber-200">
        {reverify
          ? "The manager's WhatsApp number changed. Customers don't see this outlet until the manager enters the code we send."
          : "We sent a 6-digit code to the manager's WhatsApp. Enter it to verify this outlet."}
        {neverVerified && formatWhen(outlet.holdExpiresAt) && (
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
          {neverVerified && (
            <>
              <Button variant="ghost" onClick={() => setFixing(true)} icon={Pencil} iconPosition="start">
                Fix number
              </Button>
              <Button variant="ghost" onClick={() => setCancelAsk(true)} icon={Trash2} iconPosition="start">
                Cancel outlet
              </Button>
            </>
          )}
        </div>
      )}
      {codeNote && (
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400" role="status">
          {codeNote}
        </p>
      )}
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
          waitSeconds={cooldown}
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
    </div>
  );
}
