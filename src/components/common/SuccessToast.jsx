import { useEffect } from "react";

export default function SuccessToast({ message, onDismiss, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 380,
        width: "calc(100vw - 48px)",
        background: "var(--color-background-primary)",
        border: "0.5px solid #6ee7b7",
        borderLeft: "3px solid #10b981",
        borderRadius: "var(--border-radius-md)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        animation: "slideInToast 0.2s ease",
      }}
    >
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <i
        className="ti ti-circle-check"
        style={{ fontSize: 18, color: "#10b981", flexShrink: 0, marginTop: 1 }}
        aria-hidden="true"
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-secondary)",
            margin: 0,
            wordBreak: "break-word",
          }}
        >
          {message}
        </p>
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          color: "var(--color-text-secondary)",
        }}
      >
        <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
      </button>
    </div>
  );
}
