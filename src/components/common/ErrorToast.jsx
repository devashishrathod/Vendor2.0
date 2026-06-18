import { useEffect } from "react";

function resolveVariant(status, message = "") {
  if (status === 403) {
    if (
      message.toLowerCase().includes("inactive") ||
      message.toLowerCase().includes("deactivated")
    ) {
      return {
        icon: "ti-user-off",
        titleColor: "var(--color-text-warning)",
        msgColor: "var(--color-text-warning)",
        background: "var(--color-background-warning)",
        border: "0.5px solid var(--color-border-warning)",
        borderLeft: "3px solid #f59e0b",
        iconColor: "var(--color-text-warning)",
      };
    }
    return {
      icon: "ti-shield-off",
      titleColor: "var(--color-text-primary)",
      msgColor: "var(--color-text-secondary)",
      background: "var(--color-background-primary)",
      border: "0.5px solid #F09595",
      borderLeft: "3px solid #E24B4A",
      iconColor: "#E24B4A",
    };
  }
  if (status === 401) {
    return {
      icon: "ti-lock",
      titleColor: "var(--color-text-primary)",
      msgColor: "var(--color-text-secondary)",
      background: "var(--color-background-primary)",
      border: "0.5px solid #F09595",
      borderLeft: "3px solid #E24B4A",
      iconColor: "#E24B4A",
    };
  }
  return {
    icon: "ti-alert-circle",
    titleColor: "var(--color-text-primary)",
    msgColor: "var(--color-text-secondary)",
    background: "var(--color-background-primary)",
    border: "0.5px solid #F09595",
    borderLeft: "3px solid #E24B4A",
    iconColor: "#E24B4A",
  };
}

export default function ErrorToast({ error, onDismiss, duration = 5000 }) {
  const { status, message, txnId } = error || {};

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [error, duration, onDismiss]);

  if (!error) return null;

  const v = resolveVariant(status, message);

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 380,
        width: "calc(100vw - 48px)",
        background: v.background,
        border: v.border,
        borderLeft: v.borderLeft,
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
        className={`ti ${v.icon}`}
        style={{
          fontSize: 18,
          color: v.iconColor,
          flexShrink: 0,
          marginTop: 1,
        }}
        aria-hidden="true"
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 12,
            color: v.msgColor,
            margin: 0,
            wordBreak: "break-word",
          }}
        >
          {message}
        </p>
        {txnId && (
          <p
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary)",
              margin: "4px 0 0",
              fontFamily: "var(--font-mono)",
            }}
          >
            Ref: {txnId}
          </p>
        )}
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
