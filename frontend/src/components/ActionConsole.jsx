import React, { useState } from 'react';

export default function ActionConsole({
  onSendPacket,
  onGossip,
  onFlushBridges,
  onResetMesh,
  isInjecting,
  isGossiping,
  isFlushing,
  senderVpa,
  setSenderVpa,
}) {
  const [receiverVpa, setReceiverVpa] = useState('bob@demo');
  const [amount, setAmount] = useState(500);
  const [pin, setPin] = useState('1234');

  const handleSubmitInject = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    onSendPacket({
      senderVpa,
      receiverVpa,
      amount: parseFloat(amount),
      pin,
      ttl: 5,
      startDevice: 'phone-alice',
    });
  };

  return (
    <div className="action-strip">
      <div className="action-strip-header">
        <div className="action-strip-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="10 8 16 12 10 16 10 8"></polygon>
          </svg>
          Simulation Pipeline
        </div>
        <button 
          className="saas-btn saas-btn-danger" 
          style={{ width: 'auto', height: '28px', padding: '0 10px', fontSize: '11px' }}
          onClick={onResetMesh}
        >
          Reset Mesh & Cache
        </button>
      </div>

      <div className="stepper-grid">
        {/* Step 1: Inject Payment */}
        <div className="step-block featured">
          <div>
            <div className="step-title-wrap">
              <span className="step-pill">1</span>
              <div>
                <div className="step-name">Compose & Inject</div>
                <div className="step-desc">Offline phone seals payment with RSA key</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="form-row">
                <div className="input-group">
                  <span className="input-label">Sender</span>
                  <select 
                    className="saas-select" 
                    value={senderVpa} 
                    onChange={(e) => setSenderVpa(e.target.value)}
                  >
                    <option value="alice@demo">alice@demo (Alice)</option>
                    <option value="bob@demo">bob@demo (Bob)</option>
                    <option value="carol@demo">carol@demo (Carol)</option>
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Receiver</span>
                  <select 
                    className="saas-select" 
                    value={receiverVpa} 
                    onChange={(e) => setReceiverVpa(e.target.value)}
                  >
                    <option value="bob@demo">bob@demo (Bob)</option>
                    <option value="carol@demo">carol@demo (Carol)</option>
                    <option value="alice@demo">alice@demo (Alice)</option>
                    <option value="dave@demo">dave@demo (Dave)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <span className="input-label">Amount (₹)</span>
                  <input 
                    type="number" 
                    className="saas-input" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    min="1" 
                    step="10" 
                  />
                  <div className="quick-amounts">
                    <span className="amt-chip" onClick={() => setAmount(100)}>₹100</span>
                    <span className="amt-chip" onClick={() => setAmount(500)}>₹500</span>
                    <span className="amt-chip" onClick={() => setAmount(1000)}>₹1k</span>
                    <span className="amt-chip" onClick={() => setAmount(2500)}>₹2.5k</span>
                  </div>
                </div>
                <div className="input-group">
                  <span className="input-label">PIN</span>
                  <input 
                    type="password" 
                    className="saas-input" 
                    value={pin} 
                    maxLength={6} 
                    onChange={(e) => setPin(e.target.value)}
                    style={{ letterSpacing: '2px' }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            className="saas-btn saas-btn-primary" 
            onClick={handleSubmitInject} 
            disabled={isInjecting}
          >
            {isInjecting ? 'Sealing...' : 'Inject into Mesh'}
          </button>
        </div>

        {/* Step 2: Mesh Gossip */}
        <div className="step-block">
          <div>
            <div className="step-title-wrap">
              <span className="step-pill">2</span>
              <div>
                <div className="step-name">Gossip Hop</div>
                <div className="step-desc">Relay packet across peer devices</div>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
              Devices relay held packets to nearby phones in the basement. TTL decrements per hop.
            </p>
          </div>
          <button 
            className="saas-btn saas-btn-secondary" 
            onClick={onGossip} 
            disabled={isGossiping}
          >
            {isGossiping ? 'Relaying...' : 'Run Gossip Round'}
          </button>
        </div>

        {/* Step 3: Bridge Uplink */}
        <div className="step-block">
          <div>
            <div className="step-title-wrap">
              <span className="step-pill">3</span>
              <div>
                <div className="step-name">Bridge 4G Ingest</div>
                <div className="step-desc">Node reaches cellular connection</div>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
              Bridge node POSTs held packets to server. Exercises atomic SHA-256 deduplication.
            </p>
          </div>
          <button 
            className="saas-btn saas-btn-secondary" 
            onClick={onFlushBridges} 
            disabled={isFlushing}
          >
            {isFlushing ? 'Uploading...' : 'Bridges Upload (4G)'}
          </button>
        </div>

        {/* Step 4: Replay Defense */}
        <div className="step-block">
          <div>
            <div className="step-title-wrap">
              <span className="step-pill">4</span>
              <div>
                <div className="step-name">Idempotency Check</div>
                <div className="step-desc">Verify duplicate rejection</div>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
              Re-attempt bridge upload to verify duplicate packets are safely dropped.
            </p>
          </div>
          <button 
            className="saas-btn saas-btn-outline" 
            onClick={onFlushBridges}
            disabled={isFlushing}
          >
            Re-Attempt Upload
          </button>
        </div>
      </div>
    </div>
  );
}
