// Prefer an explicit URL if provided.
// Fallbacks:
// - development: same-origin /api/v1 (proxied to localhost:8000/v1 by next.config.ts)
// - production: ancap.cloud API gateway
const rawApiBase = process.env.NEXT_PUBLIC_API_URL;
const isProd = process.env.NODE_ENV === "production";
const isLoopback =
  rawApiBase &&
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(rawApiBase);

const API_BASE =
  (!isProd && rawApiBase) || // в dev можно явно указывать localhost
  (isProd && rawApiBase && !isLoopback ? rawApiBase : undefined) ||
  (process.env.NODE_ENV === "development"
    ? "/api/v1"
    : "https://ancap.cloud/api/v1");
const TOKEN_KEY = "ancap_token";

function genIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-ignore - lib dom typing may vary
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

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

export const users = {
  async me() {
    return apiFetch("/users/me");
  },
};

// Agents API
export const agents = {
  async list(limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    return apiFetch(`/agents?${params}`);
  },

  async listMine(limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString(), mine: "true" });
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

export const strategyVersions = {
  async get(id: string) {
    return apiFetch(`/strategy-versions/${id}`);
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
    contract_id?: string;
    contract_milestone_id?: string;
    params?: Record<string, any>;
    limits?: Record<string, any>;
    dry_run?: boolean;
    run_mode?: "mock" | "backtest";
    idempotency_key?: string;
  }) {
    const idk = data.idempotency_key || genIdempotencyKey();
    return apiFetch("/runs", {
      method: "POST",
      headers: {
        "Idempotency-Key": idk,
      },
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

  async getBalance(owner_type: string, owner_id: string) {
    const params = new URLSearchParams({ owner_type, owner_id });
    return apiFetch(`/ledger/balance?${params}`);
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

// Listings API
export const listings = {
  async list(limit = 50, cursor?: string, status?: string, strategy_id?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    if (status) params.append("status", status);
    if (strategy_id) params.append("strategy_id", strategy_id);
    return apiFetch(`/listings?${params}`);
  },

  async get(id: string) {
    return apiFetch(`/listings/${id}`);
  },

  async create(data: {
    strategy_id: string;
    strategy_version_id: string;
    fee_model: Record<string, any>;
    status?: string;
    terms_url?: string;
    notes?: string;
  }) {
    return apiFetch("/listings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Orders API
export const orders = {
  async list(limit = 50, cursor?: string, buyer_type?: string, buyer_id?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    if (buyer_type) params.append("buyer_type", buyer_type);
    if (buyer_id) params.append("buyer_id", buyer_id);
    return apiFetch(`/orders?${params}`);
  },

  async place(data: {
    listing_id: string;
    buyer_type: "user" | "agent" | "pool";
    buyer_id: string;
    payment_method?: string;
    note?: string;
    idempotency_key?: string;
  }) {
    const idk = data.idempotency_key || genIdempotencyKey();
    return apiFetch("/orders", {
      method: "POST",
      headers: {
        "Idempotency-Key": idk,
      },
      body: JSON.stringify(data),
    });
  },
};

// Access grants API
export const access = {
  async listGrants(limit = 50, cursor?: string, grantee_type?: string, grantee_id?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    if (grantee_type) params.append("grantee_type", grantee_type);
    if (grantee_id) params.append("grantee_id", grantee_id);
    return apiFetch(`/access/grants?${params}`);
  },
};

// Contracts API
export const contracts = {
  async list(limit = 50, cursor?: string, employer_agent_id?: string, worker_agent_id?: string, status?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    if (employer_agent_id) params.append("employer_agent_id", employer_agent_id);
    if (worker_agent_id) params.append("worker_agent_id", worker_agent_id);
    if (status) params.append("status", status);
    return apiFetch(`/contracts?${params}`);
  },

  async get(id: string) {
    return apiFetch(`/contracts/${id}`);
  },

  async getPayments(id: string) {
    return apiFetch(`/contracts/${id}/payments`);
  },

  async getRuns(id: string, limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    return apiFetch(`/contracts/${id}/runs?${params}`);
  },

  async getActivity(id: string, limit = 200) {
    return apiFetch(`/contracts/${id}/activity?limit=${limit}`);
  },

  async create(data: {
    employer_agent_id: string;
    worker_agent_id: string;
    scope_type: string;
    scope_ref_id?: string | null;
    title: string;
    description?: string;
    payment_model: "fixed" | "per_run";
    fixed_amount_value?: string | null;
    currency?: string;
    max_runs?: number | null;
    risk_policy_id?: string | null;
    created_from_order_id?: string | null;
  }) {
    return apiFetch("/contracts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async propose(id: string) {
    return apiFetch(`/contracts/${id}/propose`, { method: "POST" });
  },

  async accept(id: string) {
    return apiFetch(`/contracts/${id}/accept`, { method: "POST" });
  },

  async cancel(id: string) {
    return apiFetch(`/contracts/${id}/cancel`, { method: "POST" });
  },

  async complete(id: string) {
    return apiFetch(`/contracts/${id}/complete`, { method: "POST" });
  },

  async dispute(id: string) {
    return apiFetch(`/contracts/${id}/dispute`, { method: "POST" });
  },
};

// Contract milestones API
export const milestones = {
  async list(contractId: string, limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    return apiFetch(`/milestones/contracts/${contractId}?${params}`);
  },

  async create(contractId: string, data: {
    title: string;
    description?: string;
    order_index?: number;
    amount_value: string;
    currency?: string;
    required_runs?: number | null;
  }) {
    return apiFetch(`/milestones/contracts/${contractId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async submit(id: string) {
    return apiFetch(`/milestones/${id}/submit`, { method: "POST" });
  },

  async accept(id: string) {
    return apiFetch(`/milestones/${id}/accept`, { method: "POST" });
  },

  async reject(id: string) {
    return apiFetch(`/milestones/${id}/reject`, { method: "POST" });
  },

  async cancel(id: string) {
    return apiFetch(`/milestones/${id}/cancel`, { method: "POST" });
  },
};

// Funds API
export const funds = {
  async list(limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    return apiFetch(`/funds?${params}`);
  },

  async get(id: string) {
    return apiFetch(`/funds/${id}`);
  },

  async allocate(fundId: string, data: {
    strategy_version_id: string;
    weight: number;
  }) {
    return apiFetch(`/funds/${fundId}/allocate`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getPerformance(id: string) {
    return apiFetch(`/funds/${id}/performance`);
  },
};

// Flows (scenario runner) API
export const flows = {
  async run(flow_id: "flow1" | "flow2" | "flow3" | "simulation", params: Record<string, any> = {}, seed?: number) {
    return apiFetch("/flows/run", {
      method: "POST",
      body: JSON.stringify({ flow_id, seed, params }),
    });
  },
};

// Convenience aggregate export
export const api = {
  auth,
  users,
  agents,
  strategies,
  strategyVersions,
  runs,
  pools,
  verticals,
  ledger,
  reputation,
  listings,
  orders,
  access,
  contracts,
  funds,
  flows,
};

