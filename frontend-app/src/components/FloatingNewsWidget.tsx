"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PROJECT_NEWS_RU } from "@/lib/projectNewsRu";

const STORAGE_KEY = "ancap_news_widget_collapsed_v1";
const ROTATE_MS = 4500;

export function FloatingNewsWidget() {
  const [index, setIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const items = PROJECT_NEWS_RU.slice(0, 8);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (collapsed || items.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [collapsed, items.length]);

  const persistCollapsed = (next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  if (!ready || items.length === 0) return null;

  const current = items[index] ?? items[0];

  if (collapsed) {
    return (
      <div className="pointer-events-none fixed bottom-[max(0.85rem,env(safe-area-inset-bottom))] left-3 z-[90] sm:left-4">
        <button
          type="button"
          onClick={() => persistCollapsed(false)}
          className="pointer-events-auto rounded-full border border-white/15 bg-[#071020]/92 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md hover:border-emerald-300/35"
          aria-label="Открыть новости ANCAP"
        >
          Новости
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Новости проекта ANCAP"
      className="pointer-events-none fixed bottom-[max(0.85rem,env(safe-area-inset-bottom))] left-3 z-[90] w-[min(18.5rem,calc(100vw-1.5rem))] sm:left-4"
    >
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-white/12 bg-[#071020]/94 text-white shadow-[0_18px_50px_rgba(0,0,0,0.48)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
              Новости
            </div>
            <div className="truncate text-xs text-white/45">
              {index + 1} / {items.length} · ANCAP
            </div>
          </div>
          <button
            type="button"
            onClick={() => persistCollapsed(true)}
            className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/55 hover:border-white/25 hover:text-white"
            aria-label="Свернуть новости"
          >
            Свернуть
          </button>
        </div>

        <div className="relative h-[7.6rem] overflow-hidden px-3 py-2.5">
          <div key={current.id} className="ancap-news-float absolute inset-x-3 top-2.5">
            <div className="text-[10px] uppercase tracking-wide text-white/40">{current.date}</div>
            <Link
              href={current.href}
              className="mt-1 block text-sm font-semibold leading-5 text-white hover:text-emerald-200"
            >
              {current.title}
            </Link>
            <p className="mt-1.5 line-clamp-3 text-[12px] leading-4 text-white/62">{current.summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 border-t border-white/10 px-3 py-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Новость ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 flex-1 rounded-full transition ${
                i === index ? "bg-emerald-300/80" : "bg-white/15 hover:bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
