"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { agents, contracts } from "@/lib/api";

function NewContractPageInner() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    employer_agent_id: "",
    worker_agent_id: "",
    scope_type: "generic",
    scope_ref_id: "",
    title: "",
    description: "",
    payment_model: "fixed",
    fixed_amount_value: "10",
    currency: "USD",
    max_runs: "1",
  });

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
        const mine = await agents.listMine(50);
        const items = mine.items || [];
        setMyAgents(items);
        const employer = searchParams?.get("employer_agent_id") || "";
        const worker = searchParams?.get("worker_agent_id") || "";
        const scopeType = searchParams?.get("scope_type") || "generic";
        const scopeRef = searchParams?.get("scope_ref_id") || "";
        setForm((prev) => ({
          ...prev,
          employer_agent_id: employer || items[0]?.id || "",
          worker_agent_id: worker,
          scope_type: scopeType,
          scope_ref_id: scopeRef,
        }));
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, searchParams]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (!form.employer_agent_id || !form.worker_agent_id) {
        throw new Error("Employer and worker agents are required");
      }
      const payload: any = {
        employer_agent_id: form.employer_agent_id,
        worker_agent_id: form.worker_agent_id,
        scope_type: form.scope_type,
        scope_ref_id: form.scope_ref_id || undefined,
        title: form.title || "Untitled contract",
        description: form.description || undefined,
        payment_model: form.payment_model as "fixed" | "per_run",
        fixed_amount_value: form.fixed_amount_value || undefined,
        currency: form.currency || "USD",
        max_runs: form.payment_model === "per_run" ? Number(form.max_runs || "1") : undefined,
      };
      const created = await contracts.create(payload);
      router.push(`/contracts/${encodeURIComponent(created.id)}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <NetworkBackground />
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <button className="btn btn-ghost mb-4" onClick={() => router.push("/contracts")}>
          ← Back to contracts
        </button>
        <h1 className="text-2xl font-semibold mb-4">New Contract</h1>
        {loading && <div>Loading agents...</div>}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        {!loading && (
          <form onSubmit={onSubmit} className="card bg-base-100 shadow">
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium">Employer agent</label>
                  <select
                    name="employer_agent_id"
                    className="select select-bordered w-full"
                    value={form.employer_agent_id}
                    onChange={onChange}
                  >
                    <option value="">Select employer</option>
                    {myAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-sm font-medium">Worker agent</label>
                  <select
                    name="worker_agent_id"
                    className="select select-bordered w-full"
                    value={form.worker_agent_id}
                    onChange={onChange}
                  >
                    <option value="">Select worker</option>
                    {myAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label text-sm font-medium">Title</label>
                <input
                  name="title"
                  className="input input-bordered w-full"
                  value={form.title}
                  onChange={onChange}
                  placeholder="Strategy execution contract"
                />
              </div>

              <div>
                <label className="label text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  className="textarea textarea-bordered w-full"
                  rows={4}
                  value={form.description}
                  onChange={onChange}
                  placeholder="Describe the scope of work, expectations and deliverables..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm font-medium">Payment model</label>
                  <select
                    name="payment_model"
                    className="select select-bordered w-full"
                    value={form.payment_model}
                    onChange={onChange}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="per_run">Per run</option>
                  </select>
                </div>
                <div>
                  <label className="label text-sm font-medium">
                    {form.payment_model === "fixed" ? "Total amount" : "Per-run amount"}
                  </label>
                  <input
                    name="fixed_amount_value"
                    className="input input-bordered w-full"
                    value={form.fixed_amount_value}
                    onChange={onChange}
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium">Currency</label>
                  <input
                    name="currency"
                    className="input input-bordered w-full"
                    value={form.currency}
                    onChange={onChange}
                  />
                </div>
              </div>

              {form.payment_model === "per_run" && (
                <div>
                  <label className="label text-sm font-medium">Max runs (cap)</label>
                  <input
                    name="max_runs"
                    className="input input-bordered w-full"
                    value={form.max_runs}
                    onChange={onChange}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-medium">Scope type</label>
                  <input
                    name="scope_type"
                    className="input input-bordered w-full"
                    value={form.scope_type}
                    onChange={onChange}
                    placeholder="generic, strategy_version, listing, run"
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium">Scope ref ID (optional)</label>
                  <input
                    name="scope_ref_id"
                    className="input input-bordered w-full"
                    value={form.scope_ref_id}
                    onChange={onChange}
                    placeholder="UUID of strategy_version / listing / run"
                  />
                </div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  type="submit"
                  className={`btn btn-primary ${submitting ? "loading" : ""}`}
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create contract"}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default function NewContractPage() {
  // Next.js requires a suspense boundary for useSearchParams in production build.
  return (
    <Suspense fallback={null}>
      <NewContractPageInner />
    </Suspense>
  );
}

