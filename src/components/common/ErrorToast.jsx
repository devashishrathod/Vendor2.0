import { useEffect } from 'react';

export default function ErrorToast({ error, onDismiss, duration = 5000 }) {
  const { humanMessage, txnId } = error || {};

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [error, duration, onDismiss]);

  if (!error) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        maxWidth: 380, width: 'calc(100vw - 48px)',
        background: 'var(--color-background-primary)',
        border: '0.5px solid #F09595',
        borderLeft: '3px solid #E24B4A',
        borderRadius: 'var(--border-radius-md)',
        padding: '12px 14px',
        display: 'flex', alignItems: 'flex-start', gap: 10,
        animation: 'slideInToast 0.2s ease',
      }}
    >
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <i className="ti ti-alert-circle"
        style={{ fontSize: 18, color: '#E24B4A', flexShrink: 0, marginTop: 1 }}
        aria-hidden="true" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500,
          color: 'var(--color-text-primary)', margin: '0 0 2px' }}>
          Verification failed
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)',
          margin: 0, wordBreak: 'break-word' }}>
          {humanMessage}
        </p>
        {txnId && (
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)',
            margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
            Ref: {txnId}
          </p>
        )}
      </div>

      <button onClick={onDismiss} aria-label="Dismiss"
        style={{ background: 'none', border: 'none',
          cursor: 'pointer', padding: 0, lineHeight: 1,
          color: 'var(--color-text-secondary)' }}>
        <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
      </button>
    </div>
  );
}