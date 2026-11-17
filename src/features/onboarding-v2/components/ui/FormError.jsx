import { useEffect } from "react";
import { useToastStore } from "../../store/toastStore";

/**
 * Shows a failed API call / blocked action as an error toast. Drop it
 * where the inline error used to be; it renders nothing itself and fires a
 * toast each time `message` changes to a new non-empty value.
 * Text only — a JSX message would be a new object every render and re-toast.
 * @param {{ message?: string, children?: string }} props
 */
export default function FormError({ message, children }) {
  const raw = message ?? children;
  const content = typeof raw === "string" ? raw : "";
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    if (content) push({ tone: "error", message: content });
  }, [content, push]);

  return null;
}
