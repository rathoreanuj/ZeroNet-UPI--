import React from 'react';

export default function ActivityTerminal({ logs, onClearLogs }) {
  return (
    <div className="terminal-card">
      <div className="terminal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="terminal-dots">
            <div className="terminal-dot" style={{ background: '#ef4444' }}></div>
            <div className="terminal-dot" style={{ background: '#f59e0b' }}></div>
            <div className="terminal-dot" style={{ background: '#10b981' }}></div>
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#94a3b8',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            protocol_runtime.log
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-ghost-sm"
            style={{ padding: '3px 8px', fontSize: '11px' }}
            onClick={onClearLogs}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="terminal-body" id="logTerminal">
        {logs.map((log) => {
          let colorClass = 'log-msg';
          if (log.type === 'success') colorClass = 'log-success';
          if (log.type === 'warn') colorClass = 'log-warn';
          if (log.type === 'danger') colorClass = 'log-danger';
          if (log.type === 'accent') colorClass = 'log-accent';

          return (
            <div key={log.id} className="log-entry">
              <span className="log-ts">[{log.timestamp}]</span>
              <span className={colorClass}>{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
