"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { strategies } from "@/lib/api";

type WorkflowNode = {
  id: string;
  action: string;
  save_as?: string;
  argsText: string;
};

const ACTION_TEMPLATES = [
  { action: "const", args: '{\n  "value": 1\n}' },
  { action: "map", args: '{\n  "input": "{{x}}",\n  "transform": "identity"\n}' },
  { action: "call_agent", args: '{\n  "prompt": "Summarize this input",\n  "model": "default"\n}' },
  { action: "http_fetch", args: '{\n  "url": "https://example.com"\n}' },
  { action: "finalize", args: '{\n  "template": "Result: {{x}}"\n}' },
];

function buildNode(action = "const", index = 1): WorkflowNode {
  const template = ACTION_TEMPLATES.find((x) => x.action === action) || ACTION_TEMPLATES[0];
  return {
    id: `step_${index}`,
    action: template.action,
    save_as: `out_${index}`,
    argsText: template.args,
  };
}

function StrategyBuilderPageContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const strategyId = searchParams?.get("strategy") || "";
  const verticalId = searchParams?.get("vertical") || "";

  const [semver, setSemver] = useState("1.0.0");
  const [changelog, setChangelog] = useState("");
  const [builderTitle, setBuilderTitle] = useState("Workflow version draft");
  const [nodes, setNodes] = useState<WorkflowNode[]>([buildNode("const", 1), buildNode("finalize", 2)]);
  const [inputsText, setInputsText] = useState('{\n  "prompt": "What should this workflow do?"\n}');
  const [limitsText, setLimitsText] = useState('{\n  "max_steps": 20,\n  "max_runtime_ms": 10000\n}');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createdVersionId, setCreatedVersionId] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const preview = useMemo(() => {
    try {
      const inputs = JSON.parse(inputsText);
      const limits = JSON.parse(limitsText);
      const steps = nodes.map((node) => ({
        id: node.id.trim(),
        action: node.action.trim(),
        args: JSON.parse(node.argsText || "{}"),
        save_as: node.save_as?.trim() || undefined,
      }));
      return {
        ok: true,
        workflow: {
          vertical_id: verticalId || "set-vertical-id",
          version: semver,
          inputs,
          limits,
          steps,
        },
      };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Invalid JSON" };
    }
  }, [inputsText, limitsText, nodes, semver, verticalId]);

  function updateNode(index: number, patch: Partial<WorkflowNode>) {
    setNodes((prev) => prev.map((n, i) => (i === index ? { ...n, ...patch } : n)));
  }

  function addNode(action = "const") {
    setNodes((prev) => [...prev, buildNode(action, prev.length + 1)]);
  }

  function removeNode(index: number) {
    setNodes((prev) => prev.filter((_, i) => i !== index));
  }

  async function createVersion() {
    if (!strategyId) {
      setError("Missing strategy id. Open builder from a strategy page.");
      return;
    }
    if (!preview.ok) {
      setError(`Workflow JSON invalid: ${preview.error}`);
      return;
    }
    const workflow = preview.workflow!;
    if (!workflow.steps.length) {
      setError("Add at least one step.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const created = await strategies.createVersion(strategyId, {
        semver,
        workflow,
        changelog: changelog || builderTitle,
      });
      setCreatedVersionId(created?.id || "created");
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
      <NetworkBackground />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Strategy Builder</h1>
            <p className="mt-1 text-sm opacity-60">
              Visual-first workflow composer for strategy versions. It writes into the existing strategy version API.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm opacity-70">
            Strategy: {strategyId || "not selected"}
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {createdVersionId && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Version created: {createdVersionId}. <a className="underline" href={`/strategies/${encodeURIComponent(strategyId)}`}>Back to strategy</a>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <div className="opacity-70">Draft title</div>
                  <input value={builderTitle} onChange={(e) => setBuilderTitle(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
                </label>
                <label className="space-y-2 text-sm">
                  <div className="opacity-70">Semver</div>
                  <input value={semver} onChange={(e) => setSemver(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
                </label>
              </div>
              <label className="mt-4 block space-y-2 text-sm">
                <div className="opacity-70">Changelog</div>
                <input value={changelog} onChange={(e) => setChangelog(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" placeholder="What changed in this version?" />
              </label>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Workflow steps</h2>
                <div className="flex gap-2">
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
                      <button type="button" onClick={() => removeNode(index)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10">
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-2 text-sm">
                        <div className="opacity-70">Action</div>
                        <select value={node.action} onChange={(e) => updateNode(index, { action: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2">
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
                <textarea value={inputsText} onChange={(e) => setInputsText(e.target.value)} rows={6} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs" />
              </label>
              <label className="mt-4 block space-y-2 text-sm">
                <div className="opacity-70">Limits JSON</div>
                <textarea value={limitsText} onChange={(e) => setLimitsText(e.target.value)} rows={6} className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs" />
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
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={createVersion} disabled={creating || !preview.ok} className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] disabled:opacity-50">
                  {creating ? "Creating…" : "Create version"}
                </button>
                {strategyId && <a href={`/strategies/${encodeURIComponent(strategyId)}`} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">Back to strategy</a>}
              </div>
            </div>
          </div>
        </section>
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
