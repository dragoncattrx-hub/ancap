"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { growthNotifications } from "@/lib/api";

type Notification = {
  id: string;
  type: string;
  priority: string;
  payload: any;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
};

export default function NotificationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  async function refresh() {
    try {
      setError("");
      const r = await growthNotifications.list(200);
      setItems(r || []);
    } catch (e: any) {
      setError(e.message || "Failed to load notifications");
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function markRead(id: string) {
    try {
      await growthNotifications.markRead(id);
      await refresh();
    } catch (e: any) {
      setError(e.message || "Failed to mark read");
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h1 style={{ marginTop: 0 }}>Notifications</h1>
            <button className="btn btn-ghost" onClick={refresh}>Refresh</button>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((n) => (
              <div key={n.id} className="card" style={{ padding: 12, opacity: n.is_read ? 0.7 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>{n.type}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {new Date(n.created_at).toLocaleString()} · {n.priority}
                  </div>
                </div>
                <pre style={{ marginTop: 8, fontSize: 12, overflowX: "auto" }}>
                  {JSON.stringify(n.payload || {}, null, 2)}
                </pre>
                {!n.is_read && (
                  <button className="btn btn-primary" onClick={() => markRead(n.id)} style={{ marginTop: 8 }}>
                    Mark read
                  </button>
                )}
              </div>
            ))}
            {items.length === 0 && !error && <div style={{ color: "var(--text-muted)" }}>No notifications.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

