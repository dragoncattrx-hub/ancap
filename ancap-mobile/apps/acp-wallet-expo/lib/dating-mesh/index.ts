import {
  BLE_SERVICE_UUID,
  DEVICE_NAME_PREFIX,
  MAX_HOP,
  PacketType,
  advertisingName,
  decodePacket,
  encodePacket,
  makePeerId,
  relayCopy,
  shouldDrop,
  type MeshPacket,
} from "./protocol";

export type DiscoveredPeer = {
  id: string;
  name: string;
  rssi: number | null;
  lastSeen: number;
  via: "ble" | "sim" | "relay";
};

export type MeshChatLine = {
  id: string;
  fromPeerId: string;
  text: string;
  ts: number;
  hops: number;
};

type Listener = (line: MeshChatLine) => void;
type PeerListener = (peers: DiscoveredPeer[]) => void;

/**
 * In-process + optional BLE mesh node.
 * When react-native-ble-plx is unavailable (Expo Go), uses a local loopback
 * simulator so UI/dev still shows "ANCAP Dating" peers and multi-hop relay.
 */
export class DatingMeshNode {
  readonly peerId: string;
  private seen = new Set<string>();
  private peers = new Map<string, DiscoveredPeer>();
  private inbox: MeshChatLine[] = [];
  private chatListeners = new Set<Listener>();
  private peerListeners = new Set<PeerListener>();
  private ble: BleAdapter | null = null;
  private scanning = false;
  private advertising = false;
  private simTimer: ReturnType<typeof setInterval> | null = null;

  constructor(peerId?: string) {
    this.peerId = peerId ?? makePeerId();
  }

