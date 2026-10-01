/**
 * meshSimulatorService.js
 *
 * Software simulation of a Bluetooth mesh network.
 *
 * Each VirtualDevice represents a phone. A "gossip round" picks every pair
 * of devices (all assumed nearby for the demo) and copies packets between them,
 * decrementing TTL per hop.
 *
 * Bridge nodes have hasInternet=true. When flush() is called (simulating "a phone
 * walks outside and gets 4G"), everything held by bridge nodes is returned for
 * upload to /api/bridge/ingest.
 *
 * Direct port of Java MeshSimulatorService + VirtualDevice.
 */

class VirtualDevice {
  constructor(deviceId, hasInternet) {
    this.deviceId = deviceId;
    this.hasInternet = hasInternet;
    /** @type {Map<string, object>} packetId → MeshPacket */
    this._packets = new Map();
  }

  hold(packet) {
    // putIfAbsent — first writer wins, no duplicate storage
    if (!this._packets.has(packet.packetId)) {
      this._packets.set(packet.packetId, { ...packet });
    }
  }

  holds(packetId) {
    return this._packets.has(packetId);
  }

  getHeldPackets() {
    return [...this._packets.values()];
  }

  packetCount() {
    return this._packets.size;
  }

  clear() {
    this._packets.clear();
  }
}

// ── State ─────────────────────────────────────────────────────────────────────

/** @type {Map<string, VirtualDevice>} */
const devices = new Map();

function seedDefaultDevices() {
  devices.clear();
  devices.set('phone-alice',     new VirtualDevice('phone-alice',     false));
  devices.set('phone-stranger1', new VirtualDevice('phone-stranger1', false));
  devices.set('phone-stranger2', new VirtualDevice('phone-stranger2', false));
  devices.set('phone-stranger3', new VirtualDevice('phone-stranger3', false));
  devices.set('phone-bridge',    new VirtualDevice('phone-bridge',    true));
}

seedDefaultDevices();

// ── Public API ────────────────────────────────────────────────────────────────

export function getDevices() {
  return [...devices.values()];
}

export function getDevice(id) {
  return devices.get(id);
}

/**
 * Sender drops a packet into the mesh at their own device.
 * @param {string} senderDeviceId
 * @param {object} packet - MeshPacket
 */
export function inject(senderDeviceId, packet) {
  const sender = devices.get(senderDeviceId);
  if (!sender) throw new Error(`Unknown device: ${senderDeviceId}`);
  sender.hold(packet);
  console.log(`[Mesh] Packet ${packet.packetId.substring(0, 8)} injected at ${senderDeviceId} (TTL=${packet.ttl})`);
}

/**
 * One gossip round — every device shares all its packets with every other device.
 * TTL is decremented per hop; packets at TTL≤0 are not forwarded.
 *
 * @returns {{ transfers: number, deviceCounts: object }}
 */
export function gossipOnce() {
  let transfers = 0;
  const deviceList = [...devices.values()];

  // Snapshot: what each device holds at the START of this round
  const snapshot = new Map();
  for (const d of deviceList) {
    snapshot.set(d.deviceId, d.getHeldPackets());
  }

  for (const src of deviceList) {
    for (const pkt of snapshot.get(src.deviceId)) {
      if (pkt.ttl <= 0) continue;
      for (const dst of deviceList) {
        if (dst === src) continue;
        if (dst.holds(pkt.packetId)) continue;
        dst.hold({ ...pkt, ttl: pkt.ttl - 1 });
        transfers++;
      }
    }
  }

  console.log(`[Mesh] Gossip round complete: ${transfers} packet transfers`);
  return { transfers, deviceCounts: snapshotMap() };
}

export function snapshotMap() {
  const m = {};
  for (const d of devices.values()) {
    m[d.deviceId] = d.packetCount();
  }
  return m;
}

/**
 * Returns all packets held by internet-connected bridge devices.
 * These are what gets uploaded when a bridge phone reaches 4G.
 * @returns {{ bridgeNodeId: string, packet: object }[]}
 */
export function collectBridgeUploads() {
  const uploads = [];
  for (const d of devices.values()) {
    if (!d.hasInternet) continue;
    for (const pkt of d.getHeldPackets()) {
      uploads.push({ bridgeNodeId: d.deviceId, packet: pkt });
    }
  }
  return uploads;
}

export function resetMesh() {
  for (const d of devices.values()) d.clear();
}
