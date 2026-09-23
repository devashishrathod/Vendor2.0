import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Custom dropdown select. Native <select>/<option> popups mostly ignore
 * CSS and render with OS colors, which breaks in dark mode — this renders
 * the open option list ourselves so it always matches the app theme.
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {Array<{value: string, label: string}>} props.options
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className] - classes applied to the trigger button (background/text colors, etc.)
 * @param {boolean} [props.compact] - smaller padding/text/icon, for tight spots (e.g. a card footer)
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className = "",
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = useCallback(
    (optionValue) => {
      onChange(optionValue);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          compact ? "px-2 py-1.5 text-[10px]" : "px-4 py-3 text-sm"
        } ${className}`}
      >
        <span className={`truncate ${selected ? "" : "text-gray-400 dark:text-gray-500"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 text-gray-400 transition-transform ${compact ? "w-3 h-3" : "w-4 h-4"} ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className={`absolute z-20 w-full rounded-xl bg-white dark:bg-gray-700 shadow-xl overflow-auto ${compact ? "mt-1 py-1 max-h-40" : "mt-1.5 py-1.5 max-h-60"}`}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center justify-between gap-2 text-left transition-colors ${
                  compact ? "px-2 py-1.5 text-[10px]" : "px-4 py-2.5 text-sm"
                } ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {option.label}
                {isSelected && <Check className={compact ? "w-3 h-3 shrink-0" : "w-4 h-4 shrink-0"} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
