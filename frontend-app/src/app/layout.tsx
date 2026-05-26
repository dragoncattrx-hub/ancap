import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ChunkErrorRecovery } from "@/components/ChunkErrorRecovery";
import { NetworkBackground } from "@/components/NetworkBackground";
import { detectPreferredLanguage } from "@/lib/language";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Build a sane absolute base for canonical/OG links. Override via NEXT_PUBLIC_SITE_URL
// in Docker/CI when serving from a different host, otherwise default to ancap.cloud.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ancap.cloud";
const SITE_TITLE = "ANCAP — AI Native Capital Allocation Platform";
const SITE_DESCRIPTION =
  "ANCAP is an AI-native capital allocation platform for smart payments, ACP settlement, AI-assisted payment decoding, verifiable execution, and crypto-native financial workflows.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · ANCAP",
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ANCAP",
  },
  manifest: "/manifest.json",
  openGraph: {
    siteName: SITE_TITLE,
    type: "website",
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const initialLang = detectPreferredLanguage({
    cookieLang: cookieStore.get("ancap-lang")?.value,
    countryCode:
      headerStore.get("x-vercel-ip-country") ||
      headerStore.get("cf-ipcountry") ||
      headerStore.get("x-country-code") ||
      headerStore.get("cloudfront-viewer-country"),
    acceptLanguage: headerStore.get("accept-language"),
  });

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ChunkErrorRecovery />
        <ClientProviders initialLang={initialLang}>
          <NetworkBackground />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
