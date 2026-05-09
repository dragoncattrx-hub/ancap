export type Eip1193Provider = {
  isMetaMask?: boolean;
  isRainbow?: boolean;
  isCoinbaseWallet?: boolean;
  isBraveWallet?: boolean;
  isRabby?: boolean;
  isTrust?: boolean;
  isFrame?: boolean;
  isPhantom?: boolean;
  isTokenPocket?: boolean;
  providers?: Eip1193Provider[];
  _metamask?: {
    isUnlocked?: () => Promise<boolean>;
  };
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

type Eip6963ProviderInfo = {
  uuid?: string;
  name?: string;
  icon?: string;
  rdns?: string;
};

type Eip6963ProviderDetail = {
  info?: Eip6963ProviderInfo;
  provider: Eip1193Provider;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }

  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<Eip6963ProviderDetail>;
  }
}

const discoveredProviders = new Map<string, Eip6963ProviderDetail>();
const discoverySubscribers = new Set<() => void>();
let discoveryListenerAttached = false;

function isProviderCandidate(value: unknown): value is Eip1193Provider {
  return !!value && typeof value === "object" && typeof (value as Eip1193Provider).request === "function";
}

function hasKnownCompetingWalletFlag(provider: Eip1193Provider): boolean {
  return !!(
    provider.isRainbow ||
    provider.isCoinbaseWallet ||
    provider.isBraveWallet ||
    provider.isRabby ||
    provider.isTrust ||
    provider.isFrame ||
    provider.isPhantom ||
    provider.isTokenPocket
  );
}

function isStrongMetaMaskCandidate(provider: Eip1193Provider): boolean {
  if (!provider.isMetaMask) return false;
  if (hasKnownCompetingWalletFlag(provider)) return false;
  return !!provider._metamask && typeof provider._metamask.isUnlocked === "function";
}

function isWeakMetaMaskCandidate(provider: Eip1193Provider): boolean {
  return !!provider.isMetaMask && !hasKnownCompetingWalletFlag(provider);
}

function getAnnouncementKey(detail: Eip6963ProviderDetail): string {
  const rdns = detail.info?.rdns?.trim();
  const uuid = detail.info?.uuid?.trim();
  const name = detail.info?.name?.trim();
  return uuid || rdns || name || `provider-${discoveredProviders.size + 1}`;
}

function notifyDiscoverySubscribers() {
  for (const subscriber of discoverySubscribers) {
    subscriber();
  }
}

function registerDiscoveredProvider(detail: Eip6963ProviderDetail) {
  if (!detail || !isProviderCandidate(detail.provider)) return;
  const key = getAnnouncementKey(detail);
  const existing = discoveredProviders.get(key);
  if (existing?.provider === detail.provider) return;
  discoveredProviders.set(key, detail);
  notifyDiscoverySubscribers();
}

function ensureDiscoveryListener() {
  if (typeof window === "undefined" || discoveryListenerAttached) return;

  const handleAnnounceProvider = (event: Event) => {
    const customEvent = event as CustomEvent<Eip6963ProviderDetail>;
    const detail = customEvent.detail;
    if (!detail) return;
    registerDiscoveredProvider(detail);
  };

  window.addEventListener("eip6963:announceProvider", handleAnnounceProvider as EventListener);
  discoveryListenerAttached = true;
}

export function requestEvmProviderDiscovery() {
  if (typeof window === "undefined") return;
  ensureDiscoveryListener();
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function subscribeEvmProviderDiscovery(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  ensureDiscoveryListener();
  discoverySubscribers.add(listener);
  requestEvmProviderDiscovery();
  return () => {
    discoverySubscribers.delete(listener);
  };
}

function isAnnouncedMetaMask(detail: Eip6963ProviderDetail): boolean {
  const provider = detail.provider;
  if (!isProviderCandidate(provider)) return false;
  if (hasKnownCompetingWalletFlag(provider)) return false;

  const rdns = detail.info?.rdns?.toLowerCase() ?? "";
  const name = detail.info?.name?.toLowerCase() ?? "";

  if (rdns === "io.metamask" || rdns.endsWith(".metamask")) return true;
  if (name.includes("metamask")) return true;
  return false;
}

function getDiscoveredMetaMaskProvider(): Eip1193Provider | undefined {
  const announcedProviders = [...discoveredProviders.values()];

  const exactRdnsMatch = announcedProviders.find((detail) => detail.info?.rdns?.toLowerCase() === "io.metamask" && isAnnouncedMetaMask(detail));
  if (exactRdnsMatch) return exactRdnsMatch.provider;

  const nameMatch = announcedProviders.find(isAnnouncedMetaMask);
  if (nameMatch) return nameMatch.provider;

  return undefined;
}

export function getPreferredEvmProvider(): Eip1193Provider | undefined {
  if (typeof window === "undefined") return undefined;

  requestEvmProviderDiscovery();

  const discoveredMetaMaskProvider = getDiscoveredMetaMaskProvider();
  if (discoveredMetaMaskProvider) return discoveredMetaMaskProvider;

  const injected = window.ethereum;
  if (!isProviderCandidate(injected)) return undefined;

  const providers = Array.isArray(injected.providers)
    ? injected.providers.filter(isProviderCandidate)
    : [];

  const strongMetaMaskProvider = providers.find(isStrongMetaMaskCandidate);
  if (strongMetaMaskProvider) return strongMetaMaskProvider;

  if (isStrongMetaMaskCandidate(injected)) return injected;

  const weakMetaMaskProvider = providers.find(isWeakMetaMaskCandidate);
  if (weakMetaMaskProvider) return weakMetaMaskProvider;

  if (isWeakMetaMaskCandidate(injected)) return injected;

  return undefined;
}
