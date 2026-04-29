"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, users } from "@/lib/api";
import { safeGetItem, safeRemoveItem, safeSetItem } from "@/lib/safeStorage";

interface User {
  id: string;
  email: string;
  display_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, displayName: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          safeSetItem("ancap_user", JSON.stringify(userData));
        })
        .catch(() => {
          // Stored token can be expired/revoked; drop stale session to avoid 401 loops.
          auth.logout();
          safeRemoveItem("ancap_user");
          setUser(null);
        });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const loginRes = await auth.login(email, password);
    const me = await users.me();
    const userData = userFromApiPayload(me);
    setUser(userData);
    safeSetItem("ancap_user", JSON.stringify(userData));
    const walletBackupMnemonic =
      loginRes && typeof loginRes === "object" && "wallet_backup_mnemonic" in loginRes
        ? String((loginRes as any).wallet_backup_mnemonic || "")
        : "";
    return walletBackupMnemonic || null;
  };

  const register = async (email: string, password: string, displayName: string) => {
    const created = await auth.register(email, password, displayName);
    const walletBackupMnemonic =
      created && typeof created === "object" && "wallet_backup_mnemonic" in created
        ? String((created as any).wallet_backup_mnemonic || "")
        : "";
    // Auto-login after registration
    const loginBackupMnemonic = await login(email, password);
    return walletBackupMnemonic || loginBackupMnemonic || null;
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    safeRemoveItem("ancap_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
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
