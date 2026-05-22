"use client";

import { useEffect } from "react";
import { LanguageProvider } from "./LanguageProvider";
import { AuthProvider } from "./AuthProvider";
import { WalletProvider } from "./WalletProvider";
import { ThemeProvider } from "./ThemeProvider";

function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <LanguageProvider>
            <ServiceWorkerRegister />
            {children}
          </LanguageProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
