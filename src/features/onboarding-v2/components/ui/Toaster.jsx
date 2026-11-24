import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

const TONES = {
  error: {
    icon: CircleAlert,
    box: "bg-white ring-red-200 dark:bg-gray-900 dark:ring-red-500/40",
    bar: "bg-red-500",
    iconClass: "text-red-600 dark:text-red-400",
    title: "Something went wrong",
  },
  success: {
    icon: CircleCheck,
    box: "bg-white ring-emerald-200 dark:bg-gray-900 dark:ring-emerald-500/40",
    bar: "bg-emerald-500",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    title: "Done",
  },
  info: {
    icon: Info,
    box: "bg-white ring-sky-200 dark:bg-gray-900 dark:ring-sky-500/40",
    bar: "bg-sky-500",
    iconClass: "text-sky-600 dark:text-sky-400",
    title: "Note",
  },
};

/**
 * Toast stack — top-right on desktop (under the header), full width on
 * phones. Mounted once in OnboardingShell.
 */
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-4 top-[72px] z-[60] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:w-[360px]"
    >
      {toasts.map((toast) => {
        const tone = TONES[toast.tone] ?? TONES.error;
        const Icon = tone.icon;
        return (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto relative flex animate-fade-in items-start gap-3 overflow-hidden rounded-xl py-3 pl-4 pr-2 shadow-[0_12px_32px_-12px_rgba(16,24,40,0.3)] ring-1 ${tone.box}`}
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} aria-hidden="true" />
            <Icon size={18} className={`mt-0.5 shrink-0 ${tone.iconClass}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{tone.title}</p>
              <p className="mt-0.5 break-words text-[12.5px] leading-snug text-gray-600 dark:text-gray-300">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
