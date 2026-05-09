"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, users } from "@/lib/api";
import { getPreferredEvmProvider } from "@/lib/evmProvider";
import { safeGetItem, safeRemoveItem, safeSetItem } from "@/lib/safeStorage";

interface User {
  id: string;
  email: string;
  display_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isWalletOnlyAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, turnstileToken?: string) => Promise<string | null>;
  register: (email: string, password: string, displayName: string, referralCode?: string, turnstileToken?: string) => Promise<string | null>;
  loginWithWallet: (walletAddress: string, chainId?: number | null, turnstileToken?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const WALLET_ONLY_USER_KEY = "ancap_wallet_only_user";

function userFromApiPayload(u: { id?: string; email?: string; display_name?: string | null }): User {
  const email = typeof u.email === "string" ? u.email : "";
  const display =
    (u.display_name && String(u.display_name)) ||
    (email.includes("@") ? email.split("@")[0] : "") ||
    "User";
  return { id: String(u.id ?? ""), email, display_name: display };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isWalletOnlyAuthenticated, setIsWalletOnlyAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = auth.getToken();
    if (token) {
      const storedUser = safeGetItem("ancap_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as Partial<User>;
          if (parsed && typeof parsed === "object" && "email" in parsed) {
            setUser(userFromApiPayload(parsed));
          } else {
            safeRemoveItem("ancap_user");
          }
        } catch {
          safeRemoveItem("ancap_user");
        }
      } else {
        setUser({ id: "", email: "", display_name: "User" });
      }
      users
        .me()
        .then((u) => {
          const userData = userFromApiPayload(u);
          setUser(userData);
          setIsWalletOnlyAuthenticated(false);
          safeSetItem("ancap_user", JSON.stringify(userData));
          safeRemoveItem(WALLET_ONLY_USER_KEY);
        })
        .catch(() => {
          auth.logout();
          safeRemoveItem("ancap_user");
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    safeRemoveItem(WALLET_ONLY_USER_KEY);
    setIsWalletOnlyAuthenticated(false);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, turnstileToken?: string) => {
    const loginRes = await auth.login(email, password, turnstileToken);
    const me = await users.me();
    const userData = userFromApiPayload(me);
    setUser(userData);
    setIsWalletOnlyAuthenticated(false);
    safeSetItem("ancap_user", JSON.stringify(userData));
    safeRemoveItem(WALLET_ONLY_USER_KEY);
    const walletBackupMnemonic =
      loginRes && typeof loginRes === "object" && "wallet_backup_mnemonic" in loginRes
        ? String((loginRes as any).wallet_backup_mnemonic || "")
        : "";
    return walletBackupMnemonic || null;
  };

  const register = async (email: string, password: string, displayName: string, referralCode?: string, turnstileToken?: string) => {
    const created = await auth.register(email, password, displayName, referralCode, turnstileToken);
    const walletBackupMnemonic =
      created && typeof created === "object" && "wallet_backup_mnemonic" in created
        ? String((created as any).wallet_backup_mnemonic || "")
        : "";
    const me = await users.me();
    const userData = userFromApiPayload(me);
    setUser(userData);
    setIsWalletOnlyAuthenticated(false);
    safeSetItem("ancap_user", JSON.stringify(userData));
    safeRemoveItem(WALLET_ONLY_USER_KEY);
    return walletBackupMnemonic || null;
  };

  const loginWithWallet = async (walletAddress: string, chainId?: number | null, turnstileToken?: string) => {
    const compact = walletAddress.trim().toLowerCase();
    if (!compact) {
      throw new Error("Wallet address is required");
    }
    const provider = getPreferredEvmProvider();
    if (!provider) {
      throw new Error("No injected wallet provider found");
    }

    const accountsRaw = await provider.request({ method: "eth_accounts" });
    const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
    const providerAddress = typeof accounts[0] === "string" ? accounts[0].trim().toLowerCase() : "";

    if (!providerAddress) {
      throw new Error("No connected wallet account found. Reconnect MetaMask and try again.");
    }

    if (providerAddress !== compact) {
      throw new Error(
        `Connected wallet account changed. ANCAP expected ${compact}, but MetaMask is exposing ${providerAddress}. Reconnect the wallet and try again.`
      );
    }

    const chainIdRaw = await provider.request({ method: "eth_chainId" });
    const activeChainId =
      typeof chainIdRaw === "string"
        ? Number.parseInt(chainIdRaw, chainIdRaw.startsWith("0x") || chainIdRaw.startsWith("0X") ? 16 : 10)
        : typeof chainIdRaw === "number"
          ? chainIdRaw
          : undefined;

    const domain = window.location.host;
    const uri = `${window.location.origin}/login`;
    const nonceRes = await auth.walletNonce(providerAddress, activeChainId ?? chainId ?? undefined, domain, uri, turnstileToken);
    const signatureRaw = await provider.request({
      method: "personal_sign",
      params: [nonceRes.message, providerAddress],
    });
    const signature = typeof signatureRaw === "string" ? signatureRaw : "";
    if (!signature) {
      throw new Error("Wallet signature was not returned");
    }

    await auth.walletVerify(nonceRes.challenge_id, providerAddress, signature);
    const me = await users.me();
    const userData = userFromApiPayload(me);
    setUser(userData);
    setIsWalletOnlyAuthenticated(false);
    safeSetItem("ancap_user", JSON.stringify(userData));
    safeRemoveItem(WALLET_ONLY_USER_KEY);
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    setIsWalletOnlyAuthenticated(false);
    safeRemoveItem("ancap_user");
    safeRemoveItem(WALLET_ONLY_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isWalletOnlyAuthenticated,
        isLoading,
        login,
        register,
        loginWithWallet,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
