import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture · ANCAP",
  description:
    "ANCAP Platform architecture and modules: identity, strategy registry, execution engine, capital ledger, risk DSL, marketplace, reputation and ACP chain.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "ANCAP Platform Architecture",
    description: "ANCAP modules, links to GitHub and Swagger.",
    url: "/projects",
    type: "website",
  },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
