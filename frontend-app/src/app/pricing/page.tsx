import { PricingView } from "@/components/PricingView";
import {
  fallbackWorkflowBundles,
  fallbackWorkflowTemplates,
  type WorkflowBundle,
  type WorkflowTemplate,
} from "@/lib/workflowStore";
import { getServerApiBase, serverApiFetch } from "@/lib/serverApi";

const featuredBundles = ["pro-launch-pack", "agent-commerce-pack", "concierge-pack"];
const featuredWorkflows = ["exchange-listing-submission-pack", "ai-iso-governance-readiness-pack", "token-risk-report-pro"];

const API_BASE = getServerApiBase();

async function getLiveTemplates(): Promise<WorkflowTemplate[]> {
  try {
    const res = await serverApiFetch(`${API_BASE}/workflow-store/templates`, { next: { revalidate: 300 } });
    if (!res.ok) return fallbackWorkflowTemplates;
    const data = (await res.json()) as { items: WorkflowTemplate[] };
    return data.items?.length ? data.items : fallbackWorkflowTemplates;
  } catch {
    return fallbackWorkflowTemplates;
  }
}

async function getLiveBundles(): Promise<WorkflowBundle[]> {
  try {
    const res = await serverApiFetch(`${API_BASE}/workflow-store/bundles`, { next: { revalidate: 300 } });
    if (!res.ok) return fallbackWorkflowBundles;
    const data = (await res.json()) as { items: WorkflowBundle[] };
    return data.items?.length ? data.items : fallbackWorkflowBundles;
  } catch {
    return fallbackWorkflowBundles;
  }
}

function pickFeatured<T extends { slug: string }>(items: T[], featured: string[], fallback: T[]): T[] {
  const picked = items.filter((item) => featured.includes(item.slug));
  return picked.length ? picked : fallback.filter((item) => featured.includes(item.slug));
}

export const metadata = {
  title: "ANCAP Pricing | Paid AI workflows for crypto teams",
  description: "Buy proof-backed AI workflow execution for crypto launch, listing, growth, risk, and agent API monetization.",
};

export default async function PricingPage() {
  const [liveTemplates, liveBundles] = await Promise.all([getLiveTemplates(), getLiveBundles()]);
  const bundles = pickFeatured(liveBundles, featuredBundles, fallbackWorkflowBundles);
  const workflows = pickFeatured(liveTemplates, featuredWorkflows, fallbackWorkflowTemplates);

  return <PricingView bundles={bundles} workflows={workflows} />;
}
