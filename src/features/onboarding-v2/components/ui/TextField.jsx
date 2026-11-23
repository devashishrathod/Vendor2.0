import { ChevronDown, CircleCheck } from "lucide-react";

// `disabled:bg-gray-50` outranks `dark:bg-gray-950` (the :disabled
// pseudo-class adds specificity, the dark variant adds none), so a disabled
// field needs its own dark colours or it shows up white in dark mode.
const FIELD_BASE =
  "h-12 w-full rounded-[10px] border bg-white px-3.5 text-base font-semibold text-gray-900 shadow-xs outline-none transition placeholder:font-medium placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:disabled:border-gray-800 dark:disabled:bg-gray-900 dark:disabled:text-gray-400";

/** Label + hint shared by TextField and SelectField. */
function FieldLabel({ id, label, required, optional, hint }) {
  return (
    <>
      <label htmlFor={id} className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {optional && <span className="font-normal text-gray-500"> (optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </>
  );
}

function FieldMessage({ id, error, success, helper, counter, valid }) {
  if (!error && !success && !helper && !counter) return null;
  return (
    <div className="mt-1 flex justify-between gap-3 text-xs">
      {error ? (
        <span id={`${id}-error`} className="text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : success ? (
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">{success}</span>
      ) : (
        helper && (
          <span id={`${id}-helper`} className="text-gray-500 dark:text-gray-400">
            {helper}
          </span>
        )
      )}
      {counter && (
        <span className={`ml-auto tabular-nums ${valid ? "font-bold text-emerald-700 dark:text-emerald-400" : "text-gray-500"}`}>
          {counter}
        </span>
      )}
    </div>
  );
}

/**
 * Labelled text input. Text is 16px on phones so iOS doesn't zoom on focus.
 * `valid` turns the border and counter green and shows a check inside the
 * field (unless `rightSlot` is given); `success` is a green helper line.
 * `hint` sits between label and input; `helper` is a gray line under the
 * input — use it for fields placed side by side, so their inputs stay level.
 * @param {{
 *   id: string, label: string, required?: boolean, optional?: boolean,
 *   hint?: string, helper?: string, error?: string, success?: string, counter?: string,
 *   valid?: boolean, rightSlot?: import('react').ReactNode, inputClassName?: string,
 * } & import('react').InputHTMLAttributes<HTMLInputElement>} props
 */
export function TextField({
  id,
  label,
  required,
  optional,
  hint,
  helper,
  error,
  success,
  counter,
  valid = false,
  rightSlot,
  inputClassName = "",
  ...inputProps
}) {
  const showValid = valid && !error;
  const slot =
    rightSlot ??
    (showValid ? (
      <span className="grid size-10 place-items-center text-emerald-500" aria-hidden="true">
        <CircleCheck size={20} strokeWidth={2.2} />
      </span>
    ) : null);
  const showHelper = Boolean(helper) && !error && !success;
  const describedBy = [hint && `${id}-hint`, showHelper && `${id}-helper`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const border = error
    ? "border-red-400"
    : showValid
      ? "border-emerald-500 ring-4 ring-emerald-500/15"
      : "border-gray-300 dark:border-gray-700";

  return (
    <div>
      <FieldLabel id={id} label={label} required={required} optional={optional} hint={hint} />
      <div className="relative mt-1.5">
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`${FIELD_BASE} ${border} ${slot ? "pr-12" : ""} ${inputClassName}`}
          {...inputProps}
        />
        {slot && <div className="absolute inset-y-0 right-1 flex items-center">{slot}</div>}
      </div>
      <FieldMessage id={id} error={error} success={success} helper={helper} counter={counter} valid={showValid} />
    </div>
  );
}

/**
 * Labelled multi-line text (e.g. the brand description).
 * @param {{
 *   id: string, label: string, required?: boolean, optional?: boolean,
 *   hint?: string, error?: string, counter?: string,
 * } & import('react').TextareaHTMLAttributes<HTMLTextAreaElement>} props
 */
export function TextAreaField({ id, label, required, optional, hint, error, counter, rows = 4, ...textareaProps }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <FieldLabel id={id} label={label} required={required} optional={optional} hint={hint} />
      <textarea
        id={id}
        rows={rows}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`${FIELD_BASE} mt-1.5 h-auto resize-y py-3 leading-relaxed ${error ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}
        {...textareaProps}
      />
      <FieldMessage id={id} error={error} counter={counter} />
    </div>
  );
}

/**
 * Labelled native select (native for mobile pickers and keyboard access).
 * @param {{
 *   id: string, label: string, required?: boolean, hint?: string,
 *   placeholder?: string, options: { value: string, label: string }[],
 * } & import('react').SelectHTMLAttributes<HTMLSelectElement>} props
 */
export function SelectField({ id, label, required, hint, placeholder, options, ...selectProps }) {
  return (
    <div>
      <FieldLabel id={id} label={label} required={required} hint={hint} />
      <div className="relative mt-1.5">
        <select
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${FIELD_BASE} cursor-pointer appearance-none border-gray-300 pr-10 dark:border-gray-700`}
          {...selectProps}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
