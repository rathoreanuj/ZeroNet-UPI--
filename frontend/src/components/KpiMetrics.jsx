import React from 'react';

export default function KpiMetrics({ settledVolume, settledCount, duplicateCount, activePackets, deviceCount, idempotencyCount }) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-header">
          <span>Settled Volume</span>
          <div className="kpi-icon-wrap">₹</div>
        </div>
        <div className="kpi-value">
          ₹{settledVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="kpi-meta">
          {settledCount} settled &bull; {duplicateCount} duplicates shielded
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>In-Flight Packets</span>
          <div className="kpi-icon-wrap">#</div>
        </div>
        <div className="kpi-value">{activePackets}</div>
        <div className="kpi-meta">Gossip propagation pool</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>Mesh Nodes</span>
          <div className="kpi-icon-wrap">&bull;</div>
        </div>
        <div className="kpi-value">{deviceCount} Nodes</div>
        <div className="kpi-meta">4 Offline &bull; 1 Bridge</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>Idempotency Cache</span>
          <div className="kpi-icon-wrap">/</div>
        </div>
        <div className="kpi-value">{idempotencyCount}</div>
        <div className="kpi-meta">SHA-256 duplicate cache</div>
      </div>
    </div>
  );
}