  getPeers(): DiscoveredPeer[] {
    return Array.from(this.peers.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  }

  getInbox(): MeshChatLine[] {
    return [...this.inbox];
  }

  onChat(fn: Listener): () => void {
    this.chatListeners.add(fn);
    return () => this.chatListeners.delete(fn);
  }

  onPeers(fn: PeerListener): () => void {
    this.peerListeners.add(fn);
    return () => this.peerListeners.delete(fn);
  }

  async start(): Promise<{ ble: boolean; advertisingName: string }> {
    const name = advertisingName(this.peerId);
    this.ble = await tryCreateBleAdapter();
    if (this.ble) {
      await this.ble.start({
        serviceUuid: BLE_SERVICE_UUID,
        localName: name,
        onPacket: (raw) => this.handleIngress(raw, "ble"),
        onPeer: (peer) => this.upsertPeer(peer),
      });
      this.advertising = true;
      this.scanning = true;
      return { ble: true, advertisingName: name };
    }
    this.startSimulator();
    this.advertising = true;
    this.scanning = true;
    return { ble: false, advertisingName: name };
  }

  async stop(): Promise<void> {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
    if (this.ble) {
      await this.ble.stop();
      this.ble = null;
    }
    this.scanning = false;
    this.advertising = false;
  }

  isActive(): boolean {
    return this.scanning || this.advertising;
  }

  /** Send chat; stores locally and floods with hop=0 / ttl=MAX_HOP. */
  sendChat(text: string, destPeerId: string | null = null): MeshPacket {
    const pkt: MeshPacket = {
      type: PacketType.Chat,
      msgId: makePeerId(),
      originPeerId: this.peerId,
      destPeerId,
      hop: 0,
      ttl: MAX_HOP,
      payload: text.slice(0, 500),
      ts: Date.now(),
    };
    this.deliverLocal(pkt);
    this.flood(pkt);
    return pkt;
  }

  /** Local rendezvous beacon for an access point (mesh-only). */
  beaconAccessPoint(title: string, lat: number, lon: number): MeshPacket {
    const pkt: MeshPacket = {
      type: PacketType.AccessPoint,
      msgId: makePeerId(),
      originPeerId: this.peerId,
      destPeerId: null,
      hop: 0,
      ttl: MAX_HOP,
      payload: JSON.stringify({ title, lat, lon }),
      ts: Date.now(),
    };
    this.flood(pkt);
    return pkt;
  }

  /** Inject a raw packet (tests / sim peer). */
  inject(raw: string): void {
    this.handleIngress(raw, "sim");
  }

  private startSimulator(): void {
    const simPeer = `sim-${this.peerId.slice(0, 4)}`;
    this.upsertPeer({
      id: simPeer,
      name: `${DEVICE_NAME_PREFIX} (sim)`,
      rssi: -62,
      lastSeen: Date.now(),
      via: "sim",
    });
    this.simTimer = setInterval(() => {
      this.upsertPeer({
        id: simPeer,
        name: `${DEVICE_NAME_PREFIX} (sim)`,
        rssi: -55 - Math.floor(Math.random() * 20),
        lastSeen: Date.now(),
        via: "sim",
      });
      const presence: MeshPacket = {
        type: PacketType.Presence,
        msgId: makePeerId(),
        originPeerId: simPeer,
        destPeerId: null,
        hop: 0,
        ttl: MAX_HOP,
        payload: "ping",
        ts: Date.now(),
      };
      this.handleIngress(encodePacket(presence), "sim");
    }, 8000);
  }

  private handleIngress(raw: string, via: DiscoveredPeer["via"]): void {
    const pkt = decodePacket(raw);
    if (!pkt) return;
    if (shouldDrop(pkt, this.seen)) return;
    this.seen.add(pkt.msgId);
    if (this.seen.size > 2000) {
      const first = this.seen.values().next().value;
      if (first) this.seen.delete(first);
    }

    this.upsertPeer({
      id: pkt.originPeerId,
      name: advertisingName(pkt.originPeerId),
      rssi: null,
      lastSeen: Date.now(),
      via,
    });

    if (pkt.type === PacketType.Chat || (pkt.type === PacketType.Relay && pkt.payload)) {
      if (!pkt.destPeerId || pkt.destPeerId === this.peerId) {
        this.deliverLocal(pkt);
      }
    }

    // Store-and-forward multi-hop
    if (pkt.hop + 1 < pkt.ttl && pkt.hop + 1 < MAX_HOP) {
      if (pkt.originPeerId !== this.peerId) {
        this.flood(relayCopy(pkt));
      }
    }
  }

  private deliverLocal(pkt: MeshPacket): void {
    if (pkt.type !== PacketType.Chat && pkt.type !== PacketType.Relay) return;
    if (!pkt.payload) return;
    const line: MeshChatLine = {
      id: pkt.msgId,
      fromPeerId: pkt.originPeerId,
      text: pkt.payload,
      ts: pkt.ts,
      hops: pkt.hop,
    };
    if (this.inbox.some((x) => x.id === line.id)) return;
    this.inbox.push(line);
    if (this.inbox.length > 200) this.inbox.shift();
    for (const fn of this.chatListeners) fn(line);
  }

  private flood(pkt: MeshPacket): void {
    const raw = encodePacket(pkt);
    if (this.ble) {
      void this.ble.broadcast(raw);
    }
    // Sim loopback: reflect to self as if a neighbor rebroadcast (hop+1) for MVP demos
    if (!this.ble && pkt.hop === 0 && pkt.type === PacketType.Chat) {
      const bounced = relayCopy(pkt);
      bounced.originPeerId = pkt.originPeerId;
      setTimeout(() => this.handleIngress(encodePacket(bounced), "relay"), 120);
    }
  }

  private upsertPeer(peer: DiscoveredPeer): void {
    this.peers.set(peer.id, peer);
    const snapshot = this.getPeers();
    for (const fn of this.peerListeners) fn(snapshot);
  }
}

type BleAdapter = {
  start(opts: {
    serviceUuid: string;
    localName: string;
    onPacket: (raw: string) => void;
    onPeer: (peer: DiscoveredPeer) => void;
  }): Promise<void>;
  stop(): Promise<void>;
  broadcast(raw: string): Promise<void>;
};

async function tryCreateBleAdapter(): Promise<BleAdapter | null> {
  try {
    // Optional native module — present on custom Android/iOS builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-ble-plx");
    if (!mod?.BleManager) return null;
    return createBlePlxAdapter(mod);
  } catch {
    return null;
  }
}

function createBlePlxAdapter(mod: { BleManager: new () => any }): BleAdapter {
  const manager = new mod.BleManager();
  let stopScan: (() => void) | null = null;
  const connected = new Map<string, any>();

  return {
    async start({ serviceUuid, localName, onPacket, onPeer }) {
      await new Promise<void>((resolve) => {
        const sub = manager.onStateChange((state: string) => {
          if (state === "PoweredOn") {
            sub.remove();
            resolve();
          }
        }, true);
      });

      // Scan for ANCAP Dating service
      manager.startDeviceScan([serviceUuid], { allowDuplicates: true }, (error: Error | null, device: any) => {
        if (error || !device) return;
        const name: string = device.localName || device.name || DEVICE_NAME_PREFIX;
        if (!String(name).startsWith(DEVICE_NAME_PREFIX) && device.serviceUUIDs?.indexOf?.(serviceUuid) < 0) {
          // still accept if UUID matches
        }
        onPeer({
          id: device.id,
          name: String(name).startsWith(DEVICE_NAME_PREFIX) ? name : `${DEVICE_NAME_PREFIX} ${String(name).slice(0, 8)}`,
          rssi: typeof device.rssi === "number" ? device.rssi : null,
          lastSeen: Date.now(),
          via: "ble",
        });
      });
      stopScan = () => manager.stopDeviceScan();

      // Peripheral advertise is limited on iOS; Android ble-plx uses companion modules.
      // We document advertise via scan response / manufacturer when available.
      void localName;
      void onPacket;
      void connected;
    },
    async stop() {
      stopScan?.();
      stopScan = null;
      manager.destroy();
    },
    async broadcast(_raw: string) {
      // Best-effort: write to connected peripherals in a future hardening pass.
      // Scan + presence already brands peers as ANCAP Dating.
    },
  };
}

export { BLE_SERVICE_UUID, DEVICE_NAME_PREFIX, MAX_HOP };
