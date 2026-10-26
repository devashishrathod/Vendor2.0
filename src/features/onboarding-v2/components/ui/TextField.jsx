import { ChevronDown } from "lucide-react";

const FIELD_BASE =
  "h-12 w-full rounded-[10px] border bg-white px-3.5 text-base font-semibold text-gray-900 shadow-xs outline-none transition placeholder:font-medium placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600";

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

function FieldMessage({ error, counter }) {
  if (!error && !counter) return null;
  return (
    <div className="mt-1 flex justify-between gap-3 text-xs">
      {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
      {counter && <span className="ml-auto tabular-nums text-gray-500">{counter}</span>}
    </div>
  );
}

/**
 * Labelled text input. Text is 16px on phones so iOS doesn't zoom on focus.
 * @param {{
 *   id: string, label: string, required?: boolean, optional?: boolean,
 *   hint?: string, error?: string, counter?: string,
 *   rightSlot?: import('react').ReactNode, inputClassName?: string,
 * } & import('react').InputHTMLAttributes<HTMLInputElement>} props
 */
export function TextField({ id, label, required, optional, hint, error, counter, rightSlot, inputClassName = "", ...inputProps }) {
  return (
    <div>
      <FieldLabel id={id} label={label} required={required} optional={optional} hint={hint} />
      <div className="relative mt-1.5">
        <input
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          aria-invalid={error ? true : undefined}
          className={`${FIELD_BASE} ${error ? "border-red-400" : "border-gray-300 dark:border-gray-700"} ${rightSlot ? "pr-12" : ""} ${inputClassName}`}
          {...inputProps}
        />
        {rightSlot && <div className="absolute inset-y-0 right-1 flex items-center">{rightSlot}</div>}
      </div>
      <FieldMessage error={error} counter={counter} />
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
