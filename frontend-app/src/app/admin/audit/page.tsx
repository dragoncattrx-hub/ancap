"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { ApiError, audit } from "@/lib/api";

const TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Decisions", value: "decision" },
  { label: "Governance", value: "governance" },
  { label: "Bridge", value: "bridge" },
];

const DAYS_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

const STATUS_COLORS: Record<string, string> = {
  allow: "bg-green-900/50 text-green-400 border-green-800",
  reject: "bg-red-900/50 text-red-400 border-red-800",
  open: "bg-blue-900/50 text-blue-400 border-blue-800",
  resolved: "bg-green-900/50 text-green-400 border-green-800",
  delivered: "bg-green-900/50 text-green-400 border-green-800",
  failed: "bg-red-900/50 text-red-400 border-red-800",
  pending: "bg-yellow-900/50 text-yellow-400 border-yellow-800",
};

function EventCard({ item }: { item: any }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded border font-mono ${
          item.type === "decision" ? "border-blue-800 text-blue-400" :
          item.type === "governance" ? "border-purple-800 text-purple-400" :
          "border-orange-800 text-orange-400"
        }`}>
          {item.type}
        </span>
        <span className="text-xs font-mono text-[var(--text-muted)]">{item.event_type}</span>
        {item.reason_code && (
          <span className="text-xs text-[var(--text-muted)] opacity-60">→ {item.reason_code}</span>
        )}
      </div>
      {item.message && (
        <p className="text-sm opacity-80">{item.message}</p>
      )}
      <div className="flex items-center gap-4 text-xs opacity-40">
        {item.actor_type && <span>actor:{item.actor_type}</span>}
        {item.scope && <span>scope:{item.scope}</span>}
        {item.subject_type && item.subject_id && (
          <span>{item.subject_type}:{item.subject_id.slice(0, 8)}...</span>
        )}
        {item.created_at && (
          <span>{new Date(item.created_at).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}

export default function AuditPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [type, setType] = useState("");
  const [days, setDays] = useState(7);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await audit.list({ days, limit: 100, type: type || undefined });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 403) {
        setError("Admin access required for the audit log.");
      } else if (e instanceof ApiError && e.status === 503) {
        setError("Admin access is not configured yet.");
      } else {
        setError(e?.message || String(e));
      }
    } finally {
      setLoading(false);
    }
  }, [days, type]);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <Navigation />
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Audit Log</h1>
            <p className="text-sm opacity-60 mt-1">{total} events</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-1 p-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elev-1)]">
              {DAYS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                    days === opt.value
                      ? "bg-[var(--accent)] text-black"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <a
              href={audit.exportUrl({ days, type: type || undefined })}
              className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elev-1)] text-xs hover:border-[var(--accent)] transition"
              download
            >
              Export CSV
            </a>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`px-3 py-1.5 rounded text-sm border transition ${
                type === opt.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] opacity-60 hover:opacity-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-16 opacity-60">Loading...</div>}
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 opacity-30">No audit events in this window</div>
            ) : (
              items.map((item) => (
                <EventCard key={`${item.type}-${item.id}`} item={item} />
              ))
            )}
          </div>
        )}
      </main>
    </>
  );
}
