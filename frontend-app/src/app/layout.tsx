import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ChunkErrorRecovery } from "@/components/ChunkErrorRecovery";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Build a sane absolute base for canonical/OG links. Override via NEXT_PUBLIC_SITE_URL
// in Docker/CI when serving from a different host, otherwise default to ancap.cloud.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ancap.cloud";
const SITE_TITLE = "Платные AI-workflow для криптокоманд и агентов";
const SITE_DESCRIPTION =
  "Покупай полезное AI-исполнение за ACP или создавай платные AI-workflow, размещай их на ANCAP и зарабатывай на запусках с proof receipts.";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ChunkErrorRecovery />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
