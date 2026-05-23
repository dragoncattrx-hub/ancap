"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { apiFetch } from "@/lib/api";

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

type Member = {
  user_id: string;
  role: string;
  joined_at?: string;
  user_email?: string;
};

export default function OrganizationDetailPage() {
  const params = useParams();
  const orgId = params?.id as string;
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [billingWallet, setBillingWallet] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [orgData, memberData] = await Promise.all([
        apiFetch(`/organizations/${orgId}`),
        apiFetch(`/organizations/${orgId}/members`),
      ]);
      setOrg(orgData);
      setMembers(memberData || []);
      setBillingWallet(orgData?.billing_wallet_address || "");
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load organization");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch(`/organizations/${orgId}/members`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      setEmail("");
      setRole("member");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to add member");
    }
  }

  async function saveWallet() {
    try {
      await apiFetch(`/organizations/${orgId}`, {
        method: "PATCH",
        body: JSON.stringify({ billing_wallet_address: billingWallet || null }),
      });
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to update billing wallet");
    }
  }

  return (
    <>
      <Navigation />
      <NetworkBackground />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 space-y-6">
        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {loading ? (
          <div className="py-20 text-center opacity-60">Loading…</div>
        ) : org ? (
          <>
            <div>
              <h1 className="text-2xl font-bold">{org.name}</h1>
              <p className="mt-1 text-sm opacity-60">{org.slug} · role: {org.user_role || "member"}</p>
              {org.description && <p className="mt-3 max-w-3xl text-sm opacity-75">{org.description}</p>}
            </div>

            <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
                  <h2 className="text-lg font-semibold">Billing wallet</h2>
                  <input value={billingWallet} onChange={(e) => setBillingWallet(e.target.value)} placeholder="0x... or billing wallet address" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" />
                  <button onClick={saveWallet} className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)]">Save wallet</button>
                </div>

                <form onSubmit={addMember} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
                  <h2 className="text-lg font-semibold">Add member</h2>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@email" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" />
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm">
                    <option value="viewer">viewer</option>
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                  <button className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)]">Invite/add member</button>
                </form>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Members</h2>
                  <span className="text-xs opacity-50">{members.length} total</span>
                </div>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.user_id} className="rounded-xl border border-[var(--border)] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{member.user_email || member.user_id}</div>
                          <div className="text-xs opacity-50">joined {member.joined_at ? new Date(member.joined_at).toLocaleString() : "unknown"}</div>
                        </div>
                        <div className="rounded-full bg-white/5 px-3 py-1 text-xs opacity-70">{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
