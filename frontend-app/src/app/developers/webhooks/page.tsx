"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { webhooks } from "@/lib/api";

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
  "merchant.payment.captured",
  "receipt.ready",
  "api.usage.created",
  "user.registered",
];

export default function WebhooksPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<Webhook[]>([]);
  const [selected, setSelected] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["run.completed", "receipt.ready"]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [rotatingSecret, setRotatingSecret] = useState(false);
  const [deletingWebhook, setDeletingWebhook] = useState(false);

  const loadDeliveries = useCallback(async (webhookId: string) => {
    try {
      const data = await webhooks.listDeliveries(webhookId);
      setDeliveries(data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load deliveries");
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await webhooks.list()) || [];
      setItems(data);
      setSelected((current) => {
        if (!data.length) {
          setDeliveries([]);
          return null;
        }
        if (current) {
          const stillExists = data.find((item: Webhook) => item.id === current.id);
          if (stillExists) {
            return stillExists;
          }
        }
        return data[0];
      });
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (selected?.id) {
      void loadDeliveries(selected.id);
    } else {
      setDeliveries([]);
    }
  }, [selected?.id, loadDeliveries]);

  async function createWebhook(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setNotice("");
    try {
      const created = await webhooks.create({
        url,
        description: description || undefined,
        event_types: selectedEvents,
      });
      setUrl("");
      setDescription("");
      setSelected(created || null);
      setNotice("Webhook created.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  }

  async function sendTest() {
    if (!selected) return;
    setSendingTest(true);
    setError("");
    setNotice("");
    try {
      await webhooks.sendTest(selected.id);
      await loadDeliveries(selected.id);
      setNotice("Test event sent.");
    } catch (e: any) {
      setError(e?.message || "Failed to send test webhook");
    } finally {
      setSendingTest(false);
    }
  }

  async function rotateSecret() {
    if (!selected) return;
    if (!window.confirm("Rotate this webhook secret? Existing downstream signature validation will need the new secret.")) {
      return;
    }
    setRotatingSecret(true);
    setError("");
    setNotice("");
    try {
      const updated = await webhooks.rotateSecret(selected.id);
      setSelected(updated || selected);
      setNotice("Webhook secret rotated.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to rotate webhook secret");
    } finally {
      setRotatingSecret(false);
    }
  }

  async function deleteSelectedWebhook() {
    if (!selected) return;
    if (!window.confirm(`Delete webhook ${selected.url}?`)) {
      return;
    }
    setDeletingWebhook(true);
    setError("");
    setNotice("");
    try {
      await webhooks.remove(selected.id);
      setNotice("Webhook deleted.");
      setSelected(null);
      setDeliveries([]);
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to delete webhook");
    } finally {
      setDeletingWebhook(false);
    }
  }

  function toggleEvent(eventType: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventType) ? prev.filter((x) => x !== eventType) : [...prev, eventType]
    );
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <>
      <Navigation />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="mt-1 text-sm opacity-60">Subscribe external systems to workflow, payment and receipt events.</p>
        </div>

        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {notice && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={createWebhook} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h2 className="text-lg font-semibold">Create webhook</h2>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhooks/ancap"
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              required
              disabled={creating}
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Internal billing sync"
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              disabled={creating}
            />
            <div className="space-y-2">
              <div className="text-sm opacity-70">Event types</div>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((eventType) => (
                  <button
                    key={eventType}
                    type="button"
                    onClick={() => toggleEvent(eventType)}
                    disabled={creating}
                    className={`rounded-full border px-3 py-1.5 text-xs ${selectedEvents.includes(eventType) ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] opacity-70"} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {eventType}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={creating || selectedEvents.length === 0}
            >
              {creating ? "Creating…" : "Create webhook"}
            </button>
            {selectedEvents.length === 0 && <div className="text-xs opacity-50">Select at least one event type.</div>}
          </form>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Endpoints</h2>
                <button onClick={() => void load()} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs">
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="py-10 text-center opacity-60">Loading…</div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center opacity-40">No webhooks yet.</div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className={`block w-full rounded-xl border p-4 text-left transition ${selected?.id === item.id ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] hover:border-[var(--accent)]/50"}`}
                    >
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
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Selected endpoint</h2>
                  {selected ? (
                    <div className="text-xs opacity-50">{selected.url}</div>
                  ) : (
                    <div className="text-xs opacity-50">Choose an endpoint to inspect deliveries and actions.</div>
                  )}
                </div>
                {selected && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={sendTest}
                      disabled={sendingTest}
                      className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-xs text-[var(--accent)] disabled:opacity-50"
                    >
                      {sendingTest ? "Sending…" : "Send test"}
                    </button>
                    <button
                      onClick={rotateSecret}
                      disabled={rotatingSecret}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:opacity-50"
                    >
                      {rotatingSecret ? "Rotating…" : "Rotate secret"}
                    </button>
                    <button
                      onClick={deleteSelectedWebhook}
                      disabled={deletingWebhook}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 disabled:opacity-50"
                    >
                      {deletingWebhook ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                )}
              </div>

              {!selected ? (
                <div className="py-10 text-center opacity-40">Select an endpoint.</div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-xl border border-[var(--border)] p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase tracking-wide opacity-50">Description</div>
                        <div className="mt-1 text-sm">{selected.description || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide opacity-50">Created</div>
                        <div className="mt-1 text-sm">{selected.created_at ? new Date(selected.created_at).toLocaleString() : "unknown"}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs uppercase tracking-wide opacity-50">Subscribed events</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selected.event_types.map((eventType) => (
                          <span key={eventType} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs opacity-80">
                            {eventType}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-semibold">Deliveries</h3>
                      <button onClick={() => void loadDeliveries(selected.id)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs">
                        Refresh deliveries
                      </button>
                    </div>
                    {deliveries.length === 0 ? (
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
                              <div className={`rounded-full px-3 py-1 text-xs ${delivery.status === "delivered" ? "bg-emerald-500/10 text-emerald-300" : "bg-yellow-500/10 text-yellow-300"}`}>
                                {delivery.status}
                              </div>
                            </div>
                            <div className="mt-2 text-xs opacity-45">{delivery.created_at ? new Date(delivery.created_at).toLocaleString() : ""}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
