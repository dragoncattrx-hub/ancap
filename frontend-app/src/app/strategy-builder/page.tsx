"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { strategies } from "@/lib/api";

type WorkflowNode = {
  id: string;
  action: string;
  save_as?: string;
  argsText: string;
};

type StrategySummary = {
  id: string;
  name: string;
  vertical_id: string;
  owner_agent_id: string;
  status: string;
  summary?: string;
};

const ACTION_TEMPLATES = [
  { action: "const", args: '{\n  "value": 1\n}' },
  { action: "map", args: '{\n  "input": "{{x}}",\n  "transform": "identity"\n}' },
  { action: "call_agent", args: '{\n  "prompt": "Summarize this input",\n  "model": "default"\n}' },
  { action: "http_fetch", args: '{\n  "url": "https://example.com"\n}' },
  { action: "finalize", args: '{\n  "template": "Result: {{x}}"\n}' },
];

const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

function buildNode(action = "const", index = 1): WorkflowNode {
  const template = ACTION_TEMPLATES.find((x) => x.action === action) || ACTION_TEMPLATES[0];
  return {
    id: `step_${index}`,
    action: template.action,
    save_as: `out_${index}`,
    argsText: template.args,
  };
}

function templateArgsFor(action: string): string {
  return ACTION_TEMPLATES.find((x) => x.action === action)?.args || "{}";
}

function StrategyBuilderPageContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const strategyId = searchParams?.get("strategy") || "";

  const [strategy, setStrategy] = useState<StrategySummary | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(true);
  const [semver, setSemver] = useState("1.0.0");
  const [changelog, setChangelog] = useState("");
  const [builderTitle, setBuilderTitle] = useState("Workflow version draft");
  const [nodes, setNodes] = useState<WorkflowNode[]>([buildNode("const", 1), buildNode("finalize", 2)]);
  const [inputsText, setInputsText] = useState('{\n  "prompt": "What should this workflow do?"\n}');
  const [limitsText, setLimitsText] = useState('{\n  "max_steps": 20,\n  "max_runtime_ms": 10000\n}');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createdVersionId, setCreatedVersionId] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!strategyId) {
      setStrategy(null);
      setLoadingStrategy(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingStrategy(true);
        const data = await strategies.get(strategyId);
        if (cancelled) return;
        setStrategy(data);
      } catch (e: any) {
        if (cancelled) return;
        setStrategy(null);
        setError(e?.message || "Failed to load strategy");
      } finally {
        if (!cancelled) setLoadingStrategy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, strategyId]);

  const preview = useMemo(() => {
    try {
      if (!strategyId) {
        return { ok: false, error: "Missing strategy id. Open builder from a strategy page." };
      }
      if (!strategy?.vertical_id) {
        return { ok: false, error: "Strategy metadata not loaded yet." };
      }
      if (!SEMVER_RE.test(semver.trim())) {
        return { ok: false, error: "Semver must look like 1.0.0" };
      }

      const inputs = JSON.parse(inputsText);
      const limits = JSON.parse(limitsText);
      const seenIds = new Set<string>();
      const steps = nodes.map((node, index) => {
        const id = node.id.trim();
        const action = node.action.trim();
        if (!id) throw new Error(`Step ${index + 1}: id is required`);
        if (!action) throw new Error(`Step ${index + 1}: action is required`);
        if (seenIds.has(id)) throw new Error(`Duplicate step id: ${id}`);
        seenIds.add(id);
        return {
          id,
          action,
          args: JSON.parse(node.argsText || "{}"),
          save_as: node.save_as?.trim() || undefined,
        };
      });
      if (!steps.length) {
        return { ok: false, error: "Add at least one workflow step." };
      }

      return {
        ok: true,
        workflow: {
          vertical_id: strategy.vertical_id,
          version: semver.trim(),
          inputs,
          limits,
          steps,
        },
      };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Invalid JSON" };
    }
  }, [inputsText, limitsText, nodes, semver, strategy, strategyId]);

  function updateNode(index: number, patch: Partial<WorkflowNode>) {
    setCreatedVersionId("");
    setNodes((prev) => prev.map((n, i) => (i === index ? { ...n, ...patch } : n)));
  }

  function changeNodeAction(index: number, action: string) {
    setCreatedVersionId("");
    setNodes((prev) => prev.map((n, i) => (i === index ? { ...n, action, argsText: templateArgsFor(action) } : n)));
  }

  function addNode(action = "const") {
    setCreatedVersionId("");
    setNodes((prev) => [...prev, buildNode(action, prev.length + 1)]);
  }

  function removeNode(index: number) {
    setCreatedVersionId("");
    setNodes((prev) => prev.filter((_, i) => i !== index));
  }

  async function createVersion() {
    if (!strategyId) {
      setError("Missing strategy id. Open builder from a strategy page.");
      return;
    }
    if (!strategy) {
      setError("Strategy metadata is still loading.");
      return;
    }
    if (!preview.ok) {
      setError(`Workflow JSON invalid: ${preview.error}`);
      return;
    }

    setCreating(true);
    setError("");
    setNotice("");
    try {
      const created = await strategies.createVersion(strategyId, {
        semver: semver.trim(),
        workflow: preview.workflow!,
        changelog: changelog || builderTitle,
      });
      setCreatedVersionId(created?.id || "created");
      setNotice(`Created version ${created?.semver || semver.trim()} for ${strategy.name}.`);
    } catch (e: any) {
      setError(e?.message || "Failed to create version");
    } finally {
      setCreating(false);
    }
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <Navigation />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Strategy Builder</h1>
            <p className="mt-1 text-sm opacity-60">
              Visual-first workflow composer for strategy versions. It writes into the existing strategy version API.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm opacity-70">
            Strategy: {strategy?.name || strategyId || "not selected"}
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {notice && !error && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{notice}</div>}
        {createdVersionId && !error && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Version created: {createdVersionId}.{" "}
            <Link className="underline" href={`/strategies/${encodeURIComponent(strategyId)}`}>
              Back to strategy
            </Link>
          </div>
        )}

        {!strategyId ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm opacity-80">
            <div className="text-base font-semibold mb-2">No strategy selected</div>
            <div className="opacity-70 mb-4">Open the builder from a strategy detail page so the workflow version is attached to a real strategy.</div>
            <Link href="/strategies" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm inline-block">
              Open strategies
            </Link>
          </div>
        ) : loadingStrategy ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm opacity-70">Loading strategy metadata...</div>
        ) : !strategy ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
            Strategy not found or unavailable.
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div>
                  <div className="opacity-60">Strategy id</div>
                  <div className="font-mono text-xs break-all mt-1">{strategy.id}</div>
                </div>
                <div>
                  <div className="opacity-60">Vertical</div>
                  <div className="font-mono text-xs break-all mt-1">{strategy.vertical_id}</div>
                </div>
                <div>
                  <div className="opacity-60">Owner agent</div>
                  <div className="font-mono text-xs break-all mt-1">{strategy.owner_agent_id}</div>
                </div>
              </div>
            </div>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <div className="opacity-70">Draft title</div>
                      <input value={builderTitle} onChange={(e) => { setBuilderTitle(e.target.value); setCreatedVersionId(""); }} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
                    </label>
                    <label className="space-y-2 text-sm">
                      <div className="opacity-70">Semver</div>
                      <input value={semver} onChange={(e) => { setSemver(e.target.value); setCreatedVersionId(""); }} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
                    </label>
                  </div>
                  <label className="mt-4 block space-y-2 text-sm">
                    <div className="opacity-70">Changelog</div>
                    <input value={changelog} onChange={(e) => { setChangelog(e.target.value); setCreatedVersionId(""); }} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" placeholder="What changed in this version?" />
                  </label>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-lg font-semibold">Workflow steps</h2>
                    <div className="flex gap-2 flex-wrap">
                      {ACTION_TEMPLATES.map((tpl) => (
                        <button key={tpl.action} type="button" onClick={() => addNode(tpl.action)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:border-[var(--accent)]">
                          + {tpl.action}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {nodes.map((node, index) => (
                      <div key={`${node.id}-${index}`} className="rounded-xl border border-[var(--border)] bg-black/10 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--accent)] text-xs text-[var(--accent)]">
                              {index + 1}
                            </div>
                            <input value={node.id} onChange={(e) => updateNode(index, { id: e.target.value })} className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" />
                          </div>
                          <button type="button" onClick={() => removeNode(index)} disabled={nodes.length <= 1} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50">
                            Remove
                          </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="space-y-2 text-sm">
                            <div className="opacity-70">Action</div>
                            <select value={node.action} onChange={(e) => changeNodeAction(index, e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2">
                              {ACTION_TEMPLATES.map((tpl) => (
                                <option key={tpl.action} value={tpl.action}>{tpl.action}</option>
                              ))}
                            </select>
                          </label>
                          <label className="space-y-2 text-sm">
                            <div className="opacity-70">Save as</div>
                            <input value={node.save_as || ""} onChange={(e) => updateNode(index, { save_as: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
                          </label>
                        </div>

                        <label className="mt-3 block space-y-2 text-sm">
                          <div className="opacity-70">Args JSON</div>
                          <textarea value={node.argsText} onChange={(e) => updateNode(index, { argsText: e.target.value })} rows={6} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <h2 className="mb-3 text-lg font-semibold">Workflow config</h2>
                  <label className="block space-y-2 text-sm">
                    <div className="opacity-70">Inputs JSON</div>
                    <textarea value={inputsText} onChange={(e) => { setInputsText(e.target.value); setCreatedVersionId(""); }} rows={6} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs" />
                  </label>
                  <label className="mt-4 block space-y-2 text-sm">
                    <div className="opacity-70">Limits JSON</div>
                    <textarea value={limitsText} onChange={(e) => { setLimitsText(e.target.value); setCreatedVersionId(""); }} rows={6} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs" />
                  </label>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Preview</h2>
                    <span className={`rounded-full px-3 py-1 text-xs ${preview.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
                      {preview.ok ? "Valid" : "Invalid"}
                    </span>
                  </div>
                  <pre className="max-h-[420px] overflow-auto rounded-lg border border-[var(--border)] bg-black/20 p-3 text-xs opacity-90">{preview.ok ? JSON.stringify(preview.workflow, null, 2) : String(preview.error || "Invalid")}</pre>
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <button type="button" onClick={createVersion} disabled={creating || !preview.ok} className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] disabled:opacity-50">
                      {creating ? "Creating…" : "Create version"}
                    </button>
                    <Link href={`/strategies/${encodeURIComponent(strategyId)}`} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">
                      Back to strategy
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}

export default function StrategyBuilderPage() {
  return (
    <Suspense
      fallback={
        <main className="relative z-10 mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm opacity-70">
            Loading strategy builder...
          </div>
        </main>
      }
    >
      <StrategyBuilderPageContent />
    </Suspense>
  );
}
