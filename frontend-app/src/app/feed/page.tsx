"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { growthPublic } from "@/lib/api";

type FeedItem = {
  id: string;
  event_type: string;
  ref_type: string;
  ref_id: string;
  created_at: string;
  payload: any;
  score: string;
};

/** Human-readable label for the event_type column (kept short on purpose). */
function describeEventType(t: string): string {
  switch (t) {
    case "run_succeeded":
      return "Run succeeded";
    case "run_failed":
      return "Run failed";
    case "run_started":
      return "Run started";
    case "listing_published":
      return "Listing published";
    case "order_placed":
      return "Order placed";
    case "order_settled":
      return "Order settled";
    case "stake_locked":
      return "Stake locked";
    case "stake_released":
      return "Stake released";
    case "anchor_committed":
      return "Anchor committed";
    default:
      return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/** Tone for the badge attached to the event type. */
function toneFor(t: string): "good" | "bad" | "info" {
  if (t.endsWith("_succeeded") || t.endsWith("_committed") || t.endsWith("_settled") || t.endsWith("_published")) return "good";
  if (t.endsWith("_failed") || t.endsWith("_rejected") || t.endsWith("_cancelled")) return "bad";
  return "info";
}

/** Truncate UUIDs/long ids for the public timeline so we don't render 36-char UUIDs inline. */
function shortId(id: string): string {
  if (!id) return "";
  if (id.length <= 12) return id;
  return id.slice(0, 8) + "…" + id.slice(-4);
}

/** Render the most useful 2-3 fields from `payload` as a sentence; collapse the rest. */
function summarizePayload(payload: any): string {
  if (!payload || typeof payload !== "object") return "";
  const keys = Object.keys(payload);
  if (keys.length === 0) return "";
  const interesting = keys
    .filter((k) => !/_id$|^id$/i.test(k)) // hide raw ids — they're already in ref_id and clutter
    .slice(0, 3);
  if (interesting.length === 0) return "";
  return interesting
    .map((k) => {
      const v = payload[k];
      const out = typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v) : JSON.stringify(v);
      return `${k.replace(/_/g, " ")}: ${out.length > 80 ? out.slice(0, 77) + "…" : out}`;
    })
    .join(" · ");
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "good" | "bad">("all");
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoading(true);
        const r = await growthPublic.getFeed(100);
        setItems(r || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load feed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => toneFor(it.event_type) === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    let good = 0, bad = 0;
    for (const it of items) {
      const tone = toneFor(it.event_type);
      if (tone === "good") good++;
      else if (tone === "bad") bad++;
    }
    return { all: items.length, good, bad };
  }, [items]);

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ marginTop: 0 }}>Public Activity Feed</h1>
            <div role="radiogroup" aria-label="Filter feed" style={{ display: "flex", gap: 6 }}>
              <button
                role="radio"
                aria-checked={filter === "all"}
                className={filter === "all" ? "btn btn-primary" : "btn btn-ghost"}
                onClick={() => setFilter("all")}
                style={{ padding: "4px 10px", fontSize: "0.85rem" }}
              >
                All ({counts.all})
              </button>
              <button
                role="radio"
                aria-checked={filter === "good"}
                className={filter === "good" ? "btn btn-primary" : "btn btn-ghost"}
                onClick={() => setFilter("good")}
                style={{ padding: "4px 10px", fontSize: "0.85rem" }}
              >
                Successful ({counts.good})
              </button>
              <button
                role="radio"
                aria-checked={filter === "bad"}
                className={filter === "bad" ? "btn btn-primary" : "btn btn-ghost"}
                onClick={() => setFilter("bad")}
                style={{ padding: "4px 10px", fontSize: "0.85rem" }}
              >
                Failed ({counts.bad})
              </button>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: 8 }}>
                <input
                  type="checkbox"
                  checked={showRaw}
                  onChange={(e) => setShowRaw(e.target.checked)}
                />
                Raw payload
              </label>
            </div>
          </div>

          {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}

          {loading ? (
            <div style={{ marginTop: 16, color: "var(--text-muted)" }}>Loading feed…</div>
          ) : filtered.length === 0 && !error ? (
            <div style={{ marginTop: 16, color: "var(--text-muted)" }}>No activity yet.</div>
          ) : (
            <ul style={{ display: "grid", gap: 10, marginTop: 14, padding: 0, listStyle: "none" }}>
              {filtered.map((it) => {
                const tone = toneFor(it.event_type);
                const toneBg =
                  tone === "good" ? "rgba(16, 185, 129, 0.12)" :
                  tone === "bad" ? "rgba(239, 68, 68, 0.12)" :
                  "rgba(99, 102, 241, 0.12)";
                const toneFg =
                  tone === "good" ? "#10b981" :
                  tone === "bad" ? "#ef4444" :
                  "#6366f1";
                const summary = summarizePayload(it.payload);
                const refHref = `/${it.ref_type}s/${it.ref_id}`;
                return (
                  <li key={it.id} className="card" style={{ padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: toneBg,
                            color: toneFg,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {describeEventType(it.event_type)}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          score {it.score}
                        </span>
                      </div>
                      <time
                        dateTime={it.created_at}
                        title={new Date(it.created_at).toISOString()}
                        style={{ color: "var(--text-muted)", fontSize: 12 }}
                      >
                        {new Date(it.created_at).toLocaleString()}
                      </time>
                    </div>

                    <div style={{ marginTop: 6, color: "var(--text)", fontSize: "0.92rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>{it.ref_type}: </span>
                      <a href={refHref} style={{ color: "var(--accent)", textDecoration: "none" }} title={it.ref_id}>
                        {shortId(it.ref_id)}
                      </a>
                      {summary ? <span style={{ color: "var(--text-muted)" }}> · {summary}</span> : null}
                    </div>

                    {showRaw && it.payload && Object.keys(it.payload).length > 0 ? (
                      <details style={{ marginTop: 8 }}>
                        <summary style={{ cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}>Raw payload</summary>
                        <pre style={{ marginTop: 6, fontSize: 12, opacity: 0.9, overflowX: "auto" }}>
                          {JSON.stringify(it.payload, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
