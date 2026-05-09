"use client";

import { LanguageProvider } from "./LanguageProvider";
import { AuthProvider } from "./AuthProvider";
import { WalletProvider } from "./WalletProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WalletProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
