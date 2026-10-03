import React from 'react';

export default function Navbar({ theme, onToggleTheme, onShowKeyModal, onShowH2Modal, onSync, isSyncing }) {
  return (
    <header className="saas-header">
      <div className="header-inner">
        <div className="brand-cluster">
          <div className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Mesh nodes */}
              <circle cx="12" cy="4.5" r="2.5" fill="currentColor" />
              <circle cx="4.5" cy="18" r="2.5" fill="currentColor" />
              <circle cx="19.5" cy="18" r="2.5" fill="currentColor" />
              {/* Central relay hub */}
              <circle cx="12" cy="13" r="1.8" />
              {/* Inter-node offline relay pathways */}
              <line x1="12" y1="7" x2="12" y2="11.2" />
              <line x1="10.5" y1="14.2" x2="6.2" y2="16.8" />
              <line x1="13.5" y1="14.2" x2="17.8" y2="16.8" />
              <line x1="7" y1="18" x2="17" y2="18" strokeDasharray="2 2" opacity="0.5" />
            </svg>
          </div>
          <div className="brand-title-wrap">
            <h1>
              ZeroNet UPI
              <span className="badge-pill badge-pro">Protocol</span>
            </h1>
            <div className="brand-subtitle">
              Decentralized Offline Mesh Relay &amp; Idempotent Settlement
            </div>
          </div>
        </div>

        <div className="header-actions">
          {/* Theme Toggle Button with Lucide Icons */}
          <button 
            className="theme-toggle-btn" 
            onClick={onToggleTheme} 
            title="Switch Theme"
          >
            {theme === 'light' ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            )}
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>

          <button className="btn-ghost-sm" onClick={onShowKeyModal}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            RSA Key
          </button>

          <button className="btn-ghost-sm" onClick={onShowH2Modal} title="View H2 DB Connection Details">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
            H2 Console
          </button>

          <button className="btn-ghost-sm" onClick={() => onSync(true)}>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              style={{ transform: isSyncing ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Sync
          </button>
        </div>
      </div>
    </header>
  );
}
