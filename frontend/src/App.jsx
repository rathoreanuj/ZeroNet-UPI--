import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import KpiMetrics from './components/KpiMetrics';
import ActionConsole from './components/ActionConsole';
import MeshTopology from './components/MeshTopology';
import AccountsTable from './components/AccountsTable';
import TransactionLedger from './components/TransactionLedger';
import ActivityTerminal from './components/ActivityTerminal';
import KeyModal from './components/KeyModal';
import ToastContainer from './components/ToastContainer';
import ProblemSolutionTab from './components/ProblemSolutionTab';
import WhyNotGiantsTab from './components/WhyNotGiantsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');

  // Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('meshpay_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  // Data States
  const [devices, setDevices] = useState([]);
  const [idempotencyCount, setIdempotencyCount] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Action Statuses
  const [isInjecting, setIsInjecting] = useState(false);
  const [isGossiping, setIsGossiping] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  // Form Shortcut State
  const [senderVpa, setSenderVpa] = useState('alice@demo');

  // Enclave Modal State
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [serverPublicKey, setServerPublicKey] = useState('');

  // Toast Helper
  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  // Logger Helper
  const addLog = useCallback((message, type = 'default') => {
    const timestamp = new Date().toLocaleTimeString();
    const id = Date.now() + Math.random().toString();
    setLogs((prev) => [{ id, timestamp, message, type }, ...prev]);
  }, []);

  const clearLogs = () => {
    setLogs([]);
    addLog('Log terminal cleared.', 'accent');
  };

  // Theme Toggle
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('meshpay_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    addToast('Theme Changed', `Switched to ${newTheme.toUpperCase()} mode`, 'info');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Main Data Refresh
  const refresh = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    try {
      // 1. Mesh state
      const meshRes = await fetch('/api/mesh/state');
      if (meshRes.ok) {
        const meshData = await meshRes.json();
        setDevices(meshData.devices || []);
        setIdempotencyCount(meshData.idempotencyCacheSize || 0);
      }

      // 2. Accounts
      const accRes = await fetch('/api/accounts');
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData || []);
      }

      // 3. Transactions
      const txRes = await fetch('/api/transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData || []);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsSyncing(false), 350);
      }
    }
  }, []);

  // Initial load & Polling
  useEffect(() => {
    refresh();
    addLog('React client initialized. Connected to Core Banking Enclave.', 'success');
    addLog('Virtual topology: 4 offline basement nodes + 1 cellular bridge active.', 'accent');

    const interval = setInterval(() => {
      refresh();
    }, 3500);
    return () => clearInterval(interval);
  }, [refresh, addLog]);

  // Key Modal fetch
  const handleShowKeyModal = async () => {
    setKeyModalOpen(true);
    try {
      const res = await fetch('/api/server-key');
      if (res.ok) {
        const data = await res.json();
        setServerPublicKey(data.publicKey);
      }
    } catch {
      setServerPublicKey('Failed to retrieve server public key.');
    }
  };

  const handleCopyKey = () => {
    if (!serverPublicKey) return;
    navigator.clipboard.writeText(serverPublicKey).then(() => {
      addToast('Key Copied', 'RSA-2048 public key copied to clipboard', 'success');
    });
  };

  // Step 1: Inject Payment
  const handleSendPacket = async (body) => {
    setIsInjecting(true);
    try {
      const res = await fetch('/api/demo/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = await res.json();

      addLog(`📤 [INJECT] Sealed ₹${body.amount} payment: ${body.senderVpa} → ${body.receiverVpa}`, 'accent');
      addLog(`   Packet #${r.packetId.substring(0, 8)} injected at ${r.injectedAt} (TTL=${r.ttl})`, 'default');
      addLog(`   Ciphertext: ${r.ciphertextPreview}`, 'default');

      addToast('Packet Injected', `₹${body.amount} sealed & handed to phone-alice`, 'success');
      await refresh();
    } catch (e) {
      addLog(`❌ Injection failed: ${e.message}`, 'danger');
      addToast('Injection Error', e.message, 'danger');
    } finally {
      setIsInjecting(false);
    }
  };

  // Step 2: Gossip Round
  const handleGossip = async () => {
    setIsGossiping(true);
    try {
      const res = await fetch('/api/mesh/gossip', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = await res.json();

      addLog(`🔄 [GOSSIP ROUND] Executed ${r.transfers} BLE peer packet transfers across mesh`, 'accent');
      addLog(`   Node state: ${JSON.stringify(r.deviceCounts)}`, 'default');

      addToast('Mesh Gossip Complete', `${r.transfers} packet hops executed across neighbors`, 'info');
      await refresh();
    } catch (e) {
      addLog(`❌ Gossip failed: ${e.message}`, 'danger');
      addToast('Gossip Error', e.message, 'danger');
    } finally {
      setIsGossiping(false);
    }
  };

  // Step 3: Flush Bridges (4G Uplink)
  const handleFlushBridges = async () => {
    setIsFlushing(true);
    try {
      const res = await fetch('/api/mesh/flush', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = await res.json();

      addLog(`📡 [4G UPLINK] Bridge node executed ${r.uploadsAttempted} upload(s) to /api/bridge/ingest`, 'accent');

      if (r.results && r.results.length > 0) {
        r.results.forEach((res) => {
          const isSettled = res.outcome === 'SETTLED';
          const isDup = res.outcome === 'DUPLICATE_DROPPED';
          const type = isSettled ? 'success' : isDup ? 'warn' : 'danger';
          addLog(
            `   ➜ Node [${res.bridgeNode}] Packet #${res.packetId} => ${res.outcome} ${res.reason ? '(' + res.reason + ')' : ''}`,
            type
          );

          if (isSettled) {
            addToast('Payment Settled!', `Packet #${res.packetId} decrypted & settled on core ledger`, 'success');
          } else if (isDup) {
            addToast('Duplicate Blocked', `Packet #${res.packetId} filtered by idempotency cache`, 'warning');
          }
        });
      } else {
        addLog('   No bridge nodes currently hold packets. Run Gossip first!', 'warn');
        addToast('Bridge Uplink', 'No packets held by 4G bridge node', 'info');
      }
      await refresh();
    } catch (e) {
      addLog(`❌ Bridge upload failed: ${e.message}`, 'danger');
      addToast('Bridge Error', e.message, 'danger');
    } finally {
      setIsFlushing(false);
    }
  };

  // Reset Mesh
  const handleResetMesh = async () => {
    if (!window.confirm('Are you sure you want to clear all mesh packets and the idempotency cache?')) return;
    try {
      await fetch('/api/mesh/reset', { method: 'POST' });
      addLog('🗑 [RESET] Mesh packets dropped and atomic idempotency cache cleared.', 'warn');
      addToast('System Reset', 'Mesh and idempotency cache cleared', 'info');
      await refresh();
    } catch (e) {
      addToast('Reset Error', e.message, 'danger');
    }
  };

  // 1-Click End-to-End Simulation
  const handleRunAutomatedDemo = async () => {
    if (isAutoSimulating) return;
    setIsAutoSimulating(true);

    addToast('Auto-Pilot Started', 'Injecting payment in basement zone...', 'info');

    try {
      // 1. Inject
      await handleSendPacket({
        senderVpa: 'alice@demo',
        receiverVpa: 'bob@demo',
        amount: 500,
        pin: '1234',
        ttl: 5,
        startDevice: 'phone-alice',
      });
      await new Promise((r) => setTimeout(r, 1400));

      // 2. Gossip 1
      addToast('Gossip Hop 1', 'Packet hopping through basement peer devices...', 'info');
      await handleGossip();
      await new Promise((r) => setTimeout(r, 1400));

      // 3. Gossip 2
      addToast('Gossip Hop 2', 'Packet reaches phone-bridge...', 'info');
      await handleGossip();
      await new Promise((r) => setTimeout(r, 1400));

      // 4. Flush Bridges
      addToast('4G Cellular Uplink', 'Bridge node walks outside & uploads to backend...', 'info');
      await handleFlushBridges();
      await new Promise((r) => setTimeout(r, 1200));

      // 5. Test duplicate idempotency
      addLog('🧪 Proving Idempotency: Attempting second flush of duplicate packet...', 'warn');
      await handleFlushBridges();

      addToast('Simulation Complete', 'End-to-end zero-internet UPI payment verified!', 'success');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAutoSimulating(false);
    }
  };

  // Prefill helper
  const handlePrefillTransfer = (vpa) => {
    setSenderVpa(vpa);
    addToast('Sender Selected', `Active sender switched to ${vpa}`, 'info');
  };

  // Metrics calculations
  const settledList = transactions.filter((t) => t.status === 'SETTLED');
  const settledVolume = settledList.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalActivePackets = devices.reduce((sum, d) => sum + (d.packetCount || 0), 0);

  return (
    <>
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowKeyModal={handleShowKeyModal}
        onSync={refresh}
        isSyncing={isSyncing}
      />

      <main className="app-container">
        <HeroBanner
          onRunAutomatedDemo={handleRunAutomatedDemo}
          isAutoSimulating={isAutoSimulating}
        />

        {/* Tab Navigation */}
        <div className="view-nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
            id="tab-simulator-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            Interactive Mesh Simulator
          </button>

          <button
            className={`tab-btn ${activeTab === 'problem-solution' ? 'active' : ''}`}
            onClick={() => setActiveTab('problem-solution')}
            id="tab-problem-solution-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Protocol Architecture &amp; Security
          </button>

          <button
            className={`tab-btn ${activeTab === 'why-not-giants' ? 'active' : ''}`}
            onClick={() => setActiveTab('why-not-giants')}
            id="tab-why-not-giants-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Ecosystem &amp; Industry Analysis
          </button>
        </div>

        {/* Tab 1: Interactive Mesh Simulator */}
        {activeTab === 'simulator' && (
          <>
            <KpiMetrics
              settledVolume={settledVolume}
              settledCount={settledList.length}
              duplicateCount={transactions.length - settledList.length}
              activePackets={totalActivePackets}
              deviceCount={devices.length}
              idempotencyCount={idempotencyCount}
            />

            <ActionConsole
              onSendPacket={handleSendPacket}
              onGossip={handleGossip}
              onFlushBridges={handleFlushBridges}
              onResetMesh={handleResetMesh}
              isInjecting={isInjecting}
              isGossiping={isGossiping}
              isFlushing={isFlushing}
              senderVpa={senderVpa}
              setSenderVpa={setSenderVpa}
            />

            <div className="workspace-grid">
              <MeshTopology devices={devices} theme={theme} />
              <AccountsTable
                accounts={accounts}
                onPrefillTransfer={handlePrefillTransfer}
                idempotencyCount={idempotencyCount}
              />
            </div>

            <TransactionLedger transactions={transactions} />

            <ActivityTerminal logs={logs} onClearLogs={clearLogs} />
          </>
        )}

        {/* Tab 2: What Problem & How We Solved It */}
        {activeTab === 'problem-solution' && <ProblemSolutionTab />}

        {/* Tab 3: Why Big Tech Giants Haven't Built This */}
        {activeTab === 'why-not-giants' && <WhyNotGiantsTab />}
      </main>

      <KeyModal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        publicKey={serverPublicKey}
        onCopyKey={handleCopyKey}
      />



      <ToastContainer toasts={toasts} />
    </>
  );
}
