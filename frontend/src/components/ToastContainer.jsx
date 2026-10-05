import React from 'react';

export default function ToastContainer({ toasts }) {
  const colorMap = {
    success: 'var(--status-success-text)',
    warning: 'var(--status-warning-text)',
    danger: 'var(--status-danger-text)',
    info: 'var(--text-primary)',
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="saas-toast">
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: colorMap[toast.type] || colorMap.info,
              flexShrink: 0,
            }}
          ></div>
          <div>
            <strong
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: colorMap[toast.type] || colorMap.info,
              }}
            >
              {toast.title}
            </strong>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {toast.message}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
