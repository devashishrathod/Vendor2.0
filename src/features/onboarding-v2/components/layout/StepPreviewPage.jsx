import { useState } from "react";
import { ArrowLeft, Check, Eye, Lock, Pencil } from "lucide-react";

const EDIT_BUTTON =
  "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-gray-300 bg-white px-3 text-xs font-bold text-emerald-700 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-gray-600 dark:bg-gray-900 dark:text-emerald-400 dark:hover:bg-emerald-500/10";

function PreviewSection({ section, index, editing, wide, canEdit, onStartEdit, renderEditor, onDone }) {
  // A one-field section (brand name, business status…) shows its value right
  // under the title — no extra label repeating it.
  const single = section.rows.length === 1 && !section.note;

  return (
    <div
      className={`flex h-full flex-col rounded-[14px] border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:bg-gray-900 ${
        editing ? "border-emerald-300 ring-4 ring-emerald-500/10 dark:border-emerald-500/40" : "border-[#E4E9E2] dark:border-gray-700"
      }`}
    >
      {/* Header: step number + title, edit button */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
          <Check size={13} strokeWidth={3} aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-gray-700 dark:text-gray-200">
          <span className="mr-1 text-gray-400">{index + 1}.</span>
          {section.title}
        </p>
        {!editing &&
          (canEdit ? (
            <button type="button" onClick={onStartEdit} aria-label={`Edit ${section.title}`} title={`Edit ${section.title}`} className={EDIT_BUTTON}>
              <Pencil size={13} aria-hidden="true" />
              Edit
            </button>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10.5px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <Lock size={11} aria-hidden="true" />
              Locked
            </span>
          ))}
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-3">
        {editing ? (
          renderEditor(onDone)
        ) : (
          <>
            {section.note && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                {section.note}
              </p>
            )}
            {single ? (
              <p className="break-words text-[15px] font-bold text-gray-900 dark:text-gray-100">{section.rows[0].value || "—"}</p>
            ) : (
              section.rows.length > 0 && (
                <dl className={`grid grid-cols-1 gap-x-6 gap-y-2.5 ${wide ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
                  {section.rows.map((row) => (
                    <div key={row.label} className={`min-w-0 ${row.wide && wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
                      <dt className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{row.label}</dt>
                      <dd className="mt-0.5 break-words text-[13px] font-bold text-gray-900 dark:text-gray-100">{row.value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Review page for a completed main step (e.g. Basic Details), shown in
 * place of the current step card when the vendor clicks the step's eye icon
 * in the sidebar. Sections sit in a grid; Edit changes a section right here
 * when it has an inline editor (`inlineEditors[screenId]`), otherwise it
 * opens that step's screen (`onEdit`) and Continue returns here. Editing is
 * locked once the partner contract is accepted.
 * @param {{
 *   title: string,
 *   sections: { title: string, screenId: string, rows: { label: string, value: string|null, wide?: boolean }[], note?: string }[],
 *   currentTitle: string,
 *   onClose: () => void,
 *   onEdit?: (screenId: string) => void,
 *   inlineEditors?: Record<string, (onDone: () => void) => import('react').ReactNode>,
 *   lockedIds?: string[],   - sections shown as Locked (no Edit), e.g. business status after verification
 * }} props
 */
export default function StepPreviewPage({ title, sections, currentTitle, onClose, onEdit, inlineEditors = {}, lockedIds = [] }) {
  const [editingId, setEditingId] = useState(null);
  const stopEditing = () => setEditingId(null);

  const startEdit = (section) => {
    if (inlineEditors[section.screenId]) setEditingId(section.screenId);
    else onEdit?.(section.screenId);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.10)] sm:rounded-[20px] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <div className="p-5 sm:p-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-500 shadow-[0_0_0_6px_#F4FBF7] ring-1 ring-emerald-200 sm:size-[52px] sm:rounded-[14px] dark:bg-emerald-500/10 dark:shadow-none dark:ring-emerald-500/30">
              <Eye size={22} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-[22px] dark:text-gray-50">Review {title}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {sections.length} section{sections.length === 1 ? "" : "s"} completed
                {onEdit ? " · use Edit to change anything" : ""}
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
            <Check size={13} strokeWidth={3} aria-hidden="true" />
            Completed
          </span>
        </header>

        {sections.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No details to show for this step yet.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section, index) => {
              const editing = editingId === section.screenId;
              // Compact cards sit side by side (also while editing); only
              // sections with lots of fields (GST, bank…) take the full row.
              const wide = section.rows.length > 3 || section.rows.some((r) => r.wide);
              return (
                <div key={section.title} className={wide ? "sm:col-span-2 lg:col-span-3" : ""}>
                  <PreviewSection
                    section={section}
                    index={index}
                    editing={editing}
                    wide={wide}
                    canEdit={Boolean(onEdit) && !lockedIds.includes(section.screenId)}
                    onStartEdit={() => startEdit(section)}
                    renderEditor={inlineEditors[section.screenId] ?? (() => null)}
                    onDone={stopEditing}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="flex flex-col-reverse gap-3 rounded-b-2xl border-t border-gray-200 bg-[#FCFDFC] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-b-[20px] sm:px-8 dark:border-gray-800 dark:bg-gray-900">
        <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Lock size={12} aria-hidden="true" />
          {onEdit ? "Changes save right here. Verified sections open their step to re-verify." : "Locked after the partner contract — contact support to change."}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to {currentTitle}
        </button>
      </footer>
    </section>
  );
}
