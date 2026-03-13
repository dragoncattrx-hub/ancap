// Prefer an explicit URL if provided, otherwise use same-origin /api.
// This avoids "Failed to fetch" on production where the backend is served via https://ancap.cloud/api.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
const TOKEN_KEY = "ancap_token";

// Token management
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// Base fetch wrapper with auth
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// Auth API
export const auth = {
  async login(email: string, password: string) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    return data;
  },

  async register(email: string, password: string, display_name: string) {
    return apiFetch("/auth/users", {
      method: "POST",
      body: JSON.stringify({ email, password, display_name }),
    });
  },

  logout() {
    clearToken();
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  getToken,
};

// Agents API
export const agents = {
  async list(limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    return apiFetch(`/agents?${params}`);
  },

  async get(id: string) {
    return apiFetch(`/agents/${id}`);
  },

  async create(data: {
    display_name: string;
    public_key: string;
    roles: string[];
    metadata?: Record<string, any>;
    attestation_id?: string;
  }) {
    return apiFetch("/agents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getGraphMetrics(id: string) {
    return apiFetch(`/agents/${id}/graph-metrics`);
  },
};

// Strategies API
export const strategies = {
  async list(limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    return apiFetch(`/strategies?${params}`);
  },

  async get(id: string) {
    return apiFetch(`/strategies/${id}`);
  },

  async create(data: {
    name: string;
    description?: string;
    agent_id: string;
    vertical_id: string;
    workflow_json: Record<string, any>;
    strategy_policy?: Record<string, any>;
  }) {
    return apiFetch("/strategies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getVersions(id: string, limit = 50) {
    return apiFetch(`/strategies/${id}/versions?limit=${limit}`);
  },

  async createVersion(strategyId: string, data: {
    workflow_json: Record<string, any>;
    changelog?: string;
  }) {
    return apiFetch(`/strategies/${strategyId}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Runs API
export const runs = {
  async list(limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    return apiFetch(`/runs?${params}`);
  },

  async get(id: string) {
    return apiFetch(`/runs/${id}`);
  },

  async create(data: {
    strategy_version_id: string;
    pool_id: string;
    inputs?: Record<string, any>;
    dry_run?: boolean;
  }) {
    return apiFetch("/runs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getLogs(id: string) {
    return apiFetch(`/runs/${id}/logs`);
  },

  async getSteps(id: string) {
    return apiFetch(`/runs/${id}/steps`);
  },

  async getArtifacts(id: string) {
    return apiFetch(`/runs/${id}/artifacts`);
  },
};

// Pools API
export const pools = {
  async list(limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    return apiFetch(`/pools?${params}`);
  },

  async get(id: string) {
    return apiFetch(`/pools/${id}`);
  },

  async create(data: {
    name: string;
    description?: string;
    vertical_id: string;
    policy_json?: Record<string, any>;
  }) {
    return apiFetch("/pools", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Verticals API
export const verticals = {
  async list() {
    return apiFetch("/verticals");
  },

  async get(id: string) {
    return apiFetch(`/verticals/${id}`);
  },
};

// Ledger API
export const ledger = {
  async getAccounts(limit = 50) {
    return apiFetch(`/ledger/accounts?limit=${limit}`);
  },

  async getAccount(id: string) {
    return apiFetch(`/ledger/accounts/${id}`);
  },

  async getEvents(accountId?: string, limit = 50) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (accountId) params.append("account_id", accountId);
    return apiFetch(`/ledger/events?${params}`);
  },

  async deposit(data: {
    account_id: string;
    amount: string;
    currency: string;
    idempotency_key: string;
  }) {
    return apiFetch("/ledger/deposit", {
      method: "POST",
      headers: {
        "Idempotency-Key": data.idempotency_key,
      },
      body: JSON.stringify({
        account_id: data.account_id,
        amount: data.amount,
        currency: data.currency,
      }),
    });
  },
};

// Reputation API
export const reputation = {
  async get(subjectType: string, subjectId: string, window = "90d") {
    return apiFetch(`/reputation?subject_type=${subjectType}&subject_id=${subjectId}&window=${window}`);
  },

  async getEvents(limit = 50) {
    return apiFetch(`/reputation/events?limit=${limit}`);
  },
};

// Convenience aggregate export
export const api = {
  auth,
  agents,
  strategies,
  runs,
  pools,
  verticals,
  ledger,
  reputation,
};

