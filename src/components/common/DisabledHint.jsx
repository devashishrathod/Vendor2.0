import { useState } from "react";

/**
 * Wraps a button that can be disabled and explains WHY: while `show` is
 * true, hovering the wrapper shows `message` in a small tooltip, and
 * clicking it pins the tooltip open.
 *
 * Disabled buttons swallow mouse events, so the wrapped button must ignore
 * pointer events while disabled — add `disabled:pointer-events-none` to its
 * className — letting the wrapper receive the hover/click instead.
 *
 * @param {{ show: boolean, message: string, className?: string, children: import("react").ReactNode }} props
 */
export default function DisabledHint({ show, message, className = "", children }) {
  const [pinned, setPinned] = useState(false);

  return (
    <div
      className={`group/hint relative inline-flex ${show ? "cursor-not-allowed" : ""} ${className}`}
      onClick={() => show && setPinned(true)}
      onMouseLeave={() => setPinned(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg transition-opacity duration-150 group-hover/hint:opacity-100 dark:bg-gray-100 dark:text-gray-900 ${
            pinned ? "opacity-100" : "opacity-0"
          }`}
        >
          {message}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
        </span>
      )}
    </div>
  );
}
