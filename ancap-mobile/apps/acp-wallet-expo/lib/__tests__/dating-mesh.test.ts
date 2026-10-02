import { describe, expect, it } from "vitest";
import {
  MAX_HOP,
  PacketType,
  decodePacket,
  encodePacket,
  makePeerId,
  relayCopy,
  shouldDrop,
} from "../dating-mesh/protocol";
import { DatingMeshNode } from "../dating-mesh";

describe("dating mesh protocol", () => {
  it("encodes and decodes packets", () => {
    const pkt = {
      type: PacketType.Chat,
      msgId: makePeerId(),
      originPeerId: makePeerId(),
      destPeerId: null,
      hop: 0,
      ttl: MAX_HOP,
      payload: "hello",
      ts: Date.now(),
    };
    const round = decodePacket(encodePacket(pkt));
    expect(round?.payload).toBe("hello");
  });

  it("drops seen and over-hop packets", () => {
    const seen = new Set<string>();
    const pkt = {
      type: PacketType.Chat,
      msgId: "abc",
      originPeerId: "a",
      destPeerId: null,
      hop: 0,
      ttl: MAX_HOP,
      payload: "x",
      ts: 1,
    };
    expect(shouldDrop(pkt, seen)).toBe(false);
    seen.add("abc");
    expect(shouldDrop(pkt, seen)).toBe(true);
    expect(shouldDrop({ ...pkt, msgId: "z", hop: MAX_HOP }, new Set())).toBe(true);
  });

  it("increments hop on relay", () => {
    const r = relayCopy({
      type: PacketType.Chat,
      msgId: "1",
      originPeerId: "a",
      destPeerId: null,
      hop: 1,
      ttl: 5,
      payload: "m",
      ts: 1,
    });
    expect(r.hop).toBe(2);
    expect(r.type).toBe(PacketType.Relay);
  });
});

describe("DatingMeshNode multi-hop", () => {
  it("delivers chat and relays within hop limit", async () => {
    const a = new DatingMeshNode("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const b = new DatingMeshNode("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    await a.start();
    await b.start();

    const lines: string[] = [];
    b.onChat((line) => lines.push(line.text));

    const pkt = a.sendChat("mesh-hi");
    // Manual inject into B as if overheard + one relay hop
    b.inject(encodePacket({ ...pkt, hop: 1, type: PacketType.Relay }));

    expect(lines).toContain("mesh-hi");
    await a.stop();
    await b.stop();
  });
});
