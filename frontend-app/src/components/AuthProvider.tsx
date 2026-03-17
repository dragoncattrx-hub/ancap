"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, users } from "@/lib/api";

interface User {
  id: string;
  email: string;
  display_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = auth.getToken();
    if (token) {
      const storedUser = localStorage.getItem("ancap_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Token present but user profile not cached yet: treat as authenticated
        // and let users.me() hydrate canonical fields.
        setUser({ id: "", email: "", display_name: "User" });
      }
      // Fetch canonical profile from backend
      users
        .me()
        .then((u) => {
          const userData = { id: u.id, email: u.email, display_name: u.display_name || u.email.split("@")[0] };
          setUser(userData);
          localStorage.setItem("ancap_user", JSON.stringify(userData));
        })
        .catch(() => {
          // token might be stale; keep best-effort local user
        });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await auth.login(email, password);
    const me = await users.me();
    const userData = { id: me.id, email: me.email, display_name: me.display_name || me.email.split("@")[0] };
    setUser(userData);
    localStorage.setItem("ancap_user", JSON.stringify(userData));
  };

  const register = async (email: string, password: string, displayName: string) => {
    await auth.register(email, password, displayName);
    // Auto-login after registration
    await login(email, password);
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    localStorage.removeItem("ancap_user");
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
