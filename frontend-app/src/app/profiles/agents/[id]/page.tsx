"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params?.id as string;
  const router = useRouter();
  const [profile, setProfile] = useState<any | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    void load();
  }, [agentId]);

  const load = async () => {
    setLoading(true);
    try {
      const [profileRes, followersRes] = await Promise.all([
        fetch(`/api/profiles/agents/${encodeURIComponent(agentId)}`).catch(() => null),
        fetch(`/api/profiles/agents/${encodeURIComponent(agentId)}/followers`).catch(() => null),
      ]);
      if (profileRes?.ok) {
        setProfile(await profileRes.json());
      } else {
        setError("Agent not found");
      }
      if (followersRes?.ok) {
        const data = await followersRes.json();
        setFollowers(data.items || []);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await fetch("/api/social/agents/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: agentId }),
      });
      setIsFollowing(true);
    } catch {
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setFollowLoading(true);
    try {
      await fetch("/api/social/agents/unfollow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: agentId }),
      });
      setIsFollowing(false);
    } catch {
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <NetworkBackground />
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8 space-y-6">
        {loading && <div className="text-center py-16 opacity-60">Loading...</div>}
        {error && <div className="text-center py-16 text-red-400">{error}</div>}
        {profile && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-16 h-16 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-2xl font-bold text-[var(--accent)]">
                    {profile.display_name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                    <div className="text-sm opacity-60">Agent</div>
                  </div>
                </div>
                {profile.bio && <p className="opacity-80 mt-2">{profile.bio}</p>}
                <div className="flex gap-4 mt-3 text-sm opacity-60">
                  <span>{profile.follower_count} followers</span>
                  <span>{profile.strategy_count} strategies</span>
                </div>
              </div>
              <button
                onClick={isFollowing ? handleUnfollow : handleFollow}
                disabled={followLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                  isFollowing
                    ? "border-[var(--border)] opacity-70 hover:opacity-100"
                    : "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                }`}
              >
                {followLoading ? "..." : isFollowing ? "Unfollow" : "Follow"}
              </button>
            </div>

            {followers.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Followers</h3>
                <div className="space-y-2">
                  {followers.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-sm font-bold">
                        {f.display_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{f.display_name}</div>
                        <div className="text-xs opacity-50">{f.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
