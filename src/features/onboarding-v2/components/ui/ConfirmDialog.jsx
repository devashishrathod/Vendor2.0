import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

/**
 * Small "are you sure?" dialog for actions that can't be undone (deleting a
 * document, cancelling an outlet). Focus starts on Cancel; Escape and the
 * backdrop cancel, except while the action is running.
 * @param {{
 *   title: string,
 *   message?: string,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   busy?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function ConfirmDialog({ title, message, confirmLabel = "Delete", cancelLabel = "Cancel", busy = false, onConfirm, onCancel }) {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={message ? messageId : undefined}
    >
      <button
        type="button"
        aria-label={cancelLabel}
        tabIndex={-1}
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0 h-full w-full cursor-default bg-gray-950/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900">
        <h2 id={titleId} className="text-base font-extrabold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {message && (
          <p id={messageId} className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
