"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { organizations } from "@/lib/api";

type Org = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  billing_wallet_address?: string;
  member_count: number;
  user_role?: string;
  created_at?: string;
};

export default function OrganizationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Org[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await organizations.list();
      setItems(data || []);
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load organizations");
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

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await organizations.create({ name, description: description || undefined });
      setName("");
      setDescription("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <>
      <Navigation />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="mt-1 text-sm opacity-60">Manage teams, shared ownership, and organization-level agent operations.</p>
        </div>

        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={createOrg} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h2 className="text-lg font-semibold">Create organization</h2>
            <label className="block space-y-2 text-sm">
              <div className="opacity-70">Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
            </label>
            <label className="block space-y-2 text-sm">
              <div className="opacity-70">Description</div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
            </label>
            <button className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)]" disabled={creating}>
              {creating ? "Creating…" : "Create organization"}
            </button>
          </form>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your organizations</h2>
              <button onClick={() => void load()} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs">Refresh</button>
            </div>
            {loading ? (
              <div className="py-10 text-center opacity-60">Loading…</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center opacity-40">No organizations yet.</div>
            ) : (
              <div className="space-y-3">
                {items.map((org) => (
                  <Link key={org.id} href={`/organizations/${encodeURIComponent(org.id)}`} className="block rounded-xl border border-[var(--border)] p-4 transition hover:border-[var(--accent)]/50">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{org.name}</div>
                        <div className="text-xs opacity-50">{org.slug}</div>
                      </div>
                      <div className="rounded-full bg-white/5 px-3 py-1 text-xs opacity-70">{org.user_role || "member"}</div>
                    </div>
                    {org.description && <p className="mt-2 text-sm opacity-70">{org.description}</p>}
                    <div className="mt-3 flex gap-4 text-xs opacity-50">
                      <span>{org.member_count} members</span>
                      {org.billing_wallet_address && <span className="truncate">{org.billing_wallet_address}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
