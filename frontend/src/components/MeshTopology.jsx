import React, { useRef, useEffect } from 'react';

const NODE_COORDINATES = {
  'phone-alice': { x: 80, y: 55, name: 'Alice (Sender)' },
  'phone-stranger1': { x: 190, y: 120, name: 'Peer 1' },
  'phone-stranger2': { x: 300, y: 45, name: 'Peer 2' },
  'phone-stranger3': { x: 410, y: 125, name: 'Peer 3' },
  'phone-bridge': { x: 520, y: 65, name: 'Bridge (4G)' }
};

export default function MeshTopology({ devices, theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const isLight = theme === 'light';

    ctx.clearRect(0, 0, width, height);

    // Draw Basement vs Surface Zone boundary
    ctx.strokeStyle = isLight ? '#e2e8f0' : '#27272a';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(465, 0);
    ctx.lineTo(465, height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isLight ? '#94a3b8' : '#52525b';
    ctx.font = '500 10px Inter';
    ctx.fillText('BASEMENT (OFFLINE)', 16, 18);
    ctx.fillText('SURFACE (4G)', 480, 18);

    // Subtle connection links
    const links = [
      ['phone-alice', 'phone-stranger1'],
      ['phone-stranger1', 'phone-stranger2'],
      ['phone-stranger2', 'phone-stranger3'],
      ['phone-stranger3', 'phone-bridge'],
      ['phone-alice', 'phone-stranger2'],
      ['phone-stranger2', 'phone-bridge']
    ];

    ctx.strokeStyle = isLight ? '#cbd5e1' : '#27272a';
    ctx.lineWidth = 1;
    links.forEach(([fromId, toId]) => {
      const p1 = NODE_COORDINATES[fromId];
      const p2 = NODE_COORDINATES[toId];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    Object.entries(NODE_COORDINATES).forEach(([id, coords]) => {
      const deviceState = devices.find((d) => d.deviceId === id);
      const hasPackets = deviceState && deviceState.packetCount > 0;
      const isBridge = id === 'phone-bridge';

      // Outer ring for active packets
      if (hasPackets) {
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = isLight ? '#cbd5e1' : '#3f3f46';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Core node dot
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = isBridge 
        ? '#10b981' 
        : (hasPackets ? (isLight ? '#0f172a' : '#f4f4f5') : (isLight ? '#94a3b8' : '#3f3f46'));
      ctx.fill();

      // Node Label
      ctx.fillStyle = isLight ? '#334155' : '#a1a1aa';
      ctx.font = '500 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(coords.name, coords.x, coords.y + 20);

      // Packet counter tag
      if (hasPackets) {
        ctx.fillStyle = isLight ? '#0f172a' : '#fafafa';
        ctx.font = '500 9px "JetBrains Mono", monospace';
        ctx.fillText(`${deviceState.packetCount} pkt`, coords.x, coords.y - 10);
      }
    });
  }, [devices, theme]);

  return (
    <div className="saas-card">
      <div className="card-title-bar">
        <div className="card-heading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
          Mesh Topology
        </div>
        <div className="card-badge">{devices.length} Devices Active</div>
      </div>

      <div className="devices-container">
        {devices.map((d) => {
          const isBridge = d.hasInternet;
          return (
            <div key={d.deviceId} className={`device-row ${isBridge ? 'is-bridge' : ''}`}>
              <div className="device-info-left">
                <div className="device-avatar">
                  {isBridge ? '4G' : 'BLE'}
                </div>
                <div>
                  <div className="device-id">
                    {d.deviceId}
                    <span className={`badge-status ${isBridge ? 'badge-status-bridge' : 'badge-status-offline'}`}>
                      {isBridge ? 'Gateway' : 'Offline'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Holding {d.packetCount} packet(s)
                  </div>
                </div>
              </div>
              <div className="device-packets-chips">
                {d.packetIds.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Empty
                  </span>
                ) : (
                  d.packetIds.map((id) => (
                    <span key={id} className="packet-chip">#{id}</span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Canvas */}
      <div className="topology-canvas-wrap">
        <span className="canvas-overlay-tag">SIMULATED BLUETOOTH TOPOLOGY</span>
        <canvas ref={canvasRef} id="meshCanvas" width="600" height="180"></canvas>
      </div>
    </div>
  );
}
