"use client";

import { useEffect, useState, type FormEvent } from "react";
import { walletAcp } from "@/lib/api";

type Catalog = {
  asset_classes: Array<{ asset_class: string; label: string; note: string }>;
  disclaimer: string;
};

type Cert = {
  id: string;
  contract_code: string;
  asset_class: string;
  title: string;
  document_hash: string;
  face_value_acp?: string | null;
  status: string;
  transfer_code?: string | null;
};

function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  return crypto.subtle.digest("SHA-256", enc).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

export function OwnershipProofDesk() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [lastTransfer, setLastTransfer] = useState("");
  const [form, setForm] = useState({
    asset_class: "real_estate_title",
    title: "",
    subject_uri: "",
    jurisdiction: "",
    document_text: "",
    document_hash: "",
    face_value_acp: "",
    notes: "",
  });
  const [redeemCode, setRedeemCode] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [cat, list] = await Promise.all([
          walletAcp.ownershipCatalog() as Promise<Catalog>,
          walletAcp.listOwnershipCertificates() as Promise<Cert[]>,
        ]);
        setCatalog(cat);
        setCerts(Array.isArray(list) ? list : []);
        if (cat?.asset_classes?.[0]?.asset_class) {
          setForm((p) => ({ ...p, asset_class: cat.asset_classes[0].asset_class }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ownership desk");
      }
    })();
  }, []);

  async function hashDoc() {
    if (!form.document_text.trim()) return;
    const h = await sha256Hex(form.document_text.trim());
    setForm((p) => ({ ...p, document_hash: h }));
  }

  async function issue(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    setLastTransfer("");
    try {
      let hash = form.document_hash.trim().toLowerCase();
      if (!hash && form.document_text.trim()) {
        hash = await sha256Hex(form.document_text.trim());
      }
      if (hash.length < 64) throw new Error("document_hash (sha256 hex) required");
      const res = (await walletAcp.issueOwnershipCertificate({
        asset_class: form.asset_class,
        title: form.title.trim(),
        subject_uri: form.subject_uri.trim() || undefined,
        jurisdiction: form.jurisdiction.trim() || undefined,
        document_hash: hash,
        face_value_acp: form.face_value_acp.trim() || undefined,
        notes: form.notes.trim() || undefined,
        issue_transfer_code: true,
      })) as { certificate: Cert; disclaimer: string };
      setInfo(`Issued ${res.certificate.contract_code}`);
      if (res.certificate.transfer_code) setLastTransfer(res.certificate.transfer_code);
      const list = (await walletAcp.listOwnershipCertificates()) as Cert[];
      setCerts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Issue failed");
    } finally {
      setBusy(false);
    }
  }

  async function redeem(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await walletAcp.redeemOwnershipTransfer({ transfer_code: redeemCode.trim() });
      setInfo("Transfer redeemed — you are the new register owner.");
      setRedeemCode("");
      const list = (await walletAcp.listOwnershipCertificates()) as Cert[];
      setCerts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redeem failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="responsive-grid responsive-grid-2" id="ownership-proofs">
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontWeight: 800, margin: 0 }}>ACP ownership certificates</h3>
          <span className="badge badge-info">intangibles</span>
        </div>
        <p style={{ marginTop: 10, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          Crypto-style ACP contracts confirming ownership of intangible and title-linked assets
          (real estate deed/lease, antiques provenance, space objects, IP, licenses…). Register proof
          via document hash — not a sovereign deed substitute.
        </p>
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        {info ? <p style={{ color: "var(--success)" }}>{info}</p> : null}
        {lastTransfer ? (
          <p style={{ color: "var(--warning)", fontSize: "0.85rem" }}>
            One-time transfer code (save now): <code>{lastTransfer}</code>
          </p>
        ) : null}
        <form onSubmit={issue} style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <label>
            Asset class
            <select
              value={form.asset_class}
              onChange={(e) => setForm((p) => ({ ...p, asset_class: e.target.value }))}
            >
              {(catalog?.asset_classes || [{ asset_class: "other_intangible", label: "Other" }]).map((a) => (
                <option key={a.asset_class} value={a.asset_class}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
              placeholder="e.g. Kyiv apartment deed / Starlink payload rights"
            />
          </label>
          <label>
            Subject URI / ID
            <input
              value={form.subject_uri}
              onChange={(e) => setForm((p) => ({ ...p, subject_uri: e.target.value }))}
              placeholder="parcel / NORAD / IP registration"
            />
          </label>
          <label>
            Jurisdiction
            <input
              value={form.jurisdiction}
              onChange={(e) => setForm((p) => ({ ...p, jurisdiction: e.target.value }))}
            />
          </label>
          <label>
            Document text (hashed in browser)
            <textarea
              value={form.document_text}
              onChange={(e) => setForm((p) => ({ ...p, document_text: e.target.value }))}
              rows={3}
              placeholder="Paste title package text to hash, or paste hash below"
            />
          </label>
          <button type="button" className="btn btn-secondary" onClick={() => void hashDoc()} disabled={busy}>
            Hash document → sha256
          </button>
          <label>
            Document hash (sha256 hex)
            <input
              value={form.document_hash}
              onChange={(e) => setForm((p) => ({ ...p, document_hash: e.target.value }))}
              required
              minLength={64}
            />
          </label>
          <label>
            Face value ACP (optional)
            <input
              value={form.face_value_acp}
              onChange={(e) => setForm((p) => ({ ...p, face_value_acp: e.target.value }))}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Issue ACP ownership contract
          </button>
        </form>
        <form onSubmit={redeem} style={{ display: "grid", gap: 10, marginTop: 18 }}>
          <h4 style={{ margin: 0 }}>Redeem transfer code</h4>
          <input
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            placeholder="OWN-…"
            required
          />
          <button className="btn btn-secondary" type="submit" disabled={busy}>
            Redeem title pointer
          </button>
        </form>
        {catalog ? (
          <p style={{ marginTop: 14, fontSize: "0.8rem", color: "var(--text-muted)" }}>{catalog.disclaimer}</p>
        ) : null}
      </div>
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontWeight: 800, margin: 0 }}>Your certificates</h3>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {certs.length === 0 ? <li style={{ color: "var(--text-muted)" }}>No certificates yet.</li> : null}
          {certs.map((c) => (
            <li key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <strong>{c.contract_code}</strong> · {c.asset_class} · {c.status}
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{c.title}</div>
              <div style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{c.document_hash}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
