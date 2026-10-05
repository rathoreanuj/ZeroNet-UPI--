import React, { useState } from 'react';

export default function H2Modal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const jdbcUrl = 'jdbc:h2:mem:upimesh';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jdbcUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
            <h3 style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>
              Connect to H2 In-Memory Database
            </h3>
          </div>
          <button className="btn-ghost-sm" onClick={onClose} style={{ border: 'none', fontSize: '14px', padding: '2px 6px' }}>
            ✕
          </button>
        </div>

        <div style={{
          background: 'var(--status-warning-bg)',
          border: '1px solid var(--status-warning-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          marginBottom: '14px',
          fontSize: '11px',
          lineHeight: '1.5',
          color: 'var(--text-primary)'
        }}>
          <strong>Important:</strong> H2 Console defaults to <code>jdbc:h2:~/test</code>. Replace it with the in-memory URL below, or H2 will show <em>"Database not found"</em>.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              JDBC URL (Copy &amp; Paste into H2 login):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={jdbcUrl}
                className="saas-input"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', cursor: 'text' }}
              />
              <button
                type="button"
                className="saas-btn saas-btn-secondary"
                style={{ width: 'auto', padding: '0 14px', fontSize: '11px', height: '34px' }}
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="modal-form-grid">
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                User Name:
              </label>
              <input
                type="text"
                readOnly
                value="sa"
                className="saas-input"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Password:
              </label>
              <input
                type="text"
                readOnly
                value="(leave blank)"
                className="saas-input"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-muted)' }}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <button className="saas-btn saas-btn-secondary modal-btn" style={{ width: 'auto', height: '32px' }} onClick={onClose}>
            Cancel
          </button>
          <a
            href="http://localhost:8080/h2-console"
            target="_blank"
            rel="noreferrer"
            className="saas-btn saas-btn-primary"
            style={{ width: 'auto', height: '32px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            onClick={onClose}
          >
            Launch H2 Console ↗
          </a>
        </div>
      </div>
    </div>
  );
}
