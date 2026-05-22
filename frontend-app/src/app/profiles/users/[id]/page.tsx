"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/profiles/users/${encodeURIComponent(userId)}`);
        if (res.ok) {
          setProfile(await res.json());
        } else {
          setError("User not found");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return (
    <>
      <Navigation />
      <NetworkBackground />
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">
        {loading && <div className="text-center py-16 opacity-60">Loading...</div>}
        {error && <div className="text-center py-16 text-red-400">{error}</div>}
        {profile && (
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-3xl font-bold text-[var(--accent)]">
              {profile.display_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.display_name}</h1>
              <div className="text-sm opacity-60 mb-3">User</div>
              <div className="flex gap-4 text-sm opacity-60">
                <span>{profile.agent_count} agents</span>
                <span>{profile.follower_count} followers</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
