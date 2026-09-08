"use client";

import { useEffect, useState, type FormEvent } from "react";
import { walletAcp } from "@/lib/api";

type OtcCatalog = {
  metals: Array<{ kind: string; label: string; indicative_acp_per_gram: string; note: string }>;
  goods: Array<{ category: string; label: string; note: string }>;
  handoff_instructions: string;
  compliance_note: string;
};

type OtcOrder = {
  id: string;
  rail: "metal" | "goods";
  status: string;
  asset_label: string;
  estimated_acp_amount: string;
  payout_acp_address: string;
  intake_reference: string;
  handoff_instructions: string;
  proof_ref?: string | null;
  note?: string | null;
};

type Props = {
  defaultPayoutAddress?: string;
};

export function OtcIntakeDesk({ defaultPayoutAddress = "" }: Props) {
  const [tab, setTab] = useState<"metal" | "goods">("metal");
  const [catalog, setCatalog] = useState<OtcCatalog | null>(null);
  const [orders, setOrders] = useState<OtcOrder[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [quote, setQuote] = useState<{ estimated_acp_amount: string; rate_note: string } | null>(null);

  const [metalForm, setMetalForm] = useState({
    metal: "gold",
    weight_grams: "10",
    purity_ppt: "999",
    payout_acp_address: defaultPayoutAddress,
    note: "",
  });
  const [goodsForm, setGoodsForm] = useState({
    goods_category: "electronics",
    goods_title: "",
    goods_description: "",
    estimated_value_acp: "1000",
    payout_acp_address: defaultPayoutAddress,
    note: "",
  });
  const [proofRef, setProofRef] = useState("");

  useEffect(() => {
    if (defaultPayoutAddress) {
      setMetalForm((p) => ({ ...p, payout_acp_address: p.payout_acp_address || defaultPayoutAddress }));
      setGoodsForm((p) => ({ ...p, payout_acp_address: p.payout_acp_address || defaultPayoutAddress }));
    }
  }, [defaultPayoutAddress]);

  useEffect(() => {
    void (async () => {
      try {
        const [cat, list] = await Promise.all([
          walletAcp.otcCatalog() as Promise<OtcCatalog>,
          walletAcp.listOtcOrders() as Promise<OtcOrder[]>,
        ]);
        setCatalog(cat);
        setOrders(Array.isArray(list) ? list : []);
        if (list?.[0]?.id) setSelectedId(list[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load OTC desk");
      }
    })();
  }, []);

  const selected = orders.find((o) => o.id === selectedId) || orders[0] || null;

  async function refreshOrders() {
    const list = (await walletAcp.listOtcOrders()) as OtcOrder[];
    setOrders(Array.isArray(list) ? list : []);
  }

  async function previewQuote() {
    setBusy(true);
    setError("");
    try {
      const q =
        tab === "metal"
          ? ((await walletAcp.otcQuoteMetal({
              metal: metalForm.metal,
              weight_grams: metalForm.weight_grams,
              purity_ppt: Number(metalForm.purity_ppt) || 999,
            })) as { estimated_acp_amount: string; rate_note: string })
          : ((await walletAcp.otcQuoteGoods({
              category: goodsForm.goods_category,
              estimated_value_acp: goodsForm.estimated_value_acp,
            })) as { estimated_acp_amount: string; rate_note: string });
      setQuote(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote failed");
    } finally {
      setBusy(false);
    }
  }

  async function createOrder(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const created =
        tab === "metal"
          ? ((await walletAcp.createOtcOrder({
              rail: "metal",
              metal: metalForm.metal,
              weight_grams: metalForm.weight_grams,
              purity_ppt: Number(metalForm.purity_ppt) || 999,
              payout_acp_address: metalForm.payout_acp_address.trim(),
              note: metalForm.note || undefined,
            })) as OtcOrder)
          : ((await walletAcp.createOtcOrder({
              rail: "goods",
              goods_category: goodsForm.goods_category,
              goods_title: goodsForm.goods_title.trim(),
              goods_description: goodsForm.goods_description.trim() || undefined,
              estimated_value_acp: goodsForm.estimated_value_acp,
              payout_acp_address: goodsForm.payout_acp_address.trim(),
              note: goodsForm.note || undefined,
            })) as OtcOrder);
      setInfo(`OTC order created · ref ${created.intake_reference}`);
      setSelectedId(created.id);
      await refreshOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create OTC order failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSelected() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await walletAcp.confirmOtcOrder(selected.id, {
        proof_ref: proofRef.trim() || undefined,
      });
      setInfo("Marked for desk review.");
      setProofRef("");
      await refreshOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirm failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancelSelected() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await walletAcp.cancelOtcOrder(selected.id);
      setInfo("Order cancelled.");
      await refreshOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="responsive-grid responsive-grid-2" id="otc-intake">
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontWeight: 800, margin: 0 }}>Metals & goods desk</h3>
          <span className="badge badge-info">OTC → ACP</span>
        </div>
        <p style={{ marginTop: 10, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          Accept precious metals or physical goods for ACP settlement after supervised intake and review.
        </p>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setTab("metal");
              setQuote(null);
            }}
            style={{
              borderColor: tab === "metal" ? "rgba(16,185,129,0.5)" : undefined,
              color: tab === "metal" ? "#34d399" : undefined,
            }}
          >
            Precious metals
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setTab("goods");
              setQuote(null);
            }}
            style={{
              borderColor: tab === "goods" ? "rgba(16,185,129,0.5)" : undefined,
              color: tab === "goods" ? "#34d399" : undefined,
            }}
          >
            Goods exchange
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "0.9rem" }}>
            {info}
          </div>
        )}

        <form onSubmit={createOrder} style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {tab === "metal" ? (
            <>
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Metal</label>
              <select
                className="input input-bordered w-full"
                value={metalForm.metal}
                onChange={(e) => setMetalForm((p) => ({ ...p, metal: e.target.value }))}
              >
                {(catalog?.metals || [
                  { kind: "gold", label: "Gold (Au)" },
                  { kind: "silver", label: "Silver (Ag)" },
                  { kind: "platinum", label: "Platinum (Pt)" },
                  { kind: "palladium", label: "Palladium (Pd)" },
                ]).map((m) => (
                  <option key={m.kind} value={m.kind}>
                    {m.label}
                    {"indicative_acp_per_gram" in m && m.indicative_acp_per_gram
                      ? ` · ~${m.indicative_acp_per_gram} ACP/g`
                      : ""}
                  </option>
                ))}
              </select>
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Weight (grams)</label>
              <input
                className="input input-bordered w-full"
                inputMode="decimal"
                value={metalForm.weight_grams}
                onChange={(e) => setMetalForm((p) => ({ ...p, weight_grams: e.target.value }))}
                required
              />
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Purity (‰)</label>
              <input
                className="input input-bordered w-full"
                inputMode="numeric"
                value={metalForm.purity_ppt}
                onChange={(e) => setMetalForm((p) => ({ ...p, purity_ppt: e.target.value }))}
                required
              />
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Payout ACP address</label>
              <input
                className="input input-bordered w-full"
                value={metalForm.payout_acp_address}
                onChange={(e) => setMetalForm((p) => ({ ...p, payout_acp_address: e.target.value.trim() }))}
                required
              />
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Note (optional)</label>
              <input
                className="input input-bordered w-full"
                value={metalForm.note}
                onChange={(e) => setMetalForm((p) => ({ ...p, note: e.target.value }))}
              />
            </>
          ) : (
            <>
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Category</label>
              <select
                className="input input-bordered w-full"
                value={goodsForm.goods_category}
                onChange={(e) => setGoodsForm((p) => ({ ...p, goods_category: e.target.value }))}
              >
                {(catalog?.goods || [
                  { category: "electronics", label: "Electronics" },
                  { category: "jewelry", label: "Jewelry / watches" },
                  { category: "collectibles", label: "Collectibles" },
                  { category: "industrial", label: "Industrial materials" },
                  { category: "other", label: "Other goods" },
                ]).map((g) => (
                  <option key={g.category} value={g.category}>
                    {g.label}
                  </option>
                ))}
              </select>
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Title</label>
              <input
                className="input input-bordered w-full"
                value={goodsForm.goods_title}
                onChange={(e) => setGoodsForm((p) => ({ ...p, goods_title: e.target.value }))}
                placeholder="e.g. Sealed GPU lot / vintage watch"
                required
              />
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Description</label>
              <textarea
                className="input input-bordered w-full"
                rows={3}
                value={goodsForm.goods_description}
                onChange={(e) => setGoodsForm((p) => ({ ...p, goods_description: e.target.value }))}
                placeholder="Condition, serials, location…"
              />
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Estimated ACP value</label>
              <input
                className="input input-bordered w-full"
                inputMode="decimal"
                value={goodsForm.estimated_value_acp}
                onChange={(e) => setGoodsForm((p) => ({ ...p, estimated_value_acp: e.target.value }))}
                required
              />
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Payout ACP address</label>
              <input
                className="input input-bordered w-full"
                value={goodsForm.payout_acp_address}
                onChange={(e) => setGoodsForm((p) => ({ ...p, payout_acp_address: e.target.value.trim() }))}
                required
              />
              <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Note (optional)</label>
              <input
                className="input input-bordered w-full"
                value={goodsForm.note}
                onChange={(e) => setGoodsForm((p) => ({ ...p, note: e.target.value }))}
              />
            </>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost" onClick={() => void previewQuote()} disabled={busy}>
              Preview quote
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Creating…" : "Create intake order"}
            </button>
          </div>
        </form>

        {quote && (
          <div
            style={{
              marginTop: 12,
              color: "var(--text-muted)",
              lineHeight: 1.7,
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 10,
              background: "var(--bg)",
            }}
          >
            <div>{quote.rate_note}</div>
            <div>
              Estimated payout: <strong style={{ color: "var(--text)" }}>{quote.estimated_acp_amount} ACP</strong>
            </div>
          </div>
        )}

        {catalog && (
          <div style={{ marginTop: 14, padding: 10, border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
            <div>{catalog.handoff_instructions}</div>
            <div style={{ marginTop: 8 }}>{catalog.compliance_note}</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ fontWeight: 800, margin: 0 }}>OTC intake orders</h3>
          <span className="badge badge-active">History</span>
        </div>

        {orders.length === 0 ? (
          <div style={{ marginTop: 12, color: "var(--text-muted)" }}>No metals/goods orders yet.</div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {orders.map((o) => (
              <button
                key={o.id}
                type="button"
                className="btn btn-ghost"
                style={{ justifyContent: "space-between" }}
                onClick={() => setSelectedId(o.id)}
              >
                <span>
                  [{o.rail}] {o.asset_label} → {o.estimated_acp_amount} ACP
                </span>
                <span>{o.status}</span>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              display: "grid",
              gap: 8,
            }}
          >
            <div>
              <strong>Order:</strong> {selected.id}
            </div>
            <div>
              <strong>Status:</strong> {selected.status}
            </div>
            <div>
              <strong>Asset:</strong> {selected.asset_label}
            </div>
            <div>
              <strong>Reference:</strong> {selected.intake_reference}
            </div>
            <div>
              <strong>Payout:</strong> {selected.estimated_acp_amount} ACP → {selected.payout_acp_address}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>{selected.handoff_instructions}</div>
            <input
              className="input input-bordered w-full"
              placeholder="Proof / tracking / custody receipt (optional)"
              value={proofRef}
              onChange={(e) => setProofRef(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || !(selected.status === "awaiting_handoff" || selected.status === "pending_review")}
                onClick={() => void confirmSelected()}
              >
                I handed off asset
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy || !(selected.status === "awaiting_handoff" || selected.status === "pending_review")}
                onClick={() => void cancelSelected()}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void navigator.clipboard.writeText(selected.intake_reference)}
              >
                Copy reference
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
