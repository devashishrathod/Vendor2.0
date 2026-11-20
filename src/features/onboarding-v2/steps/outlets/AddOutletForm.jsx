import { useState } from "react";
import { Plus } from "lucide-react";
import { getErrorCode } from "@/services/http/apiError";
import Button from "../../components/ui/Button";
import { SelectField, TextField } from "../../components/ui/TextField";
import { ONBOARDING_ERROR_CODES } from "../../config/screens";
import { signUpOutlet } from "../../services/brandSetupApi";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { MOBILE_FORMAT, OUTLET_TYPE_LABELS as TYPE_LABELS } from "./outletHelpers";

/**
 * The add-outlet form: outlet type (only the plan's pools that have room)
 * and the manager's WhatsApp number, or "Same as brand WhatsApp number"
 * (`useOwnerNumber` — verified straight away, no code).
 */
export default function AddOutletForm({ brandId, ownerNumber, isFirst, types, onAdded, onCancel }) {
  const [outletType, setOutletType] = useState(types[0]);
  const [number, setNumber] = useState("");
  const [useOwner, setUseOwner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const valid = useOwner || MOBILE_FORMAT.test(number);

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await signUpOutlet({ brandId, outletType, isFirstOutlet: isFirst, ...(useOwner ? { useOwnerNumber: true } : { whatsappNumber: number }) });
      onAdded(res?.data);
    } catch (err) {
      console.error("Adding an outlet failed:", err);
      if (getErrorCode(err) === ONBOARDING_ERROR_CODES.OWNER_NUMBER_NOT_VERIFIED) setUseOwner(false);
      // 403 limit / plan / number already registered — the server's message says which.
      setError(onboardingErrorMessage(err, "We couldn't add this outlet. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-[1.5px] ring-inset ring-emerald-200 sm:p-5 dark:bg-gray-900 dark:ring-emerald-500/30">
      <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">{isFirst ? "Add your first outlet" : "Add another outlet"}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {types.length > 1 ? (
          <SelectField
            id="new-outlet-type"
            label="Outlet type"
            required
            options={types.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
            value={outletType}
            onChange={(e) => setOutletType(e.target.value)}
          />
        ) : (
          <TextField id="new-outlet-type" label="Outlet type" value={TYPE_LABELS[types[0]]} disabled />
        )}
        <TextField
          id="new-outlet-number"
          label="Manager's WhatsApp number"
          required
          inputMode="numeric"
          maxLength={10}
          placeholder="98765 43210"
          hint="The manager gets a code on WhatsApp to verify the outlet."
          value={useOwner ? ownerNumber : number}
          disabled={useOwner}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
      </div>
      {ownerNumber && (
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 self-start text-[13px] font-medium text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={useOwner} onChange={(e) => setUseOwner(e.target.checked)} className="size-4 accent-emerald-600" />
          Same as brand WhatsApp number ({ownerNumber}) — no code needed
        </label>
      )}
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button onClick={submit} disabled={!valid} loading={saving} icon={Plus} iconPosition="start">
          {useOwner ? "Add outlet" : "Add & send code"}
        </Button>
      </div>
    </div>
  );
}

