"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { search } from "@/lib/api";

const TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Agents", value: "agent" },
  { label: "Strategies", value: "strategy" },
  { label: "Workflows", value: "workflow" },
  { label: "Listings", value: "listing" },
];

function ResultCard({ item }: { item: any }) {
  const typeColors: Record<string, string> = {
    agent: "border-blue-800 text-blue-400",
    strategy: "border-purple-800 text-purple-400",
    workflow: "border-[var(--accent)] text-[var(--accent)]",
    listing: "border-yellow-800 text-yellow-400",
  };
  const cls = typeColors[item.type] || "border-gray-700 text-gray-400";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--accent)]/50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded border ${cls}`}>{item.type}</span>
        {item.status && <span className="text-xs opacity-50">{item.status}</span>}
      </div>
      <h3 className="font-semibold mb-1">{item.title}</h3>
      {item.description && <p className="text-sm opacity-60 line-clamp-2 mb-2">{item.description}</p>}
      {item.category && <div className="text-xs opacity-40">{item.category}</div>}
      {item.created_at && (
        <div className="text-xs opacity-30 mt-1">{new Date(item.created_at).toLocaleDateString()}</div>
      )}
    </div>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [type, setType] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [byType, setByType] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string, t: string) => {
    if (!q.trim()) {
      setResults([]);
      setTotal(0);
      setByType({});
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const data = await search.query(q.trim(), t || undefined);
      setResults(data.results || []);
      setByType(data.by_type || {});
      setTotal(data.total || 0);
      setSearched(true);
    } catch {
      setResults([]);
      setTotal(0);
      setByType({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setQuery(initialQ);
    if (initialQ) {
      void doSearch(initialQ, type);
    }
  }, [doSearch, initialQ, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
    void doSearch(query, type);
  };

  return (
    <main className="relative z-10 max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search workflows, agents, strategies..."
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-5 py-2.5 text-sm font-medium hover:bg-[var(--accent)]/20 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="flex gap-2 flex-wrap">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setType(opt.value);
              if (query.trim()) void doSearch(query, opt.value);
            }}
            className={`px-3 py-1 rounded text-sm border transition ${
              type === opt.value
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] opacity-60 hover:opacity-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 opacity-60">Searching...</div>}

      {!loading && searched && (
        <>
          <div className="text-sm opacity-60">
            {total === 0 ? `No results for "${query}"` : `${total} result${total === 1 ? "" : "s"} for "${query}"`}
          </div>

          {Object.keys(byType).length > 1 && (
            <div className="flex gap-3 text-xs opacity-60">
              {Object.entries(byType).map(([t, count]) => (
                <span key={t}>
                  {t}: {count}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {results.map((item) => (
              <ResultCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        </>
      )}

      {!loading && !searched && (
        <div className="text-center py-12 opacity-30">
          Enter a query to search across workflows, agents, strategies and listings.
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <>
      <Navigation />
      <NetworkBackground />
      <Suspense fallback={<main className="relative z-10 max-w-3xl mx-auto px-4 py-8"><div className="text-center py-12 opacity-60">Loading search…</div></main>}>
        <SearchPageContent />
      </Suspense>
    </>
  );
}
