"use client";

import { useCallback, useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { apiFetch } from "@/lib/api";

type Webhook = {
  id: string;
  url: string;
  event_types: string[];
  description?: string;
  is_active: boolean;
  created_at?: string;
};

type Delivery = {
  id: string;
  event_type: string;
  status: string;
  attempt: number;
  response_status?: number;
  created_at?: string;
  delivered_at?: string;
};

const EVENT_TYPES = [
  "run.completed",
  "run.failed",
  "payment.captured",
  "payment.refunded",
  "receipt.ready",
  "api.usage.created",
  "user.registered",
];

export default function WebhooksPage() {
  const [items, setItems] = useState<Webhook[]>([]);
  const [selected, setSelected] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["run.completed", "receipt.ready"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/webhooks");
      setItems(data || []);
      if (!selected && data?.length) {
        setSelected(data[0]);
      }
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  async function loadDeliveries(webhookId: string) {
    try {
      const data = await apiFetch(`/webhooks/${webhookId}/deliveries`);
      setDeliveries(data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load deliveries");
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selected?.id) {
      void loadDeliveries(selected.id);
    }
  }, [selected?.id]);

  async function createWebhook(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/webhooks", {
        method: "POST",
        body: JSON.stringify({ url, description: description || undefined, event_types: selectedEvents }),
      });
      setUrl("");
      setDescription("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create webhook");
    }
  }

  async function sendTest() {
    if (!selected) return;
    try {
      await apiFetch(`/webhooks/${selected.id}/test`, { method: "POST" });
      await loadDeliveries(selected.id);
    } catch (e: any) {
      setError(e?.message || "Failed to send test webhook");
    }
  }

  function toggleEvent(eventType: string) {
    setSelectedEvents((prev) => prev.includes(eventType) ? prev.filter((x) => x !== eventType) : [...prev, eventType]);
  }

  return (
    <>
      <Navigation />
      <NetworkBackground />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="mt-1 text-sm opacity-60">Subscribe external systems to workflow, payment and receipt events.</p>
        </div>

        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={createWebhook} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h2 className="text-lg font-semibold">Create webhook</h2>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/webhooks/ancap" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" required />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Internal billing sync" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" />
            <div className="space-y-2">
              <div className="text-sm opacity-70">Event types</div>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((eventType) => (
                  <button key={eventType} type="button" onClick={() => toggleEvent(eventType)} className={`rounded-full border px-3 py-1.5 text-xs ${selectedEvents.includes(eventType) ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] opacity-70"}`}>
                    {eventType}
                  </button>
                ))}
              </div>
            </div>
            <button className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)]">Create webhook</button>
          </form>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Endpoints</h2>
                <button onClick={() => void load()} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs">Refresh</button>
              </div>
              {loading ? (
                <div className="py-10 text-center opacity-60">Loading…</div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center opacity-40">No webhooks yet.</div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <button key={item.id} onClick={() => setSelected(item)} className={`block w-full rounded-xl border p-4 text-left transition ${selected?.id === item.id ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] hover:border-[var(--accent)]/50"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{item.url}</div>
                          {item.description && <div className="text-xs opacity-50">{item.description}</div>}
                        </div>
                        <div className="rounded-full bg-white/5 px-3 py-1 text-xs opacity-70">{item.event_types.length} events</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Deliveries</h2>
                  {selected && <div className="text-xs opacity-50">{selected.url}</div>}
                </div>
                <button onClick={sendTest} disabled={!selected} className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-xs text-[var(--accent)] disabled:opacity-50">Send test</button>
              </div>
              {!selected ? (
                <div className="py-10 text-center opacity-40">Select an endpoint.</div>
              ) : deliveries.length === 0 ? (
                <div className="py-10 text-center opacity-40">No deliveries yet.</div>
              ) : (
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="rounded-xl border border-[var(--border)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{delivery.event_type}</div>
                          <div className="text-xs opacity-50">attempt {delivery.attempt} · status {delivery.response_status || "-"}</div>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-xs ${delivery.status === "delivered" ? "bg-emerald-500/10 text-emerald-300" : "bg-yellow-500/10 text-yellow-300"}`}>{delivery.status}</div>
                      </div>
                      <div className="mt-2 text-xs opacity-45">{delivery.created_at ? new Date(delivery.created_at).toLocaleString() : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
