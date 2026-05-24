import { describe, expect, it } from "vitest";
import { formatUnits, parseUnits } from "./units.js";
import { validateAcpAddress, assertAcpAddress } from "./address.js";

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

  it("parses zero", () => {
    expect(parseUnits("0")).toBe(0n);
    expect(formatUnits(0n)).toBe("0");
  });

  it("parses whole number amounts", () => {
    expect(parseUnits("10")).toBe(1_000_000_000n);
    expect(formatUnits(1_000_000_000n)).toBe("10");
  });

  it("parses large amounts", () => {
    expect(parseUnits("1000000")).toBe(100_000_000_000_000n);
  });

  it("rejects negative amounts", () => {
    expect(() => parseUnits("-1")).toThrow("must be non-negative");
  });

  it("rejects empty amounts", () => {
    expect(() => parseUnits("")).toThrow("amount is empty");
    expect(() => parseUnits("   ")).toThrow("amount is empty");
  });

  it("trims whitespace", () => {
    expect(parseUnits("  42  ")).toBe(4_200_000_000n);
  });

  it("handles amounts with only fractional part", () => {
    expect(formatUnits(1n)).toBe("0.00000001");
    expect(formatUnits(99n)).toBe("0.00000099");
  });

  it("round-trips a realistic transaction amount", () => {
    const original = "1.23456789";
    const units = parseUnits(original);
    expect(formatUnits(units)).toBe(original);
  });

  it("parses with custom decimals", () => {
    expect(parseUnits("1.5", 6)).toBe(1_500_000n);
    expect(formatUnits(1_500_000n, 6)).toBe("1.5");
  });
});

describe("validateAcpAddress / assertAcpAddress", () => {
  it("accepts valid ACP addresses", () => {
    expect(validateAcpAddress("acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9")).toBe(true);
    expect(validateAcpAddress("acp1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqnpz")).toBe(true);
  });

  it("rejects non-acp1 addresses", () => {
    expect(validateAcpAddress("0x1234")).toBe(false);
    expect(validateAcpAddress("")).toBe(false);
    expect(validateAcpAddress("bch1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9")).toBe(false);
  });

  it("assertAcpAddress throws on invalid input", () => {
    expect(() => assertAcpAddress("")).toThrow("invalid");
    expect(() => assertAcpAddress("0x1234")).toThrow("invalid");
    expect(() => assertAcpAddress("not-an-address", "to")).toThrow("to is invalid");
  });

  it("assertAcpAddress returns trimmed address on valid input", () => {
    expect(assertAcpAddress("  acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9  ")).toBe("acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9");
  });
});
