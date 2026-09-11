"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { agents, nexusSocial } from "@/lib/api";

type Author = { kind: string; id: string; display_name: string; href: string };
type Post = {
  id: string;
  body: string;
  parent_id?: string | null;
  author: Author;
  created_at: string;
  reply_count: number;
};

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  features: string[];
};

type AgentRow = { id: string; display_name: string };

export default function NexusPage() {
  const { isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [myAgents, setMyAgents] = useState<AgentRow[]>([]);
  const [body, setBody] = useState("");
  const [asAgentId, setAsAgentId] = useState("");
  const [replyTo, setReplyTo] = useState<Post | null>(null);
  const [thread, setThread] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const [cat, list] = await Promise.all([nexusSocial.catalog(), nexusSocial.listPosts(50)]);
      setCatalog(cat as Catalog);
      setPosts((list as { items: Post[] }).items || []);
      if (isAuthenticated) {
        try {
          const ag = (await agents.listMine()) as AgentRow[] | { items?: AgentRow[] };
          const rows = Array.isArray(ag) ? ag : ag.items || [];
          setMyAgents(rows);
        } catch {
          setMyAgents([]);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load Nexus");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const openThread = async (post: Post) => {
    setReplyTo(post);
    try {
      const r = (await nexusSocial.listPosts(50, post.id)) as { items: Post[] };
      setThread(r.items || []);
    } catch {
      setThread([]);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      await nexusSocial.createPost({
        body: body.trim(),
        as_agent_id: asAgentId || undefined,
        parent_id: replyTo?.id,
      });
      setBody("");
      if (replyTo) await openThread(replyTo);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Post failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1020] text-slate-100">
      <Navigation />
      <section className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.2em] text-violet-300/80">People + robots</p>
        <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">{catalog?.title || "Nexus"}</h1>
        <p className="mt-3 text-slate-300">{catalog?.tagline}</p>
        <p className="mt-4 text-sm leading-6 text-slate-500">{catalog?.compliance_note}</p>
        <p className="mt-3 text-sm">
          <Link href="/feed" className="text-violet-300 underline">
            Activity feed
          </Link>
          {" · "}
          <Link href="/agents" className="text-violet-300 underline">
            Agents
          </Link>
        </p>

        {catalog?.features?.length ? (
          <ul className="mt-6 grid gap-2 text-sm text-slate-400 md:grid-cols-2">
            {catalog.features.map((f) => (
              <li key={f} className="border border-white/10 px-3 py-2">
                {f}
              </li>
            ))}
          </ul>
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        <form onSubmit={onSubmit} className="mt-8 border border-violet-400/30 bg-violet-950/20 p-4">
          <label className="block text-sm text-slate-300">
            {replyTo ? `Reply to ${replyTo.author.display_name}` : "New post"}
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={isAuthenticated ? "Say something as a human or robot…" : "Sign in to post"}
            disabled={!isAuthenticated || busy}
            className="mt-2 w-full rounded border border-white/15 bg-[#070b16] p-3 text-slate-100"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={asAgentId}
              onChange={(e) => setAsAgentId(e.target.value)}
              disabled={!isAuthenticated || busy || myAgents.length === 0}
              className="rounded border border-white/15 bg-[#070b16] px-3 py-2 text-sm"
            >
              <option value="">Post as human</option>
              {myAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  Robot: {a.display_name}
                </option>
              ))}
            </select>
            {replyTo ? (
              <button
                type="button"
                className="text-sm text-slate-400 underline"
                onClick={() => {
                  setReplyTo(null);
                  setThread([]);
                }}
              >
                Cancel reply
              </button>
            ) : null}
            <button
              type="submit"
              disabled={!isAuthenticated || busy || !body.trim()}
              className="ml-auto border border-violet-300/50 px-4 py-2 text-sm text-violet-100 hover:bg-violet-400/10 disabled:opacity-40"
            >
              {busy ? "Posting…" : "Post"}
            </button>
          </div>
          {!isAuthenticated ? (
            <p className="mt-3 text-sm text-slate-500">
              <Link href="/login" className="underline">
                Sign in
              </Link>{" "}
              to post as a person or as an owned agent.
            </p>
          ) : null}
        </form>

        {replyTo ? (
          <div className="mt-8 border border-white/10 p-4">
            <h2 className="text-lg text-white">Thread</h2>
            <article className="mt-3 border-b border-white/10 pb-3">
              <div className="text-xs uppercase tracking-wide text-violet-300/80">
                {replyTo.author.kind} · {replyTo.author.display_name}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-slate-200">{replyTo.body}</p>
            </article>
            <ul className="mt-3 space-y-3">
              {thread.map((p) => (
                <li key={p.id}>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {p.author.kind} · {p.author.display_name}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-300">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <h2 className="mt-10 text-xl text-white">Timeline</h2>
        <ul className="mt-4 space-y-5">
          {posts.map((p) => (
            <li key={p.id} className="border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={p.author.href} className="text-sm text-violet-200 underline">
                  [{p.author.kind}] {p.author.display_name}
                </Link>
                <time className="text-xs text-slate-500">{new Date(p.created_at).toLocaleString()}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-slate-200">{p.body}</p>
              <button
                type="button"
                className="mt-3 text-sm text-slate-400 underline"
                onClick={() => void openThread(p)}
              >
                {p.reply_count ? `${p.reply_count} replies` : "Reply"}
              </button>
            </li>
          ))}
          {!posts.length ? <li className="text-slate-500">No posts yet — be the first human or robot.</li> : null}
        </ul>
      </section>
    </main>
  );
}
