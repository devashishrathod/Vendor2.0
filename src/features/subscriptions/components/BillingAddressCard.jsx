import { useCallback, useState } from "react";
import { Check, LoaderCircle, MapPin, Save } from "lucide-react";

const PIN_PATTERN = /^\d{6}$/;
const EMPTY_ADDRESS = { line1: "", line2: "", city: "", state: "", pin: "" };
const FIELDS = ["line1", "line2", "city", "state", "pin", "sameAsGst"];

const inputClass =
  "h-10 w-full rounded-lg border-0 bg-gray-100 px-3 text-base text-gray-900 outline-none ring-1 ring-inset ring-transparent transition placeholder:text-gray-400 focus:bg-white focus:ring-emerald-500/50 read-only:cursor-default read-only:bg-gray-50 read-only:text-gray-700 read-only:focus:ring-transparent sm:text-sm dark:bg-gray-700/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-700 dark:read-only:bg-gray-900/50 dark:read-only:text-gray-200";

const sameAddress = (a, b) => FIELDS.every((k) => (a?.[k] ?? "") === (b?.[k] ?? ""));

function Field({ id, label, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-semibold text-gray-600 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Billing Address — printed on every invoice. Always shown as a form. When
 * the vendor has a GST registration, "Same as my GST address" (inside the
 * form, on by default) fills the fields from it and locks them; unticking
 * clears them for a different address. Edits stay a draft until **Save**,
 * which hands the address to `onChange`.
 * @param {{
 *   value: { line1: string, line2: string, city: string, state: string, pin: string, sameAsGst: boolean },
 *   gstAddress: { line1: string, line2: string, city: string, state: string, pin: string }|null,
 *   onChange: (next: object) => void,
 *   isSaved?: boolean,   - an address has actually been saved before (not just the GST default)
 * }} props
 */
export default function BillingAddressCard({ value, gstAddress, onChange, isSaved = false }) {
  const [draft, setDraft] = useState(value);
  const [savedValue, setSavedValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // The saved address changed from outside (e.g. loaded later) → follow it,
  // unless the vendor is mid-edit.
  if (!sameAddress(value, savedValue)) {
    if (sameAddress(draft, savedValue)) setDraft(value);
    setSavedValue(value);
  }

  const locked = Boolean(gstAddress && draft.sameAsGst);
  // Unsaved = edited since the last save, or the pre-filled default was never saved.
  const dirty = !sameAddress(draft, savedValue) || (!isSaved && !justSaved);
  const pinInvalid = draft.pin && !PIN_PATTERN.test(draft.pin);
  const complete = Boolean(draft.line1.trim() && draft.city.trim() && draft.state.trim() && PIN_PATTERN.test(draft.pin));

  const toggleSameAsGst = (checked) => {
    setJustSaved(false);
    setDraft(checked ? { ...gstAddress, sameAsGst: true } : { ...EMPTY_ADDRESS, sameAsGst: false });
  };

  const setField = (key, raw) => {
    setJustSaved(false);
    const next = key === "pin" ? raw.replace(/\D/g, "").slice(0, 6) : raw;
    setDraft((d) => ({ ...d, [key]: next }));
  };

  const handleSave = useCallback(async () => {
    if (!complete) return;
    setSaving(true);
    try {
      await onChange(draft);
      setSavedValue(draft);
      setJustSaved(true);
    } finally {
      setSaving(false);
    }
  }, [complete, draft, onChange]);

  const input = (key, extra = {}) => (
    <input
      id={`billing-${key}`}
      type="text"
      value={draft[key] || ""}
      onChange={(e) => setField(key, e.target.value)}
      readOnly={locked}
      tabIndex={locked ? -1 : undefined}
      className={inputClass}
      {...extra}
    />
  );

  return (
    <section className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200/70 dark:bg-gray-800 dark:ring-gray-700">
      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-2 px-4 pb-1 pt-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <MapPin size={14} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Billing Address</h3>
          <p className="truncate text-[11.5px] text-gray-500 dark:text-gray-400">Printed on every invoice and statement</p>
        </div>
        {dirty ? (
          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            Not saved
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Check size={11} strokeWidth={3} aria-hidden="true" />
            Saved
          </span>
        )}
      </header>

      <form
        className="flex flex-col gap-3 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        noValidate
      >
        {gstAddress && (
          <label
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              draft.sameAsGst ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-gray-50 dark:bg-gray-900/40"
            }`}
          >
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-gray-800 dark:text-gray-100">Same as my GST address</span>
              <span className="block text-[11.5px] text-gray-500 dark:text-gray-400">
                {draft.sameAsGst ? "Filled from your GST registration — untick to use another address." : "Using a different address for invoices."}
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={draft.sameAsGst}
              onChange={(e) => toggleSameAsGst(e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/50 ${
                draft.sameAsGst ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left] ${draft.sameAsGst ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </label>
        )}

        <Field id="billing-line1" label="Address line 1" required>
          {input("line1", { placeholder: "Shop / building no., street", autoComplete: "address-line1" })}
        </Field>
        <Field id="billing-line2" label="Address line 2 / landmark">
          {input("line2", { placeholder: "Area, landmark (optional)", autoComplete: "address-line2" })}
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field id="billing-city" label="City" required>
            {input("city", { placeholder: "City", autoComplete: "address-level2" })}
          </Field>
          <Field id="billing-state" label="State" required>
            {input("state", { placeholder: "State", autoComplete: "address-level1" })}
          </Field>
          <Field id="billing-pin" label="PIN code" required error={pinInvalid ? "Enter 6 digits" : undefined}>
            {input("pin", {
              placeholder: "6 digits",
              inputMode: "numeric",
              maxLength: 6,
              autoComplete: "postal-code",
              "aria-invalid": pinInvalid ? true : undefined,
            })}
          </Field>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
            {justSaved
                ? "Address saved — it will be printed on your invoices."
                : dirty
                  ? "Save the address to use it on your invoices."
                  : "This address will be printed on your invoices."}
          </p>
          <button
            type="submit"
            disabled={!complete || saving}
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : justSaved && !dirty ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
            {saving ? "Saving…" : justSaved && !dirty ? "Saved" : "Save address"}
          </button>
        </div>
      </form>
    </section>
  );
}
