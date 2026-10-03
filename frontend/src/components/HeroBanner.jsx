import React from 'react';

export default function HeroBanner({ onRunAutomatedDemo, isAutoSimulating }) {
  return (
    <div className="hero-banner">
      <div className="hero-content">
        <h2>Offline Mesh Payment Simulator</h2>
        <p>
          Simulates offline UPI transactions in zero-connectivity environments.
          Payments are cryptographically sealed with the server's RSA public key, relayed peer-to-peer via Bluetooth mesh gossip, and settled idempotently when a bridge node reaches cellular uplink.
        </p>
        <div className="security-tags">
          <span className="sec-tag">RSA-2048 OAEP + AES-GCM</span>
          <span className="sec-tag">SHA-256 Idempotency</span>
          <span className="sec-tag">24h Replay Window</span>
          <span className="sec-tag">BLE Gossip (TTL 5)</span>
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <button 
          className="saas-btn saas-btn-secondary" 
          onClick={onRunAutomatedDemo} 
          disabled={isAutoSimulating}
          style={{ width: 'auto', padding: '0 16px' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          {isAutoSimulating ? 'Simulating...' : 'Simulate Lifecycle'}
        </button>
      </div>
    </div>
  );
}
