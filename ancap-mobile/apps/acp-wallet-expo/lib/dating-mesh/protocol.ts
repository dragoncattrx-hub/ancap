/** ANCAP Dating mesh protocol constants (bitchat-inspired, ANCAP-branded). */

export const BLE_SERVICE_UUID = "a11c0001-a11c-4a7e-9c01-444154494e47";
export const BLE_CHAR_UUID = "a11c0002-a11c-4a7e-9c01-444154494e47";
export const DEVICE_NAME_PREFIX = "ANCAP Dating";
export const MAX_HOP = 5;

export const PacketType = {
  Presence: 0x01,
  Chat: 0x02,
  Relay: 0x03,
  AccessPoint: 0x04,
} as const;

export type PacketTypeId = (typeof PacketType)[keyof typeof PacketType];

export type MeshPacket = {
  type: PacketTypeId;
  msgId: string;
  originPeerId: string;
  destPeerId: string | null;
  hop: number;
  ttl: number;
  payload: string;
  ts: number;
};

export function makePeerId(): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function advertisingName(shortPeer?: string): string {
  const suffix = shortPeer ? ` ${shortPeer.slice(0, 6)}` : "";
  return `${DEVICE_NAME_PREFIX}${suffix}`.slice(0, 29);
}

export function encodePacket(pkt: MeshPacket): string {
  return JSON.stringify(pkt);
}

export function decodePacket(raw: string): MeshPacket | null {
  try {
    const o = JSON.parse(raw) as MeshPacket;
    if (!o || typeof o.msgId !== "string" || typeof o.originPeerId !== "string") return null;
    if (typeof o.hop !== "number" || typeof o.ttl !== "number") return null;
    return o;
  } catch {
    return null;
  }
}

export function shouldDrop(pkt: MeshPacket, seen: Set<string>): boolean {
  if (pkt.hop >= pkt.ttl || pkt.hop >= MAX_HOP) return true;
  if (seen.has(pkt.msgId)) return true;
  return false;
}

export function relayCopy(pkt: MeshPacket): MeshPacket {
  return { ...pkt, type: PacketType.Relay, hop: pkt.hop + 1 };
}
