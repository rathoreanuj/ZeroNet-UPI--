import React from 'react';

const USER_INITIALS = {
  'alice@demo': 'AL',
  'bob@demo': 'BO',
  'carol@demo': 'CA',
  'dave@demo': 'DA'
};

export default function AccountsTable({ accounts, onPrefillTransfer, idempotencyCount }) {
  return (
    <div className="saas-card">
      <div className="card-title-bar">
        <div className="card-heading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          Participant Balances
        </div>
        <div className="card-badge">H2 In-Memory DB</div>
      </div>

      <div className="saas-table-wrap">
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>VPA</th>
              <th>Balance</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.vpa}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="user-avatar-sm">
                      {USER_INITIALS[a.vpa] || 'U'}
                    </div>
                    <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.holderName}</strong>
                  </div>
                </td>
                <td>
                  <span className="account-vpa-cell">{a.vpa}</span>
                </td>
                <td>
                  <span className="balance-badge">
                    ₹{parseFloat(a.balance || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn-ghost-sm"
                    style={{ padding: '3px 8px', fontSize: '10px' }}
                    onClick={() => onPrefillTransfer(a.vpa)}
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="accounts-card-footer">
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Debited/credited atomically.
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Cache: {idempotencyCount} hashes
        </span>
      </div>
    </div>
  );
}
