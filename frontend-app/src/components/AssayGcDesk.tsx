"use client";

import { useEffect, useState, type FormEvent } from "react";
import { walletAcp } from "@/lib/api";

type Peak = {
  label: string;
  retention_or_energy: string;
  area_pct: string;
};

type AnalyzeResult = {
  mode: string;
  sample_id: string;
  device_id?: string | null;
  asset_label: string;
  quantity: string;
  quantity_unit: string;
  purity_pct: string;
  purity_ppt?: number | null;
  composition: Array<{ label: string; area_pct: string; role: string; value_weight: string }>;
  indicative_acp_amount: string;
  rate_note: string;
  confidence: string;
  flags: string[];
  next_step: string;
  disclaimer: string;
};

type Props = {
  defaultQuantity?: string;
};

export function AssayGcDesk({ defaultQuantity = "10" }: Props) {
  const [mode, setMode] = useState<"metal_xrf_proxy" | "gas_chromatograph">("metal_xrf_proxy");
  const [metal, setMetal] = useState("gold");
  const [commodity, setCommodity] = useState("natural_gas");
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [declaredPurity, setDeclaredPurity] = useState("999");
  const [simulate, setSimulate] = useState(true);
  const [peaksText, setPeaksText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [disclaimer, setDisclaimer] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const cat = (await walletAcp.assayGcCatalog()) as { disclaimer?: string };
        if (cat?.disclaimer) setDisclaimer(cat.disclaimer);
      } catch {
        /* catalog optional for UI */
      }
    })();
  }, []);

  function parsePeaks(raw: string): Peak[] | undefined {
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return undefined;
    const peaks: Peak[] = [];
    for (const line of lines) {
      // label | retention | area%
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length < 3) {
        throw new Error(`Bad peak line (need label|retention|area%): ${line}`);
      }
      peaks.push({
        label: parts[0],
        retention_or_energy: parts[1],
        area_pct: parts[2],
      });
    }
    return peaks;
  }

  async function onAnalyze(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const peaks = simulate ? undefined : parsePeaks(peaksText);
      const body: Record<string, unknown> = {
        mode,
        quantity: quantity.trim(),
        simulate,
      };
      if (mode === "metal_xrf_proxy") {
        body.metal = metal;
        if (simulate) body.declared_purity_ppt = Number(declaredPurity) || 999;
      } else {
        body.commodity = commodity;
      }
      if (peaks) body.peaks = peaks;
      const res = (await walletAcp.assayGcAnalyze(body)) as AnalyzeResult;
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assay failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" id="assay-gc">
      <div className="card-header">
        <h3 style={{ fontWeight: 800, margin: 0 }}>GC / XRF purity assay</h3>
        <span className="badge badge-info">Prototype</span>
      </div>
      <p style={{ marginTop: 10, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
        Gas-chromatography / XRF-style peak analysis for metal or gas purity → indicative ACP value before OTC
        intake.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setMode("metal_xrf_proxy")}
          style={{
            borderColor: mode === "metal_xrf_proxy" ? "rgba(16,185,129,0.5)" : undefined,
            color: mode === "metal_xrf_proxy" ? "#34d399" : undefined,
          }}
        >
          Metal XRF proxy
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setMode("gas_chromatograph")}
          style={{
            borderColor: mode === "gas_chromatograph" ? "rgba(16,185,129,0.5)" : undefined,
            color: mode === "gas_chromatograph" ? "#34d399" : undefined,
          }}
        >
          Gas chromatograph
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={onAnalyze} style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {mode === "metal_xrf_proxy" ? (
          <>
            <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Metal</label>
            <select
              className="input input-bordered w-full"
              value={metal}
              onChange={(e) => setMetal(e.target.value)}
            >
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="platinum">Platinum</option>
              <option value="palladium">Palladium</option>
            </select>
            <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Mass (g)</label>
            <input
              className="input input-bordered w-full"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            {simulate ? (
              <>
                <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Declared purity (‰) for simulation
                </label>
                <input
                  className="input input-bordered w-full"
                  inputMode="numeric"
                  value={declaredPurity}
                  onChange={(e) => setDeclaredPurity(e.target.value)}
                />
              </>
            ) : null}
          </>
        ) : (
          <>
            <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Stream</label>
            <select
              className="input input-bordered w-full"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
            >
              <option value="natural_gas">Natural gas</option>
              <option value="oil">Light oil / condensate proxy</option>
            </select>
            <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Quantity ({commodity === "oil" ? "bbl" : "m³"})
            </label>
            <input
              className="input input-bordered w-full"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: "0.9rem" }}>
          <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} />
          Simulate device chromatogram / spectrum
        </label>

        {!simulate ? (
          <>
            <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Peaks (one per line: label | retention_or_keV | area%)
            </label>
            <textarea
              className="input input-bordered w-full"
              rows={5}
              value={peaksText}
              onChange={(e) => setPeaksText(e.target.value)}
              placeholder={
                mode === "metal_xrf_proxy"
                  ? "Gold | 9.71 keV | 99.2\nCopper | 8.04 keV | 0.6\nIron | 6.40 keV | 0.2"
                  : "Methane | 0.95 min | 91.5\nEthane | 1.55 min | 4.2\nH2S | 1.10 min | 0.3"
              }
              required={!simulate}
            />
          </>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Analyzing…" : "Run assay"}
        </button>
      </form>

      {result ? (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 10,
            background: "rgba(15,23,42,0.45)",
            border: "1px solid rgba(148,163,184,0.2)",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 800, color: "#6ee7b7" }}>
            {result.asset_label} · purity {result.purity_pct}%
            {result.purity_ppt != null ? ` (${result.purity_ppt}‰)` : ""}
          </div>
          <div>
            Indicative value: <strong>{result.indicative_acp_amount} ACP</strong> for {result.quantity}{" "}
            {result.quantity_unit}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{result.rate_note}</div>
          <div style={{ fontSize: "0.85rem" }}>
            Sample <code>{result.sample_id}</code> · device <code>{result.device_id}</code> · confidence{" "}
            {result.confidence}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "4px 6px" }}>Component</th>
                  <th style={{ padding: "4px 6px" }}>Area %</th>
                  <th style={{ padding: "4px 6px" }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {result.composition.map((c) => (
                  <tr key={`${c.label}-${c.area_pct}`}>
                    <td style={{ padding: "4px 6px" }}>{c.label}</td>
                    <td style={{ padding: "4px 6px" }}>{c.area_pct}</td>
                    <td style={{ padding: "4px 6px" }}>{c.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.flags?.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#fbbf24", fontSize: "0.85rem" }}>
              {result.flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : null}
          <div style={{ fontSize: "0.85rem" }}>{result.next_step}</div>
        </div>
      ) : null}

      <p style={{ marginTop: 14, color: "var(--text-muted)", fontSize: "0.75rem", lineHeight: 1.5 }}>
        {disclaimer ||
          "Prototype only — not a certified lab assay. OTC settlement still requires supervised review."}
      </p>
    </div>
  );
}
