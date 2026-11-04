// Add / edit ONE outlet's working hours — real POST /workHours/upsert with
// the outlet's own id (subBrandId). Opened from the Working Hours card on
// the outlet details page. Reuses the onboarding WorkingHoursEditor so the
// "Same every day / Custom hours" editing is identical in both places.
// Deliberately does NOT close on a backdrop click — a half-edited week
// would otherwise be lost with one stray click.
import { Clock, X, Loader2 } from "lucide-react";
import WorkingHoursEditor from "@/features/oulet/New folder/components/brandOutlet/WorkingHoursEditor";
import ErrorToast from "@/components/common/ErrorToast";
import { useEditOutletWorkHours } from "../hooks/useEditOutletWorkHours";

export default function EditWorkHoursModal({ outlet, onClose, onUpdated }) {
  const { hours, setHours, isNew, canSave, submit, submitting, error, clearError } =
    useEditOutletWorkHours(outlet, () => onUpdated?.());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 px-6 py-4 sticky top-0 z-10 bg-white dark:bg-gray-800 rounded-t-2xl">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15">
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {isNew ? "Add Working Hours" : "Edit Working Hours"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Customers see these timings for this outlet.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5">
          <WorkingHoursEditor hours={hours} onChange={setHours} />
        </div>

        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 text-gray-600 dark:text-gray-300 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !canSave}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm tracking-wide shadow-sm shadow-emerald-100 hover:bg-emerald-600 transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-300 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Working Hours"
            )}
          </button>
        </div>
      </div>

      <ErrorToast error={error ? { message: error } : null} onDismiss={clearError} />
    </div>
  );
}
