"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, platformAdmin } from "@/lib/api";
import { adminConsoleHref } from "@/lib/adminConsole";

/** Legacy /admin/* — admins redirect to secret console; everyone else sees 404. */
export default function LegacyAdminCatchAll() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await platformAdmin.overview();
        if (cancelled) return;
        const rest = (pathname || "").replace(/^\/admin\/?/, "");
        router.replace(adminConsoleHref(rest === "overview" ? "" : rest));
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) {
          // stay on 404 UI
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, pathname, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050b10] text-white">
      <div className="text-center">
        <p className="text-6xl font-light text-white/20">404</p>
        <p className="mt-3 text-sm text-white/40">Not found</p>
      </div>
    </div>
  );
}
