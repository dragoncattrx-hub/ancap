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
  (!isProd && rawApiBase) || // dev can be explicitly specified localhost
  (isProd && rawApiBase && !isLoopback ? rawApiBase : undefined) ||
  (process.env.NODE_ENV === "development"
    ? "/api/v1"
    : "https://ancap.cloud/api/v1");
const TOKEN_COOKIE = "ancap_token";
const SAME_ORIGIN_REQUEST_HEADER = "XMLHttpRequest";

function genIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-ignore - lib dom typing may vary
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

// Token management — token is stored in an HttpOnly cookie set by the backend.
// Client-side read only (no JS write — HttpOnly prevents it anyway).
function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + TOKEN_COOKIE.replace(/([$*+?.()|[\]{}\\])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// setToken/clearToken are no-ops — cookie is managed exclusively by the backend.
// Kept as no-ops so existing callers (tests / edge cases) do not break.
function setToken(_token: string): void {
  // intentional no-op
}
function clearToken(): void {
  // intentional no-op; logout calls /auth/logout which clears the cookie server-side
}

// Base fetch wrapper with auth
export class ApiError extends Error {
  status: number;
  code?: string;
  detail?: unknown;

  constructor(message: string, status: number, options?: { code?: string; detail?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Requested-With": SAME_ORIGIN_REQUEST_HEADER,
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let detail = "";
    let detailPayload: unknown = undefined;
    let errorCode = "";
    try {
      const maybeJson = await res.json();
      detailPayload = maybeJson?.detail;
      if (typeof maybeJson?.detail === "string") {
        detail = maybeJson.detail.trim();
      } else if (maybeJson?.detail && typeof maybeJson.detail === "object") {
        const structuredDetail = maybeJson.detail as { code?: unknown; message?: unknown };
        if (typeof structuredDetail.code === "string") {
          errorCode = structuredDetail.code.trim();
        }
        if (typeof structuredDetail.message === "string") {
          detail = structuredDetail.message.trim();
        }
      }
      if (!detail) {
        detail = String(maybeJson?.message || "").trim();
      }
    } catch {
      // If upstream/proxy returns HTML/plain text, expose short readable snippet.
      const raw = (await res.text().catch(() => "")).trim();
      if (raw) {
        detail = raw
          .replace(/\s+/g, " ")
          .replace(/<[^>]+>/g, "")
          .slice(0, 180)
          .trim();
      }
    }
    const baseMessage = `API error ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`;
    throw new ApiError(detail ? `${baseMessage}: ${detail}` : baseMessage, res.status, {
      code: errorCode || undefined,
      detail: detailPayload,
    });
  }

  return res.json();
}

// Auth API
export const auth = {
  async login(email: string, password: string, turnstileToken?: string) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, turnstile_token: turnstileToken }),
    });
    setToken(data.access_token);
    return data;
  },

  async walletNonce(address: string, chain_id?: number, domain?: string, uri?: string, turnstileToken?: string) {
    return apiFetch("/auth/wallet/nonce", {
      method: "POST",
      body: JSON.stringify({ address, chain_id, domain, uri, turnstile_token: turnstileToken }),
    });
  },

  async walletVerify(challenge_id: string, address: string, signature: string) {
    const data = await apiFetch("/auth/wallet/verify", {
      method: "POST",
      body: JSON.stringify({ challenge_id, address, signature }),
    });
    setToken(data.access_token);
    return data;
  },

  async walletLink(challenge_id: string, address: string, signature: string) {
    return apiFetch("/auth/wallet/link", {
      method: "POST",
      body: JSON.stringify({ challenge_id, address, signature }),
    });
  },

  async forgotPassword(email: string, turnstileToken?: string) {
    return apiFetch("/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email, turnstile_token: turnstileToken }),
    });
  },

  async resetPassword(token: string, password: string, turnstileToken?: string) {
    return apiFetch("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ token, password, turnstile_token: turnstileToken }),
    });
  },

  async recoverPasswordWithWallet(challenge_id: string, address: string, signature: string, newPassword: string) {
    return apiFetch("/auth/password/recover-with-wallet", {
      method: "POST",
      body: JSON.stringify({ challenge_id, address, signature, new_password: newPassword }),
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiFetch("/auth/password/change", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },

  async register(email: string, password: string, display_name: string, referral_code?: string, turnstileToken?: string) {
    const data = await apiFetch("/auth/users", {
      method: "POST",
      body: JSON.stringify({ email, password, display_name, referral_code, turnstile_token: turnstileToken }),
    });
    if (data?.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  async logout() {
    clearToken();
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: "{}",
      });
    } catch {
      // best-effort
    }
    // Also clear cookie client-side for immediate effect
    if (typeof document !== "undefined") {
      document.cookie = `${TOKEN_COOKIE}=; Max-Age=0; path=/; SameSite=Strict`;
    }
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
    owner_agent_id: string;
    vertical_id: string;
    summary?: string;
    tags?: string[];
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
    semver: string;
    workflow: Record<string, any>;
    param_schema?: Record<string, any>;
    changelog?: string;
    strategy_policy?: Record<string, any>;
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

// ACP Wallet API
export const walletAcp = {
  async getDepositAddress() {
    return apiFetch("/wallet/acp/deposit_address", { method: "POST" });
  },

  async getHotBalance() {
    return apiFetch("/wallet/acp/hot/balance");
  },

  async getBalance(params?: { address?: string }) {
    const qp = new URLSearchParams();
    if (params?.address) qp.append("address", params.address);
    const suffix = qp.toString();
    return apiFetch(`/wallet/acp/balance${suffix ? `?${suffix}` : ""}`);
  },

  async listTransactions(params?: { address?: string; limit?: number }) {
    const qp = new URLSearchParams();
    if (params?.address) qp.append("address", params.address);
    if (params?.limit != null) qp.append("limit", String(params.limit));
    const suffix = qp.toString();
    return apiFetch(`/wallet/acp/transactions${suffix ? `?${suffix}` : ""}`);
  },

  async getTransaction(txid: string) {
    return apiFetch(`/wallet/acp/transactions/${encodeURIComponent(txid)}`);
  },

  async withdraw(data: { to_address: string; amount_acp: string; wallet_password: string; fee_acp?: string }) {
    return apiFetch("/wallet/acp/withdraw", {
      method: "POST",
      body: JSON.stringify({
        to_address: data.to_address,
        amount_acp: data.amount_acp,
        fee_acp: data.fee_acp,
        wallet_password: data.wallet_password,
      }),
    });
  },

  async swapQuote(data: { usdt_trc20_amount: string }) {
    return apiFetch("/wallet/acp/swap/quote", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async createSwapOrder(data: { usdt_trc20_amount: string; payout_acp_address: string; note?: string }) {
    return apiFetch("/wallet/acp/swap/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async listSwapOrders() {
    return apiFetch("/wallet/acp/swap/orders");
  },

  async getSwapOrder(orderId: string) {
    return apiFetch(`/wallet/acp/swap/orders/${orderId}`);
  },

  async confirmSwapOrder(orderId: string, data: { tron_txid?: string }) {
    return apiFetch(`/wallet/acp/swap/orders/${orderId}/confirm`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async cancelSwapOrder(orderId: string) {
    return apiFetch(`/wallet/acp/swap/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};

/** wACP / BSC custodial clearing rail (see docs/bridge-spec-v1.md). */
export const bridgeRail = {
  async status() {
    return apiFetch("/bridge/status");
  },
  async reserveSummary() {
    return apiFetch("/bridge/reserve-summary");
  },
  async createIntentAcpToBsc(data: { user_bsc_address: string; amount_acp: string; user_acp_address?: string }) {
    return apiFetch("/bridge/intents/acp-to-bsc", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async createIntentBscToAcp(data: { user_bsc_address: string; user_acp_address: string; amount_wacp: string }) {
    return apiFetch("/bridge/intents/bsc-to-acp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async quoteBscToAcp(data: { amount_wacp: string }) {
    return apiFetch("/bridge/quote/bsc-to-acp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async listMyIntents(limit = 50) {
    return apiFetch(`/bridge/intents/me?limit=${encodeURIComponent(String(limit))}`);
  },
};

export const stakes = {
  async list(agent_id?: string) {
    const params = new URLSearchParams();
    if (agent_id) params.append("agent_id", agent_id);
    const suffix = params.toString();
    return apiFetch(`/stakes${suffix ? `?${suffix}` : ""}`);
  },
  async create(data: { agent_id: string; amount: string; currency?: string }) {
    const params = new URLSearchParams({ agent_id: data.agent_id });
    return apiFetch(`/stakes/user/stake?${params.toString()}`, {
      method: "POST",
      body: JSON.stringify({ amount: data.amount, currency: data.currency || "ACP" }),
    });
  },
  async release(stake_id: string) {
    return apiFetch(`/stakes/user/${stake_id}/release`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};

// Reputation API
export const reputation = {
  async get(subjectType: string, subjectId: string, window = "90d") {
    return apiFetch(`/reputation?subject_type=${subjectType}&subject_id=${subjectId}&window=${window}`);
  },

  async getEvents(params: { subjectType: string; subjectId: string; limit?: number; cursor?: string }) {
    const limit = params.limit ?? 50;
    const qp = new URLSearchParams({
      subject_type: params.subjectType,
      subject_id: params.subjectId,
      limit: String(limit),
    });
    if (params.cursor) qp.append("cursor", params.cursor);
    return apiFetch(`/reputation/events?${qp.toString()}`);
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

// Growth Layer API
export const onboardingGrowth = {
  async faucetClaim(data: { currency?: string; amount?: string; agent_id?: string; user_id?: string }) {
    return apiFetch("/onboarding/faucet/claim", {
      method: "POST",
      body: JSON.stringify({ currency: "ACP", amount: "10", ...data }),
    });
  },
  async starterPackAssign(data: { starter_pack_code?: string; agent_id?: string; user_id?: string }) {
    return apiFetch("/onboarding/starter-pack/assign", {
      method: "POST",
      body: JSON.stringify({ starter_pack_code: "default", ...data }),
    });
  },
  async quickstartRun(data: { owner_agent_id: string; idempotency_key?: string }) {
    const idk = data.idempotency_key || genIdempotencyKey();
    return apiFetch("/onboarding/quickstart/run", {
      method: "POST",
      headers: { "Idempotency-Key": idk },
      body: JSON.stringify({ owner_agent_id: data.owner_agent_id }),
    });
  },
};

export const growthSocial = {
  async followStrategy(target_id: string, as_agent_id?: string) {
    return apiFetch("/social/strategies/follow", { method: "POST", body: JSON.stringify({ target_id, as_agent_id }) });
  },
  async unfollowStrategy(target_id: string, as_agent_id?: string) {
    return apiFetch("/social/strategies/unfollow", { method: "POST", body: JSON.stringify({ target_id, as_agent_id }) });
  },
  async followAgent(target_id: string, as_agent_id?: string) {
    return apiFetch("/social/agents/follow", { method: "POST", body: JSON.stringify({ target_id, as_agent_id }) });
  },
  async unfollowAgent(target_id: string, as_agent_id?: string) {
    return apiFetch("/social/agents/unfollow", { method: "POST", body: JSON.stringify({ target_id, as_agent_id }) });
  },
  async copyStrategy(source_strategy_id: string, as_agent_id?: string, new_name?: string) {
    return apiFetch("/social/strategies/copy", {
      method: "POST",
      body: JSON.stringify({ source_strategy_id, as_agent_id, new_name }),
    });
  },
};

export const growthPublic = {
  async getAgent(id: string) {
    return apiFetch(`/public/agents/${id}`);
  },
  async getStrategy(id: string) {
    return apiFetch(`/public/strategies/${id}`);
  },
  async getFeed(limit = 50) {
    return apiFetch(`/public/feed/public?limit=${limit}`);
  },
};

export const growthNotifications = {
  async list(limit = 50) {
    return apiFetch(`/notifications?limit=${limit}`);
  },
  async markRead(id: string) {
    return apiFetch(`/notifications/${id}/read`, { method: "POST" });
  },
};

export const growthLeaderboards = {
  async get(board_type: string, limit = 50) {
    return apiFetch(`/leaderboards/${board_type}?limit=${limit}`);
  },
};

export const growthTasks = {
  async feed(limit = 50) {
    return apiFetch(`/tasks/feed?limit=${limit}`);
  },
};

export const growthDashboard = {
  async metrics(days = 7) {
    return apiFetch(`/system/growth-metrics?days=${days}`);
  },
};

export const referrals = {
  async createCode(owner_agent_id?: string) {
    return apiFetch("/referrals/codes/create", {
      method: "POST",
      body: JSON.stringify({ owner_agent_id }),
    });
  },
  async listMyAttributions(limit = 50) {
    return apiFetch(`/referrals/me/attributions?limit=${limit}`);
  },
  async mySummary() {
    return apiFetch("/referrals/me/summary");
  },
  async listMyRewards(limit = 50) {
    return apiFetch(`/referrals/me/rewards?limit=${limit}`);
  },
};

export const workflowStore = {
  async listTemplates() {
    return apiFetch("/workflow-store/templates");
  },
  async listBundles() {
    return apiFetch("/workflow-store/bundles");
  },
  async getBundle(slug: string) {
    return apiFetch(`/workflow-store/bundles/${slug}`);
  },
  async checkoutBundle(slug: string, data: {
    payment_currency?: string;
    payment_method?: string;
    project_name?: string;
    unlock_full_result?: boolean;
    reserve_credits?: boolean;
    inputs_by_workflow?: Record<string, Record<string, any>>;
    note?: string;
  }) {
    return apiFetch(`/workflow-store/bundles/${slug}/checkout`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async listCreditPackages() {
    return apiFetch("/workflow-store/credit-packages");
  },
  async getCreditPackage(slug: string) {
    return apiFetch(`/workflow-store/credit-packages/${slug}`);
  },
  async createCreditTopUpIntent(slug: string, data: {
    payment_currency?: string;
    payment_method?: string;
    note?: string;
  } = {}) {
    return apiFetch(`/workflow-store/credit-packages/${slug}/top-up-intents`, {
      method: "POST",
      body: JSON.stringify({
        payment_method: "manual",
        ...data,
      }),
    });
  },
  async confirmCreditTopUpIntent(id: string, data: {
    payment_reference: string;
    note?: string;
  }) {
    return apiFetch(`/workflow-store/top-up-intents/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async listAdminTopUpIntents(status = "requires_payment", limit = 50) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status) params.set("status", status);
    return apiFetch(`/workflow-store/admin/top-up-intents?${params.toString()}`);
  },
  async approveCreditTopUpIntent(id: string, data: {
    payment_reference: string;
    note?: string;
  }) {
    return apiFetch(`/workflow-store/admin/top-up-intents/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async getTemplate(slug: string) {
    return apiFetch(`/workflow-store/templates/${slug}`);
  },
  async listRuns(limit = 20) {
    return apiFetch(`/workflow-store/runs?limit=${limit}`);
  },
  async getRun(id: string) {
    return apiFetch(`/workflow-store/runs/${id}`);
  },
  async createRun(data: {
    workflow_slug: string;
    payment_currency?: string;
    unlock_full_result?: boolean;
    inputs?: Record<string, any>;
  }) {
    return apiFetch("/workflow-store/runs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateRunStatus(id: string, status: "quoted" | "paid" | "queued" | "running" | "completed" | "failed" | "cancelled") {
    return apiFetch(`/workflow-store/runs/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },
  async executeRun(id: string) {
    return apiFetch(`/workflow-store/runs/${id}/execute`, {
      method: "POST",
    });
  },
  async confirmRunPayment(id: string, data: {
    payment_reference: string;
    payment_method?: string;
    payment_amount?: { amount: string; currency: string };
    note?: string;
  }) {
    return apiFetch(`/workflow-store/runs/${id}/confirm-payment`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async createPaymentIntent(id: string, data: {
    payment_method?: string;
    payment_reference?: string;
    note?: string;
  } = {}) {
    return apiFetch(`/workflow-store/runs/${id}/payment-intents`, {
      method: "POST",
      body: JSON.stringify({
        payment_method: "credits",
        ...data,
      }),
    });
  },
  async retrySettlement(id: string) {
    return apiFetch(`/workflow-store/runs/${id}/retry-settlement`, {
      method: "POST",
    });
  },
  async repeatRun(id: string) {
    return apiFetch(`/workflow-store/runs/${id}/repeat`, {
      method: "POST",
    });
  },
  async getReceiptTrail(id: string) {
    return apiFetch(`/workflow-store/runs/${id}/receipt-trail`);
  },
  async getProofBundle(id: string) {
    return apiFetch(`/workflow-store/runs/${id}/proof-bundle`);
  },
  runEventsUrl(id: string) {
    const params = new URLSearchParams();
    const token = getToken();
    if (token) params.set("token", token);
    const query = params.toString();
    return `${API_BASE}/workflow-store/runs/${encodeURIComponent(id)}/events${query ? `?${query}` : ""}`;
  },
  async revenueSummary(days = 30) {
    return apiFetch(`/workflow-store/admin/revenue?days=${encodeURIComponent(String(days))}`);
  },
  revenueExportUrl(days = 30) {
    return `${API_BASE}/workflow-store/admin/revenue/export?days=${encodeURIComponent(String(days))}`;
  },
  async revenueExportCsv(days = 30) {
    const token = getToken();
    const res = await fetch(this.revenueExportUrl(days), {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      let message = `API request failed with ${res.status}`;
      try {
        const payload = await res.json();
        if (typeof payload?.detail === "string" && payload.detail.trim()) {
          message = payload.detail.trim();
        }
      } catch {
        // CSV export errors are JSON when possible, but keep a stable fallback.
      }
      throw new ApiError(message, res.status);
    }
    return res.blob();
  },
};

export const search = {
  async query(q: string, type?: string, limit = 20, offset = 0) {
    const params = new URLSearchParams({ q, limit: String(limit), offset: String(offset) });
    if (type) params.set("type", type);
    return apiFetch(`/search?${params.toString()}`);
  },
};

export const audit = {
  async list(params: { type?: string; days?: number; limit?: number; offset?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.days) searchParams.set("days", String(params.days));
    if (params.type) searchParams.set("type", params.type);
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.offset) searchParams.set("offset", String(params.offset));
    return apiFetch(`/admin/audit-log?${searchParams.toString()}`);
  },
  exportUrl(params: { type?: string; days?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.days) searchParams.set("days", String(params.days));
    if (params.type) searchParams.set("type", params.type);
    return `${API_BASE}/admin/audit-log/export?${searchParams.toString()}`;
  },
};

export const paidApi = {
  async listProducts() {
    return apiFetch("/paid-api/products");
  },
  async listMyUsage(limit = 50) {
    return apiFetch(`/paid-api/me/usage?limit=${encodeURIComponent(String(limit))}`);
  },
  usageExportUrl(limit = 500) {
    return `${API_BASE}/paid-api/me/usage/export?limit=${encodeURIComponent(String(limit))}`;
  },
  async setSpendCap(agentId: string, data: { currency?: string; monthly_cap?: string | null }) {
    return apiFetch(`/paid-api/agents/${encodeURIComponent(agentId)}/spend-cap`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export const organizations = {
  async list() {
    return apiFetch("/organizations");
  },
  async get(id: string) {
    return apiFetch(`/organizations/${encodeURIComponent(id)}`);
  },
  async create(data: { name: string; description?: string }) {
    return apiFetch("/organizations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async update(id: string, data: { name?: string; description?: string | null; billing_wallet_address?: string | null }) {
    return apiFetch(`/organizations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async remove(id: string) {
    return apiFetch(`/organizations/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  async listMembers(id: string) {
    return apiFetch(`/organizations/${encodeURIComponent(id)}/members`);
  },
  async addMember(id: string, data: { email: string; role: string }) {
    return apiFetch(`/organizations/${encodeURIComponent(id)}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateMemberRole(id: string, userId: string, data: { role: string }) {
    return apiFetch(`/organizations/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}/role`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async removeMember(id: string, userId: string) {
    return apiFetch(`/organizations/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
  },
};

export const webhooks = {
  async list() {
    return apiFetch("/webhooks");
  },
  async get(id: string) {
    return apiFetch(`/webhooks/${encodeURIComponent(id)}`);
  },
  async create(data: { url: string; event_types: string[]; description?: string }) {
    return apiFetch("/webhooks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async remove(id: string) {
    return apiFetch(`/webhooks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  async rotateSecret(id: string) {
    return apiFetch(`/webhooks/${encodeURIComponent(id)}/rotate-secret`, {
      method: "POST",
    });
  },
  async listDeliveries(id: string, limit = 50) {
    return apiFetch(`/webhooks/${encodeURIComponent(id)}/deliveries?limit=${encodeURIComponent(String(limit))}`);
  },
  async sendTest(id: string) {
    return apiFetch(`/webhooks/${encodeURIComponent(id)}/test`, {
      method: "POST",
    });
  },
};

export const system = {
  async fees() {
    return apiFetch("/system/fees");
  },
  async stakingEconomics() {
    return apiFetch("/system/staking-economics");
  },
};

export const decisionLogs = {
  async list(limit = 100, scope?: string, reason_code?: string) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (scope) params.append("scope", scope);
    if (reason_code) params.append("reason_code", reason_code);
    return apiFetch(`/system/decision-logs?${params.toString()}`);
  },
};

export const governance = {
  async listProposals(status?: string, limit = 100) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status && status !== "all") params.append("status", status);
    return apiFetch(`/governance/proposals?${params.toString()}`);
  },
  async createProposal(data: {
    kind: string;
    target_type: string;
    target_id?: string;
    payload_json: Record<string, any>;
  }) {
    return apiFetch("/governance/proposals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async submitProposal(id: string) {
    return apiFetch(`/governance/proposals/${id}/submit`, { method: "POST" });
  },
  async voteProposal(id: string, vote: "approve" | "reject" | "abstain", reason?: string) {
    return apiFetch(`/governance/proposals/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ vote, reason }),
    });
  },
  async decideProposal(id: string, decision: "active" | "rejected" | "appealed", reason?: string) {
    return apiFetch(`/governance/proposals/${id}/decide`, {
      method: "POST",
      body: JSON.stringify({ decision, reason }),
    });
  },
  async getProposalAudit(id: string, limit = 200) {
    return apiFetch(`/governance/proposals/${id}/audit?limit=${limit}`);
  },
  async listModerationCases(status?: string, limit = 100) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status && status !== "all") params.append("status", status);
    return apiFetch(`/moderation/cases?${params.toString()}`);
  },
  async openModerationCase(data: { subject_type: string; subject_id: string; reason_code: string }) {
    return apiFetch("/moderation/cases", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async resolveModerationCase(id: string, status: "resolved" | "appealed" | "rejected", resolution?: string) {
    return apiFetch(`/moderation/cases/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status, resolution }),
    });
  },
  async applyModerationAction(data: {
    target_type: "agent" | "strategy" | "listing" | "vertical" | "pool";
    target_id: string;
    action: "suspend" | "unsuspend" | "quarantine" | "unquarantine" | "halt" | "unhalt" | "reject";
    reason?: string;
  }) {
    return apiFetch("/moderation/actions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async graphEnforcementPreview(limit = 50) {
    return apiFetch(`/moderation/graph-enforcement/preview?limit=${limit}`);
  },
};

export const evolution = {
  async createMutation(data: { parent_strategy_id: string; mutation_type?: string; diff_spec?: Record<string, any> }) {
    return apiFetch("/evolution/mutations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async lineage(strategy_id: string, limit = 100) {
    return apiFetch(`/evolution/strategies/${strategy_id}/lineage?limit=${limit}`);
  },
};

export const competitions = {
  async createTournament(data: { name: string; scoring_metric?: string }) {
    return apiFetch("/competitions/tournaments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async addEntry(tournament_id: string, data: { strategy_id: string; agent_id?: string }) {
    return apiFetch(`/competitions/tournaments/${tournament_id}/entries`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async leaderboard(tournament_id: string, limit = 100) {
    return apiFetch(`/competitions/tournaments/${tournament_id}/leaderboard?limit=${limit}`);
  },
};

export const bounties = {
  async createReport(data: { reporter_agent_id?: string; title: string; description: string; severity?: string }) {
    return apiFetch("/bounties/reports", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async listReports(limit = 100) {
    return apiFetch(`/bounties/reports?limit=${limit}`);
  },
};

export const settlements = {
  async listReceipts(limit = 100, status?: string) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status) params.append("status", status);
    return apiFetch(`/settlements/receipts?${params.toString()}`);
  },
};

export const autonomy = {
  async anomalies() {
    return apiFetch("/autonomy/ops/anomalies");
  },
  async applyRemediation(action: string) {
    return apiFetch("/autonomy/ops/remediations/apply", {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  },
  async councilRecommend(subject: string, evidence: string) {
    return apiFetch("/autonomy/ai-council/recommend", {
      method: "POST",
      body: JSON.stringify({ subject, evidence }),
    });
  },
  async compileStrategy(prompt: string) {
    return apiFetch("/autonomy/strategy-compiler/compile", {
      method: "POST",
      body: JSON.stringify({ prompt }),
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
  walletAcp,
  bridgeRail,
  stakes,
  reputation,
  listings,
  orders,
  access,
  contracts,
  funds,
  flows,
  onboardingGrowth,
  growthSocial,
  growthPublic,
  growthNotifications,
  growthLeaderboards,
  growthTasks,
  growthDashboard,
  referrals,
  organizations,
  webhooks,
  system,
  decisionLogs,
  governance,
  evolution,
  competitions,
  bounties,
  settlements,
  autonomy,
};
