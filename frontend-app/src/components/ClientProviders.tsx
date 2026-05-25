"use client";

import { useEffect } from "react";
import { Language, isSupportedLanguage } from "@/locales/translations";
import { LanguageProvider } from "./LanguageProvider";
import { AuthProvider } from "./AuthProvider";
import { WalletProvider } from "./WalletProvider";
import { ThemeProvider } from "./ThemeProvider";
import { CookieConsent } from "./CookieConsent";

function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

export function ClientProviders({ children, initialLang }: { children: React.ReactNode; initialLang?: string }) {
  const resolvedInitialLang: Language = isSupportedLanguage(initialLang) ? initialLang : "en";

  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <LanguageProvider initialLang={resolvedInitialLang}>
            <ServiceWorkerRegister />
            {children}
            <CookieConsent />
          </LanguageProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
