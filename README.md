# ZeroNet UPI — Decentralized Offline Mesh Payments

A full-stack **Node.js + MongoDB + React** application that demonstrates **offline UPI payments routed through a Bluetooth-style mesh network**.

Imagine you are in a basement or disaster zone with zero cellular connectivity. You want to pay your friend ₹500. Your phone cryptographically seals and signs the payment, broadcasts it over short-range radio (simulated BLE mesh), and the encrypted packet hops device-to-device across strangers' phones until *one* device walks outside, catches 4G/Wi-Fi, and silently uploads it to the backend. The backend decrypts, verifies, deduplicates, and settles the funds.

This repository contains the **complete Node.js + Express backend**, the **MongoDB ledger & persistence layer**, an **in-memory mesh simulator**, and a **modern React Vite dashboard** that visualizes the entire lifecycle in real time.

---

## Table of Contents

1. [What This Demo Proves](#what-this-demo-proves)
2. [Tech Stack](#tech-stack)
3. [Architecture & Protocol Design](#architecture--protocol-design)
4. [The Three Hard Problems & Solutions](#the-three-hard-problems--solutions)
5. [Project Structure](#project-structure)
6. [How to Run Locally](#how-to-run-locally)
7. [Step-by-Step Demo Walkthrough](#step-by-step-demo-walkthrough)
8. [API Reference](#api-reference)
9. [Production vs Demo Comparison](#production-vs-demo-comparison)
10. [Honest Technical Limitations](#honest-technical-limitations)
11. [Troubleshooting](#troubleshooting)

---

## What This Demo Proves

1. **Zero-Trust Intermediaries**: Untrusted strangers can carry your financial transaction across hops without being able to inspect balances, view recipients, or tamper with the amount (guaranteed by **Hybrid RSA-OAEP + AES-256-GCM** encryption).
2. **Deterministic Idempotency**: When multiple bridge nodes holding the identical packet walk into network coverage at the exact same millisecond, the ledger settles **exactly once** using atomic ciphertext hash claiming (`SHA-256` digest cache).
3. **Replay & Tamper Resistance**: Packets with flipped bits fail GCM authentication immediately; expired or repeated packets are rejected before touching account balances.

---

## Tech Stack

- **Backend**: Node.js (ES Modules), Express.js
- **Database**: MongoDB with Mongoose (Atomic updates and ledger entries)
- **Cryptography**: Native Node.js `crypto` module (RSA-2048 with OAEP padding, AES-256-GCM authenticated encryption, SHA-256 digests)
- **Frontend**: React 18, Vite, Lucide Icons, Pure CSS Design System
- **Containerization**: Multi-stage `Dockerfile` (Node 20 Alpine)

---

## Architecture & Protocol Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SENDER PHONE (Offline)                          │
│  PaymentInstruction { sender, receiver, amount, pinHash, nonce, time }  │
│              │                                                          │
│              ▼ Encrypt with Server RSA Public Key (Hybrid AES-GCM)      │
│   MeshPacket { packetId, ttl, createdAt, ciphertext }                   │
└──────────────────────────────────────┬──────────────────────────────────┘
                                       │ Bluetooth Low Energy (Simulated)
                                       ▼
         ┌─────────┐  hop   ┌─────────┐  hop   ┌─────────┐
         │stranger1│ ─────▶ │stranger2│ ─────▶ │ bridge  │ ◀── Walks outside
         └─────────┘        └─────────┘        └────┬────┘     gets 4G
                                                    │
                                                    ▼ HTTPS POST
┌─────────────────────────────────────────────────────────────────────────┐
│                     NODE.JS BACKEND (Express + MongoDB)                 │
│                                                                         │
│  POST /api/bridge/ingest                                                │
│       │                                                                 │
│       ▼                                                                 │
│  [1] Hash ciphertext: SHA-256(packet.ciphertext)                        │
│       │                                                                 │
│       ▼                                                                 │
│  [2] Idempotency Gate (idempotencyService.claim)                        │
│       - Checks atomic in-memory Set/Cache (Redis SETNX equivalent).     │
│       - Duplicate delivery? Drops immediately with DUPLICATE_DROPPED.   │
│       │                                                                 │
│       ▼                                                                 │
│  [3] Hybrid Decryption (hybridCrypto.decrypt)                           │
│       - Unwraps 256-bit AES key using RSA Private Key (OAEP).           │
│       - Decrypts JSON payload using AES-256-GCM.                        │
│       - GCM tag verification: Any byte modification throws error.       │
│       │                                                                 │
│       ▼                                                                 │
│  [4] Freshness & Clock Skew Check                                       │
│       - Rejects packets older than TTL window (default: 24h).           │
│       - Rejects future-dated timestamps outside 5-minute skew.          │
│       │                                                                 │
│       ▼                                                                 │
│  [5] Atomic Settlement (settlementService.settle)                       │
│       - Checks balance >= amount.                                       │
│       - Atomically debits sender, credits receiver, writes Transaction. │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Three Hard Problems & Solutions

### 1. Untrusted Intermediaries
*Problem*: A stranger’s phone carries your raw payment payload. What prevents them from reading your balance or altering the recipient VPA?
*Solution*: **Hybrid Encryption (RSA-2048 + AES-256-GCM)**.
- The phone generates an ephemeral 256-bit AES key.
- It encrypts the payment JSON with AES-256-GCM (which produces ciphertext and an authentication tag).
- It encrypts only the AES key with the server’s RSA public key.
- Intermediate devices see only opaque Base64 ciphertext. If anyone flips a single bit, AES-GCM tag validation fails and the packet is rejected.

### 2. The Duplicate Delivery Storm
*Problem*: Multiple bridge devices carry the same gossip packet and connect to 4G simultaneously. If both hit `/api/bridge/ingest`, how do we prevent double-debiting?
*Solution*: **Atomic Ciphertext Hashing Gate**.
- The server computes `SHA-256(ciphertext)`.
- It executes an atomic `claim(hash)`. The first request claims the key; all subsequent concurrent or delayed requests are flagged as `DUPLICATE_DROPPED` without touching the ledger.
- *Why hash ciphertext instead of packetId?* Intermediaries could tamper with unauthenticated outer `packetId` headers, but the ciphertext is cryptographically bound to the payload.

### 3. Replay Attacks
*Problem*: An adversary captures a valid encrypted packet and re-broadcasts it weeks later.
*Solution*: **Payload Nonces + Timestamp Windows**.
- The encrypted payload includes a UUID `nonce` and a `signedAt` epoch timestamp.
- The server enforces `PACKET_MAX_AGE_SECONDS` (default: 24h).
- Legitimate identical payments have distinct nonces; identical packets are blocked by the idempotency gate.

---

## Project Structure

```
UPI_Without_Internet - JS/
├── backend/
│   ├── src/
│   │   ├── crypto/
│   │   │   ├── hybridCrypto.js          # RSA-OAEP + AES-256-GCM encrypt/decrypt
│   │   │   └── serverKeyHolder.js       # Generates & manages RSA-2048 keypair
│   │   ├── models/
│   │   │   ├── Account.js               # Mongoose schema for accounts & balances
│   │   │   └── Transaction.js           # Mongoose ledger with unique packetHash index
│   │   ├── routes/
│   │   │   └── api.js                   # Express REST router for demo & bridge APIs
│   │   ├── services/
│   │   │   ├── bridgeIngestionService.js# Pipeline: hash → claim → decrypt → verify → settle
│   │   │   ├── demoService.js           # Seeds demo accounts & simulates phone crypto
│   │   │   ├── idempotencyService.js    # In-memory atomic cache with eviction
│   │   │   ├── meshSimulatorService.js  # Gossip network simulation & virtual devices
│   │   │   └── settlementService.js     # Atomic balance debit/credit & ledger write
│   │   └── server.js                    # Express app entry point & MongoDB connection
│   ├── .env.example                     # Sample environment configuration
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AccountsTable.jsx        # Live account balances
│   │   │   ├── ActionConsole.jsx        # Trigger payments, gossip rounds, and flushes
│   │   │   ├── ActivityTerminal.jsx     # Live streaming transaction logs
│   │   │   ├── HeroBanner.jsx           # Status banner & system state
│   │   │   ├── KeyModal.jsx             # Cryptographic key inspection modal
│   │   │   ├── KpiMetrics.jsx           # Real-time statistics cards
│   │   │   ├── MeshTopology.jsx         # Visual representation of mesh network nodes
│   │   │   ├── Navbar.jsx               # Header & controls
│   │   │   ├── ProblemSolutionTab.jsx   # Architectural explanation tab
│   │   │   ├── TransactionLedger.jsx    # Historical transaction records
│   │   │   └── WhyNotGiantsTab.jsx      # Competitive comparison with GPay / UPI Lite
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                    # Design system tokens and styling
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── Dockerfile                           # Production multi-stage Docker build
├── .dockerignore
├── .gitignore
└── README.md
```

---

## How to Run Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **MongoDB**: A running MongoDB instance (Local community server or free MongoDB Atlas cluster)

---

### Step 1: Configure Backend Environment
Navigate to `backend/` and verify or create `.env`:

```bash
cd backend
```

Create `.env` if not already present:
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/upi_mesh
PACKET_MAX_AGE_SECONDS=86400
```

Install backend dependencies:
```bash
npm install
```

Start the backend:
```bash
npm run dev
```
*You will see:*
```
[Server] Connecting to MongoDB at mongodb://localhost:27017/upi_mesh …
[Server] MongoDB connected ✓
[Demo] Seeded 4 demo accounts
[Server] ZeroNet UPI backend running on http://localhost:8080
```

---

### Step 2: Start Frontend Dashboard
Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

*(Alternatively: run `npm run build` inside `frontend/`, and the backend server at `http://localhost:8080` will automatically serve the production build).*

---

### Running via Docker

You can build and run the entire stack in a single container:

```bash
# Build the Docker image
docker build -t zeronet-upi .

# Run container (connecting to MongoDB Atlas or host network)
docker run -p 8080:8080 -e MONGODB_URI="your-mongodb-connection-string" zeronet-upi
```

---

## Step-by-Step Demo Walkthrough

The web dashboard is designed for interactive demonstrations:

1. **Inspect Server Key**: Click **"Server Public Key"** in the top navigation bar to view the live RSA-2048 public key used by devices.
2. **Step 1: Compose & Inject**: Select `alice@demo` as sender, `bob@demo` as receiver, enter an amount (e.g. `₹500`), and click **"📤 Inject into Mesh"**.
   - Notice that `phone-alice` now holds 1 packet.
3. **Step 2: Gossip Round**: Click **"🔄 Run Gossip Round"**.
   - Notice the packet propagating across `phone-stranger1`, `phone-stranger2`, and `phone-bridge`.
4. **Step 3: Bridge Upload**: Click **"📡 Bridges Upload to Backend"**.
   - `phone-bridge` connects to 4G and submits the packet to `/api/bridge/ingest`.
   - The ledger settles: Alice's balance drops by ₹500, Bob's balance increases by ₹500, and a new transaction appears on the ledger.
5. **Step 4: Verify Idempotency**: Click **"📡 Bridges Upload to Backend"** again.
   - The system recognizes the identical ciphertext hash and outputs `DUPLICATE_DROPPED`. No double debit occurs.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/server-key` | Returns the server's RSA public key (Base64) |
| `GET` | `/api/accounts` | Returns all demo accounts and current balances |
| `GET` | `/api/transactions` | Returns the last 20 settled transactions |
| `GET` | `/api/mesh/state` | Returns the status of all virtual devices and packet counts |
| `POST` | `/api/demo/send` | Simulates a sender device encrypting and injecting a packet |
| `POST` | `/api/mesh/gossip` | Executes one gossip propagation round between devices |
| `POST` | `/api/mesh/flush` | Simulates bridge nodes reaching 4G and uploading packets |
| `POST` | `/api/mesh/reset` | Resets virtual mesh device states and idempotency cache |
| `POST` | `/api/bridge/ingest` | **Production Endpoint**: Ingests, decrypts, and settles packets |
| `POST` | `/api/demo/reset-db` | Clears and re-seeds the 4 demo accounts in MongoDB |

---

## Production vs Demo Comparison

| Component | In This Implementation | Production Implementation |
|---|---|---|
| **Database** | MongoDB with Mongoose | MongoDB Atlas Replica Set / PostgreSQL |
| **Idempotency** | In-memory atomic cache with TTL eviction | Distributed Redis cluster with `SETNX` |
| **Key Storage** | Ephemeral RSA keypair initialized on boot | Hardware Security Module (HSM) / AWS KMS |
| **Mesh Transport** | Software-simulated in-process virtual devices | Native Bluetooth Low Energy (BLE GATT) & Wi-Fi Aware |
| **Ledger Settlement** | Internal bank balance collection | NPCI / Core Banking System (CBS) integration |
| **Device Authentication** | Simulated device IDs | Signed device attestation & client certificates |

---

## Honest Technical Limitations

To understand the boundaries of offline store-and-forward mesh payments:

1. **Deferred Settlement (IOU)**: When a sender generates an offline packet, the receiver receives an cryptographic promise. Until a bridge node uploads the packet, the receiver cannot guarantee the sender had sufficient funds at the time of creation. (*This is why production offline UPI systems like UPI Lite use pre-funded on-device hardware wallets*).
2. **Offline Double-Spending**: A malicious user disconnected from the internet could theoretically sign two payments to two different offline merchants using the same balance. Whichever packet reaches a bridge first will settle; the second will be rejected with `insufficient_balance`.
3. **Mobile OS Background Constraints**: Modern iOS and Android operating systems aggressively limit background BLE scanning and peripheral advertising to preserve battery life.

---

## Troubleshooting

- **MongoDB connection refused**: Ensure your local MongoDB service is running (`mongod` or `net start MongoDB`), or set `MONGODB_URI` in `backend/.env` to a MongoDB Atlas cluster URI.
- **Port 8080 already in use**: Change the `PORT` in `backend/.env`.
- **CORS issues**: When running the frontend through Vite dev server (`localhost:5173`), API calls are automatically proxied to `http://localhost:8080`.

---

## License

MIT License. Created for learning, demonstration, and architectural research.
