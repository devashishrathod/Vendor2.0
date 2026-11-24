import { useState } from "react";
import { ArrowLeft, Check, Eye, FileText, ImageOff, Lock, Pencil, Plus } from "lucide-react";
import { filledRows, isWideSection } from "../../utils/stepPreview";

const EDIT_BUTTON =
  "inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-500/10";

function DocumentList({ rows, wide }) {
  return (
    <ul className={wide ? "grid grid-cols-1 gap-2 sm:grid-cols-2" : "flex flex-col gap-2"}>
      {rows.map((row, i) => (
        <li key={`${row.label}-${i}`} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-emerald-400 dark:ring-gray-700" aria-hidden="true">
            <FileText size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-gray-900 dark:text-gray-100">{row.label}</p>
            <p className="truncate text-[11.5px] text-gray-500 dark:text-gray-400" title={row.value}>
              {row.value}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const MAX_THUMBS = 8;

/** One saved image (logo, cover, album photo); a broken URL shows a placeholder. */
function Thumb({ src, alt, shape }) {
  const [failed, setFailed] = useState(false);
  const size = shape === "wide" ? "h-16 w-40" : "size-16";
  if (failed) {
    return (
      <span className={`grid ${size} shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800`} role="img" aria-label={`${alt} (couldn't load)`}>
        <ImageOff size={16} aria-hidden="true" />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${size} shrink-0 rounded-lg object-cover ring-1 ring-inset ring-gray-200 dark:ring-gray-700`}
    />
  );
}

function FieldGrid({ rows, wide, dense }) {
  return (
    <dl className={`grid grid-cols-1 gap-x-6 ${dense ? "gap-y-2" : "gap-y-3"} ${wide ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
      {rows.map((row) => (
        <div key={row.label} className={`min-w-0 ${row.wide && wide ? "col-span-full" : ""}`}>
          <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-gray-500 dark:text-gray-400">{row.label}</dt>
          {row.images?.length ? (
            <dd className="mt-1.5">
              <div className="flex flex-wrap gap-2">
                {row.images.slice(0, MAX_THUMBS).map((src, i) => (
                  <Thumb key={`${src}-${i}`} src={src} alt={row.images.length > 1 ? `${row.label} ${i + 1}` : row.label} shape={row.imageShape} />
                ))}
                {row.images.length > MAX_THUMBS && (
                  <span className="grid size-16 place-items-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    +{row.images.length - MAX_THUMBS}
                  </span>
                )}
              </div>
              {row.caption && <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">{row.caption}</p>}
            </dd>
          ) : (
            <dd className="mt-0.5 break-words text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">{row.value}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}

/**
 * `dense` (review page): a field named like its section (GSTIN in the GSTIN
 * card) shows as the card's main value instead of repeating the title.
 */
function SectionBody({ section, wide, dense }) {
  const filled = filledRows(section);
  const first = filled[0];
  const primary =
    dense && !section.compact && section.kind !== "documents" && first && !first.images?.length && first.label.toLowerCase() === section.title.toLowerCase()
      ? first
      : null;
  const rows = primary ? filled.slice(1) : filled;

  if (primary) {
    return (
      <>
        {section.note && (
          <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
            {section.note}
          </p>
        )}
        <p className="break-words text-base font-bold text-gray-900 dark:text-gray-100">{primary.value}</p>
        {rows.length > 0 && (
          <div className="mt-2">
            <FieldGrid rows={rows} wide={wide} dense />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {section.note && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
          {section.note}
        </p>
      )}
      {rows.length === 0 && !section.note && <p className="text-[13px] text-gray-500 dark:text-gray-400">Not available yet.</p>}
      {rows.length > 0 &&
        (section.compact ? (
          <p className="break-words text-base font-bold text-gray-900 dark:text-gray-100">{rows[0].value}</p>
        ) : section.kind === "documents" ? (
          <DocumentList rows={rows} wide={wide} />
        ) : (
          <FieldGrid rows={rows} wide={wide} dense={dense} />
        ))}
    </>
  );
}

/**
 * One saved section: title, Edit / 🔒 Locked, and its fields (or an inline
 * editor while editing). `editLabel` + `points` turn Edit into "Add (+N)"
 * for a skipped item (review page). `dense` tightens the padding (review page).
 */
export function PreviewSection({ section, editing, wide, canEdit, onStartEdit, renderEditor, onDone, editLabel = "Edit", points = 0, dense = false }) {
  return (
    <div
      className={`flex h-full flex-col rounded-2xl border bg-white transition-shadow dark:bg-gray-900 ${
        editing
          ? "border-emerald-300 ring-4 ring-emerald-500/10 dark:border-emerald-500/40"
          : "border-gray-200 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_12px_-4px_rgba(16,24,40,0.08)] dark:border-gray-700"
      }`}
    >
      <div className={`flex items-center gap-2.5 ${dense ? "px-3.5 pb-1 pt-2.5" : "px-4 pb-2 pt-3"}`}>
        <span
          className={`grid size-5 shrink-0 place-items-center rounded-full text-white ${section.skipped ? "bg-amber-400" : "bg-emerald-500"}`}
          aria-hidden="true"
        >
          <Check size={11} strokeWidth={3.5} />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[12px] font-bold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">{section.title}</h2>
        {!editing &&
          (canEdit ? (
            <button type="button" onClick={onStartEdit} aria-label={`${editLabel} ${section.title}`} className={EDIT_BUTTON}>
              {editLabel === "Edit" ? <Pencil size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
              {editLabel}
              {points > 0 && <span className="text-[10.5px] font-extrabold">+{points}</span>}
            </button>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10.5px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <Lock size={11} aria-hidden="true" />
              Locked
            </span>
          ))}
      </div>

      <div className={`flex-1 ${dense ? "px-3.5 pb-3 pt-0.5" : "px-4 pb-4 pt-1"}`}>
        {editing ? renderEditor(onDone) : <SectionBody section={section} wide={wide} dense={dense} />}
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
 *   sections: (import("../../utils/stepPreview").PreviewSection & { screenId: string })[],
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

  // Three compact cards (Basic Details) fit one row; otherwise pairs, so a
  // row never ends with an empty slot next to a lone card.
  const compactCount = sections.filter((s) => !isWideSection(s)).length;
  const gridCols = compactCount > 0 && compactCount % 3 === 0 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";

  // A skipped screen passes the step, but say it was skipped (status screen SKIPPED).
  const skippedCount = sections.filter((s) => s.skipped).length;
  const doneCount = sections.length - skippedCount;
  const allSkipped = sections.length > 0 && skippedCount === sections.length;
  const summary = [
    doneCount > 0 ? `${doneCount} section${doneCount === 1 ? "" : "s"} completed` : null,
    skippedCount > 0 ? `${skippedCount} skipped` : null,
  ]
    .filter(Boolean)
    .join(" · ");

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
                {summary || "0 sections completed"}
                {onEdit ? " · use Edit to change anything" : ""}
              </p>
            </div>
          </div>
          {allSkipped ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30">
              Skipped
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
              <Check size={13} strokeWidth={3} aria-hidden="true" />
              Completed
            </span>
          )}
        </header>

        {sections.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No details to show for this step yet.</p>
        ) : (
          <div className={`mt-6 grid grid-cols-1 gap-3 ${gridCols}`}>
            {sections.map((section, index) => {
              const wide = isWideSection(section);
              // A lone compact card at the end of a 2-up grid takes the full row.
              const lastOdd = !wide && gridCols === "sm:grid-cols-2" && compactCount % 2 === 1 && index === sections.length - 1;
              return (
                <div key={section.title} className={`animate-fade-up ${wide || lastOdd ? "col-span-full" : ""}`} style={{ animationDelay: `${index * 50}ms` }}>
                  <PreviewSection
                    section={section}
                    editing={editingId === section.screenId}
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
          {lockedIds.length > 0 ? "Locked sections can only be changed through support." : "Changes save right here."}
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
