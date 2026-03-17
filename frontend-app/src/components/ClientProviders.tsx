"use client";

import { LanguageProvider } from "./LanguageProvider";
import { AuthProvider } from "./AuthProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </AuthProvider>
  );
}
