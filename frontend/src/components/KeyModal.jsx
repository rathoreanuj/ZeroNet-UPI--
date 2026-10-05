import React from 'react';

export default function KeyModal({ isOpen, onClose, publicKey, onCopyKey }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em' }}>Server RSA Public Key</h3>
          <button className="btn-ghost-sm" onClick={onClose} style={{ border: 'none', fontSize: '14px', padding: '2px 6px' }}>
            ✕
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
          Cached by offline clients to seal transactions via <strong>RSA-2048 OAEP</strong> + ephemeral <strong>AES-256-GCM</strong>. Intermediate relay nodes cannot inspect payment instructions.
        </p>
        <div
          style={{
            background: 'var(--modal-inner-bg)',
            border: '1px solid var(--border-subtle)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            wordBreak: 'break-all',
            color: 'var(--text-primary)',
            maxHeight: '160px',
            overflowY: 'auto',
            lineHeight: 1.6,
          }}
        >
          {publicKey || 'Loading server public key...'}
        </div>
        <div className="modal-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', gap: '8px' }}>
          <button className="saas-btn saas-btn-secondary modal-btn" style={{ width: 'auto', height: '30px' }} onClick={onCopyKey}>
            Copy Key
          </button>
          <button className="saas-btn saas-btn-primary modal-btn" style={{ width: 'auto', height: '30px' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
