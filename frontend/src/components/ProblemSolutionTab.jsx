import React from 'react';

export default function ProblemSolutionTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Header */}
      <div className="doc-card">
        <div className="doc-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          System Motivation: Synchronous Bottlenecks in Offline Environments
        </div>
        <p className="doc-text">
          India processes over <strong>14 billion UPI transactions every month</strong>. However, standard UPI architectures share a single critical vulnerability: 
          they are <strong>strictly synchronous</strong> and mandate an active, uninterrupted internet connection (4G/5G/Wi-Fi) at the exact second of payment.
        </p>
        <p className="doc-text">
          When people enter cellular dead-zones — such as <strong>underground metro stations, basement parking lots, rural valleys, overcrowded stadiums, or disaster blackouts</strong> — digital payments fail completely. Customers are forced to abandon transactions, and merchants face lost business.
        </p>

        <div className="doc-grid">
          <div className="doc-box">
            <div className="doc-box-title">1. The Synchronous Lock-in</div>
            <div className="doc-box-desc">
              Standard UPI requires a round-trip connection: Client → PSP App (GPay/PhonePe) → NPCI Switch → Remitter Bank CBS → Beneficiary Bank. If any link has 0 bars of signal, the flow breaks immediately.
            </div>
          </div>

          <div className="doc-box">
            <div className="doc-box-title">2. The Stranger Privacy Threat</div>
            <div className="doc-box-desc">
              In an offline mesh, payments must hop through random strangers’ phones. Without end-to-end envelope encryption, intermediaries could read the payer's PIN, alter the payment amount, or siphon bank credentials.
            </div>
          </div>

          <div className="doc-box">
            <div className="doc-box-title">3. The Duplicate Storm / Double Spending</div>
            <div className="doc-box-desc">
              As multiple mesh devices walk out of a basement into 4G signal simultaneously, they upload identical payment packets concurrently. Without atomic idempotency, the sender's account would be debited multiple times.
            </div>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="doc-card">
        <div className="doc-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Protocol Architecture &amp; Cryptographic Mitigation Strategy
        </div>
        <p className="doc-text">
          ZeroNet UPI decouples <strong>payment authorization (done locally &amp; offline)</strong> from <strong>payment settlement (executed asynchronously when any device reaches connectivity)</strong> through a 4-pillar cryptographic protocol.
        </p>

        <div className="doc-grid">
          <div className="doc-box">
            <div className="doc-box-title">Pillar 1: Hybrid Cryptographic Sealing</div>
            <div className="doc-box-desc">
              The sender's phone encrypts the <code>PaymentInstruction</code> using the bank's cached <strong>RSA-2048 public key</strong> with <strong>OAEP-SHA256</strong> to seal an ephemeral <strong>AES-256-GCM</strong> session key. Strangers acting as relay hops only see tamper-evident ciphertext; only the bank's private key can decrypt it.
            </div>
          </div>

          <div className="doc-box">
            <div className="doc-box-title">Pillar 2: Decentralized Epidemic BLE Gossip</div>
            <div className="doc-box-desc">
              Packets hop device-to-device via localized Bluetooth Low Energy (BLE) gossip rounds with a hop-decremented Time-To-Live (TTL = 5). No cellular towers or Wi-Fi routers are needed in the dead-zone.
            </div>
          </div>

          <div className="doc-box">
            <div className="doc-box-title">Pillar 3: Atomic SHA-256 Idempotency Engine</div>
            <div className="doc-box-desc">
              When multiple bridge nodes upload the same packet concurrently, the backend hashes the ciphertext with SHA-256 into an atomic compare-and-set cache. Exactly one request claims settlement; all duplicate uploads are filtered safely without double-debiting.
            </div>
          </div>

          <div className="doc-box">
            <div className="doc-box-title">Pillar 4: Replay &amp; Freshness Defense</div>
            <div className="doc-box-desc">
              Every instruction embeds a cryptographically unique <code>nonce</code> and a <code>signedAt</code> timestamp. Packets older than the 24-hour freshness sliding window are rejected before ever touching the core banking database.
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="doc-card">
        <div className="doc-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Architecture Comparison: Traditional UPI vs. ZeroNet UPI
        </div>

        <div className="saas-table-wrap" style={{ marginTop: '12px' }}>
          <table className="saas-table">
            <thead>
              <tr>
                <th>Capability</th>
                <th>Standard Online UPI (GPay / PhonePe)</th>
                <th>ZeroNet UPI (This Protocol)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Internet Requirement</strong></td>
                <td>Mandatory real-time 4G/5G/Wi-Fi connection</td>
                <td><span style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>Zero internet required on sender phone</span></td>
              </tr>
              <tr>
                <td><strong>Basement / Deadzone Support</strong></td>
                <td>Fails completely with timeout</td>
                <td><span style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>Relays through nearby peer devices via BLE mesh</span></td>
              </tr>
              <tr>
                <td><strong>Intermediary Trust Model</strong></td>
                <td>Centralized telecom towers &amp; bank switches</td>
                <td><span style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>Zero-trust untrusted hops (RSA-OAEP + AES-GCM sealed)</span></td>
              </tr>
              <tr>
                <td><strong>Concurrency Safeguard</strong></td>
                <td>Single synchronous lock per payment ID</td>
                <td><span style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>Atomic SHA-256 CAS idempotency shield against duplicate storms</span></td>
              </tr>
              <tr>
                <td><strong>Hardware Dependency</strong></td>
                <td>Cellular SIM / VoLTE data connection</td>
                <td><span style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>Standard Bluetooth LE already built into every smartphone</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
