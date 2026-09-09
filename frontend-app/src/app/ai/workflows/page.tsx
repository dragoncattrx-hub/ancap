import { fallbackWorkflowBundles, fallbackWorkflowTemplates, type WorkflowBundle, type WorkflowTemplate } from "@/lib/workflowStore";
import { getServerApiBase, serverApiFetch } from "@/lib/serverApi";
import { WorkflowsCatalog } from "./WorkflowsCatalog";

const API_BASE = getServerApiBase();

async function getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  try {
    const res = await serverApiFetch(`${API_BASE}/workflow-store/templates`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return fallbackWorkflowTemplates;
    }

    const data = (await res.json()) as { items: WorkflowTemplate[] };
    return data.items?.length ? data.items : fallbackWorkflowTemplates;
  } catch {
    return fallbackWorkflowTemplates;
  }
}

async function getWorkflowBundles(): Promise<WorkflowBundle[]> {
  try {
    const res = await serverApiFetch(`${API_BASE}/workflow-store/bundles`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return fallbackWorkflowBundles;
    }

    const data = (await res.json()) as { items: WorkflowBundle[] };
    return data.items?.length ? data.items : fallbackWorkflowBundles;
  } catch {
    return fallbackWorkflowBundles;
  }
}

export default async function WorkflowsPage() {
  const workflows = await getWorkflowTemplates();
  const bundles = await getWorkflowBundles();
  return <WorkflowsCatalog workflows={workflows} bundles={bundles} />;
}
