"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { arenaDesk } from "@/lib/api";

type Market = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  outcome_yes_label: string;
  outcome_no_label: string;
  yes_pool_acp: string;
  no_pool_acp: string;
  bet_count: number;
  contract_hash: string;
};

type HouseGame = {
  id: "coinflip" | "dice";
  label: string;
  choices: string[];
  payout_multiple: string;
  house_edge_bps: number;
};

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  markets: Market[];
  house_games: HouseGame[];
};

function formatAcp(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ACP`;
  return `${n.toLocaleString()} ACP`;
}

export default function ArenaPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [stake, setStake] = useState("10");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const data = (await arenaDesk.catalog()) as Catalog;
      setCatalog(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("arenaPage.loadError"));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBet = async (marketId: string, side: "yes" | "no") => {
    if (!isAuthenticated) {
      setError(t("arenaPage.signInToBet"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await arenaDesk.placeBet(marketId, { side, stake_acp: stake });
      setInfo(
        t("arenaPage.betPlaced")
          .replace("{side}", side.toUpperCase())
          .replace("{stake}", formatAcp(stake))
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("arenaPage.betError"));
    } finally {
      setBusy(false);
    }
  };

  const onHouse = async (game: "coinflip" | "dice", choice: string) => {
    if (!isAuthenticated) {
      setError(t("arenaPage.signInToPlay"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const committed = (await arenaDesk.commitHouse({ game, stake_acp: stake })) as {
        id: string;
        server_seed_hash?: string;
      };
      const clientSeed =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().replace(/-/g, "")
          : `client${Date.now()}${Math.random().toString(16).slice(2)}`;
      const round = (await arenaDesk.revealHouse({
        round_id: committed.id,
        choice,
        client_seed: clientSeed,
      })) as {
        won?: boolean;
        result?: string;
        payout_acp?: string;
        server_seed_hash?: string;
      };
      setInfo(
        t("arenaPage.houseResult")
          .replace("{game}", game)
          .replace("{result}", String(round.result ?? ""))
          .replace("{outcome}", round.won ? t("arenaPage.win") : t("arenaPage.loss"))
          .replace("{payout}", formatAcp(round.payout_acp || "0"))
          .replace("{seed}", round.server_seed_hash?.slice(0, 10) || "")
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("arenaPage.housePlayError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navigation />
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div>
          <p className="text-violet-300 text-sm uppercase tracking-wide">{t("arenaPage.kicker")}</p>
          <h1 className="text-3xl font-semibold mt-1">
            {catalog?.title ?? t("arenaPage.titleFallback")}
          </h1>
          <p className="text-slate-400 mt-2">{catalog?.tagline}</p>
        </div>

        {catalog?.compliance_note ? (
          <p className="text-amber-200/80 text-sm border border-amber-900/50 rounded-lg p-3 bg-amber-950/30">
            {catalog.compliance_note}
          </p>
        ) : null}

        {error ? <p className="text-rose-300 text-sm">{error}</p> : null}
        {info ? <p className="text-emerald-300 text-sm">{info}</p> : null}

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <label className="block text-sm text-slate-300">
            {t("arenaPage.stakeLabel")}
            <input
              className="mt-1 w-full max-w-xs rounded-lg bg-slate-950 border border-slate-700 px-3 py-2"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
            />
          </label>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">{t("arenaPage.marketsTitle")}</h2>
          {(catalog?.markets ?? []).map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <div className="font-medium">{m.title}</div>
              <p className="text-sm text-slate-400">{m.description}</p>
              <p className="text-xs text-slate-500">
                {t("arenaPage.marketPools")
                  .replace("{yes}", formatAcp(m.yes_pool_acp))
                  .replace("{no}", formatAcp(m.no_pool_acp))
                  .replace("{count}", String(m.bet_count))}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || m.status !== "open"}
                  onClick={() => void onBet(m.id, "yes")}
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  {m.outcome_yes_label}
                </button>
                <button
                  type="button"
                  disabled={busy || m.status !== "open"}
                  onClick={() => void onBet(m.id, "no")}
                  className="rounded-lg bg-rose-800 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  {m.outcome_no_label}
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">{t("arenaPage.houseGamesTitle")}</h2>
          {(catalog?.house_games ?? []).map((g) => (
            <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <div className="font-medium">
                {t("arenaPage.houseGameMeta")
                  .replace("{label}", g.label)
                  .replace("{multiple}", g.payout_multiple)
                  .replace("{bps}", String(g.house_edge_bps))}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={busy}
                    onClick={() => void onHouse(g.id, c)}
                    className="rounded-lg border border-violet-700 px-3 py-1.5 text-sm hover:bg-violet-950 disabled:opacity-50"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <Link href="/wallet" className="inline-block text-sm text-slate-400 underline">
          {t("arenaPage.acpWallet")}
        </Link>
      </div>
    </main>
  );
}
