import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

/**
 * Custom dropdown select. Native <select>/<option> popups mostly ignore
 * CSS and render with OS colors, which breaks in dark mode — this renders
 * the open option list ourselves so it always matches the app theme.
 *
 * ⚠️ FIXED: the open option list used to be a plain `position: absolute`
 * child of the trigger. Several onboarding steps wrap their sections in a
 * `.step-in` entrance animation, and ANY element with a `transform` (even
 * one that's already settled, like that animation's final `scale(1)`)
 * creates a new CSS stacking context — that trapped the dropdown's
 * z-index inside its own section, so a later sibling section with its own
 * `.step-in` context painted over it (confirmed on Step11BankEnter.jsx's
 * Account Type dropdown). Rendering the list through a portal into
 * document.body, positioned from the trigger's own bounding rect, escapes
 * that entirely — this fixes every place this component is used, not
 * just that one screen.
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
  const [menuRect, setMenuRect] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuRect({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (
        !triggerRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    // Closing on scroll/resize (rather than continuously repositioning)
    // keeps this simple and avoids the menu drifting out of sync with its
    // trigger. `true` (capture) is needed because the actual scrolling
    // element is often an inner pane (e.g. the onboarding content area),
    // not the window — scroll doesn't bubble, so only capture catches it.
    // ⚠️ FIXED: that same capture-phase listener also caught scrolling
    // *inside the option list itself* (its own `overflow-auto`) and
    // closed the menu the instant you tried to scroll through a longer
    // list of options — skip closing when the scroll happened inside the
    // menu.
    function handleScrollOrResize(e) {
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
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
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
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

      {open && menuRect && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuRect.top, left: menuRect.left, width: menuRect.width }}
          className={`z-50 rounded-xl bg-white dark:bg-gray-700 shadow-xl overflow-auto no-scrollbar ${compact ? "py-1 max-h-40" : "py-1.5 max-h-60"}`}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
}
