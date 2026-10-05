import React from 'react';

export default function WhyNotGiantsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Banner */}
      <div className="doc-card">
        <div className="doc-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Why Big UPI Tech Giants Haven't Built Offline Mesh Payments Yet
        </div>
        <p className="doc-text">
          Google Pay, PhonePe, and Paytm handle over <strong>95% of India's UPI volume</strong> and have world-class engineering teams. 
          Why haven't they rolled out multi-hop Bluetooth mesh payments for basement parking, underground metros, and dead-zones?
        </p>
        <p className="doc-text">
          The barrier is not a lack of engineering talent — it is a clash between <strong>regulatory constraints, credit liability risks, mobile OS sandboxing, and corporate incentive structures</strong>. Here is the deep technical and architectural breakdown.
        </p>
      </div>

      {/* 4 Core Structural Barriers */}
      <div className="doc-card">
        <div className="doc-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          The 4 Structural Blockers for Big Tech
        </div>

        <div className="doc-grid">
          {/* Reason 1 */}
          <div className="doc-box">
            <div className="doc-box-title">1. TPAP Regulatory Boundary &amp; Synchronous NPCI Mandate</div>
            <div className="doc-box-desc">
              Google Pay, PhonePe, and Paytm are categorized by the Reserve Bank of India (RBI) and NPCI as <strong>Third-Party Application Providers (TPAPs)</strong>. 
              They do not own or run the core UPI rails — they must conform 100% to NPCI's standardized Common Library (CL) specs. 
              <br /><br />
              UPI's architecture is legally built around <strong>synchronous 2-Factor Authentication (MPIN verification directly against the issuing bank's Core Banking System)</strong>. A TPAP cannot unilaterally alter the protocol to allow store-and-forward mesh routing without NPCI building a brand-new regulatory specification.
            </div>
          </div>

          {/* Reason 2 */}
          <div className="doc-box">
            <div className="doc-box-title">2. The Offline Overdraft &amp; Double-Spending Liability</div>
            <div className="doc-box-desc">
              In real-time online UPI, the bank verifies available balance before authorizing a debit. In an offline mesh, an instruction is signed in a dead-zone. 
              <br /><br />
              <strong>The Fraud Vector:</strong> If a user has ₹500 in their account, signs an offline packet to a merchant in a basement, and immediately spends ₹500 online before the offline packet reaches the bank, the offline transaction will bounce with "Insufficient Funds".
              <br /><br />
              Payment giants refuse to shoulder <strong>unsecured credit risk</strong> or bad-debt write-offs for millions of unverified offline debits unless backed by pre-funded hardware reserves.
            </div>
          </div>

          {/* Reason 3 */}
          <div className="doc-box">
            <div className="doc-box-title">3. Mobile OS Sandboxing (iOS &amp; Android Background BLE Limits)</div>
            <div className="doc-box-desc">
              An ad-hoc mesh requires devices in pockets to constantly advertise and scan for nearby peer packets via Bluetooth Low Energy (BLE).
              <br /><br />
              <strong>Apple iOS (CoreBluetooth):</strong> Background BLE advertising is heavily throttled or halted when the screen is locked to protect battery life and prevent user location fingerprinting. Only Apple's proprietary system services (like Apple's "Find My" network) have kernel-level exceptions.
              <br /><br />
              <strong>Android (Oreo through Android 15):</strong> Strict background execution limits terminate long-running background BLE scanners unless granted persistent foreground notification permissions.
            </div>
          </div>

          {/* Reason 4 */}
          <div className="doc-box">
            <div className="doc-box-title">4. The "Stranger's Battery &amp; Mobile Data" Incentive Dilemma</div>
            <div className="doc-box-desc">
              In a decentralized mesh, <em>Device C (a stranger walking up the stairs)</em> consumes their own smartphone battery and 4G data to upload <em>Device A's</em> payment packet to the bank.
              <br /><br />
              If GPay or PhonePe enabled this silently in the background, users would quickly notice battery drain and data usage on stranger traffic, resulting in 1-star App Store reviews and revoked Bluetooth permissions. 
              A commercial rollout requires economic incentive models or OS-level protocol integration.
            </div>
          </div>
        </div>
      </div>

      {/* Why Existing Half-Measures Don't Solve It */}
      <div className="doc-card">
        <div className="doc-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Why Big Tech's Current "Offline" Solutions Fall Short
        </div>

        <div className="saas-table-wrap" style={{ marginTop: '12px' }}>
          <table className="saas-table">
            <thead>
              <tr>
                <th>Solution</th>
                <th>How It Works</th>
                <th>Why It Doesn't Solve the Dead-Zone Problem</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>UPI Lite</strong></td>
                <td>Pre-funded on-device wallet up to ₹2,000 without MPIN</td>
                <td><strong>Still mandates active internet.</strong> It only bypasses the bank's CBS server to reduce bank core load, but fails instantly with 0 bars of 4G/5G.</td>
              </tr>
              <tr>
                <td><strong>UPI Lite X (NFC)</strong></td>
                <td>Point-to-point tap between two NFC chips within 4 cm</td>
                <td><strong>Point-to-point only, no multi-hop mesh.</strong> Requires expensive NFC POS terminals and cannot relay through intermediaries to reach an online gateway.</td>
              </tr>
              <tr>
                <td><strong>UPI 123PAY (*99# / IVR)</strong></td>
                <td>Interactive voice response calls or sound-wave tone</td>
                <td><strong>Requires cellular voice tower signal.</strong> Underground parking basements and metro tunnels lack 2G/VoLTE cellular tower coverage entirely.</td>
              </tr>
              <tr>
                <td><strong>ZeroNet UPI (This Protocol)</strong></td>
                <td>Decentralized store-and-forward BLE epidemic mesh with RSA-OAEP + AES-GCM envelope sealing</td>
                <td><span style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>Solved: Zero internet needed on sender; packets hop across peer smartphones until reaching any connected bridge.</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Corporate Incentives Breakdown */}
      <div className="doc-card">
        <div className="doc-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          The Business Model &amp; ROI Dilemma
        </div>
        <p className="doc-text">
          More than <strong>97% of daily UPI payments</strong> take place where at least 1 bar of 4G or Wi-Fi is available. 
          For corporate tech giants generating revenue from merchant MDR, loan distribution, mutual funds, and digital gold:
        </p>
        <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: '1.6' }}>
          <li>
            <strong>Low Corporate Priority:</strong> Investing millions into complex distributed consensus cryptography and Bluetooth mesh routing for the 2–3% basement dead-zone edge case offers lower quarterly ROI than launching personal loan funnels or soundboxes.
          </li>
          <li>
            <strong>Disruption Opportunity:</strong> Just like Apple's "Find My" revolutionized device tracking by leveraging peer iPhones, <strong>ZeroNet UPI demonstrates how an open, decentralized cryptographic protocol can solve digital payment continuity</strong> where corporate roadmaps stop.
          </li>
        </ul>
      </div>
    </div>
  );
}
