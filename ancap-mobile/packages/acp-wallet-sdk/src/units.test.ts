import { describe, expect, it } from "vitest";
import { formatUnits, parseUnits } from "./units.js";

describe("parseUnits / formatUnits", () => {
  it("parses 1 ACP to 1e8 units", () => {
    expect(parseUnits("1")).toBe(100_000_000n);
  });

  it("formats 1e8 units to 1 ACP", () => {
    expect(formatUnits(100_000_000n)).toBe("1");
  });

  it("round-trips fractional ACP", () => {
    const u = parseUnits("0.00000001");
    expect(formatUnits(u)).toBe("0.00000001");
  });
});
