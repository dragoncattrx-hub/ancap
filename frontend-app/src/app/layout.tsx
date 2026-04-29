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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ANCAP Platform",
    template: "%s · ANCAP",
  },
  description: "AI-Native Capital Allocation Platform",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    siteName: "ANCAP Platform",
    type: "website",
    url: "/",
    title: "ANCAP Platform",
    description: "AI-Native Capital Allocation Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "ANCAP Platform",
    description: "AI-Native Capital Allocation Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ChunkErrorRecovery />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
