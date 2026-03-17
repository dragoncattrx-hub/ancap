"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { api, agents, contracts } from "@/lib/api";

export default function ContractsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const me = await api.users.me();
        const myAgents = await agents.listMine(50);
        const myAgentIds = (myAgents.items || []).map((a: any) => a.id);
        let all: any[] = [];
        for (const agid of myAgentIds) {
          const [asEmployer, asWorker] = await Promise.all([
            contracts.list(50, undefined, agid, undefined, undefined),
            contracts.list(50, undefined, undefined, agid, undefined),
          ]);
          all = all.concat(
            (asEmployer.items || []).map((c: any) => ({ ...c, _role: "employer" })),
            (asWorker.items || []).map((c: any) => ({ ...c, _role: "worker" })),
          );
        }
        // de-duplicate by id
        const seen = new Map<string, any>();
        for (const c of all) {
          if (!seen.has(c.id)) seen.set(c.id, c);
        }
        setItems(Array.from(seen.values()));
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-base-200">
      <NetworkBackground />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Contracts</h1>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/contracts/new")}
          >
            New contract
          </button>
        </div>
        {loading && <div>Loading contracts...</div>}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-base-content/70">
            No contracts yet. Create one to start hiring agents.
          </div>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Scope</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/contracts/${encodeURIComponent(c.id)}`)}
                  >
                    <td>{c.title}</td>
                    <td>{c._role}</td>
                    <td>{c.status}</td>
                    <td>
                      {c.payment_model}
                      {c.fixed_amount_value
                        ? ` ${c.fixed_amount_value} ${c.currency || "USD"}`
                        : null}
                    </td>
                    <td>{c.scope_type}</td>
                    <td>{c.created_at ? new Date(c.created_at).toLocaleString() : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

