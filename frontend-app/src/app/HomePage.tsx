"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";

const topOffers = [
  {
    title: "Pro Launch Pack",
    price: "349 ACP",
    href: "/ai/bundles/pro-launch-pack",
    label: "Лучший старт",
    result: "Launch audit, listing packet, KOL/Telegram campaign, bounty flow и pro risk report в одном пакете.",
  },
  {
    title: "Exchange Listing Submission Pack",
    price: "149 ACP",
    href: "/ai/run/exchange-listing-submission-pack",
    label: "Листинг",
    result: "Готовит ответы для биржи, due-diligence memo, checklist рисков и proof receipt запуска.",
  },
  {
    title: "Token Risk Report Pro",
    price: "59 ACP",
    href: "/ai/run/token-risk-report-pro",
    label: "Риск",
    result: "Проверяет token, liquidity, holders, evidence gaps и собирает отчет для команды или инвесткомитета.",
  },
];

const executionSteps = [
  {
    title: "1. Выберите workflow",
    text: "Каталог собран вокруг конкретных задач crypto-команд: listing, launch, bounty, campaign, risk и agent API readiness.",
  },
  {
    title: "2. Оплатите в ACP",
    text: "Цена показывается до запуска. 1 ACP считается как 1 расчетная единица платформы для paid workflow и API.",
  },
  {
    title: "3. Получите результат",
    text: "На выходе не обещание, а рабочий артефакт: отчет, пакет документов, campaign plan, bounty flow или API receipt.",
  },
  {
    title: "4. Проверьте proof",
    text: "Каждый платный запуск оставляет receipt, input hash, timeline и proof bundle, чтобы результат можно было показать команде или агенту.",
  },
];

const productRoutes = [
  { title: "Workflow store", href: "/ai/workflows", text: "купить готовое AI-исполнение" },
  { title: "Pricing", href: "/pricing", text: "сравнить отдельные SKU и пакеты" },
  { title: "Token snapshot", href: "/token-snapshot", text: "быстрый вход через бесплатную risk-проверку" },
  { title: "Developers", href: "/developers", text: "paid API endpoints для внешних AI-агентов" },
  { title: "Proof Center", href: "/proof-center", text: "публичные receipts и проверяемые артефакты" },
  { title: "ACP wallet", href: "/wallet/acp", text: "кастодиальный кошелек после входа" },
];

const audienceBlocks = [
  {
    title: "Для crypto-команды",
    text: "ANCAP помогает купить не консультацию в свободной форме, а готовый операционный результат: listing pack, launch audit, campaign builder, bounty mechanics или token risk report.",
  },
  {
    title: "Для AI-агента",
    text: "Платформа дает понятные маршруты, цены, API-продукты, spend caps и machine-readable receipts, чтобы агент мог покупать исполнение без длинной ручной переписки.",
  },
  {
    title: "Для владельца проекта",
    text: "Revenue loop строится вокруг ACP: платные workflow, bundles, proof, repeat runs, API calls и партнерская воронка через token snapshot.",
  },
];

const productSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ANCAP",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Paid AI workflows for crypto teams and AI agents: listing packs, campaign builders, bounty flows, token risk reports, ACP checkout and proof receipts.",
  offers: topOffers.map((offer) => ({
    "@type": "Offer",
    name: offer.title,
    price: offer.price.replace(" ACP", ""),
    priceCurrency: "ACP",
    url: `https://ancap.cloud${offer.href}`,
  })),
};

export function HomePage() {
  const acpUrl = process.env.NEXT_PUBLIC_ACP_URL || "/acp";

  return (
    <div className="relative min-h-screen bg-[var(--bg)]">
      <NetworkBackground />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 70% 42% at 50% -18%, rgba(25, 195, 138, 0.12), transparent 58%)",
        }}
        aria-hidden
      />

      <div className="min-h-screen">
        <Navigation />

        <main>
          <section style={{ padding: "72px 0 56px" }} aria-labelledby="home-title">
            <div className="container">
              <div
                className="home-hero-grid"
                style={{
                  display: "grid",
                  gap: 28,
                  alignItems: "center",
                }}
              >
                <div>
                  <div className="section-num">ANCAP CLOUD</div>
                  <h1
                    id="home-title"
                    style={{
                      fontSize: "3.35rem",
                      fontWeight: 850,
                      letterSpacing: 0,
                      lineHeight: 1.04,
                      marginBottom: 22,
                      maxWidth: 780,
                    }}
                  >
                    Платные AI-workflow для криптокоманд и агентов
                  </h1>
                  <p
                    style={{
                      fontSize: "1.15rem",
                      color: "var(--text)",
                      maxWidth: 760,
                      lineHeight: 1.7,
                      marginBottom: 18,
                    }}
                  >
                    ANCAP продает полезное AI-исполнение за crypto: listing packs, campaign builders,
                    bounty flows, token risk reports и receipts с proof. Пользователь покупает не
                    абстрактный доступ к AI, а понятный результат с ценой, статусом оплаты и проверяемым следом.
                  </p>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      maxWidth: 720,
                      lineHeight: 1.7,
                      marginBottom: 28,
                    }}
                  >
                    Интеграция с сетью ACP и кастодиальный кошелек уже доступны на платформе:
                    обзор сети находится на странице ACP, кошелек открывается после входа. Для платных
                    workflow и API используется ACP, где 1 ACP = 1 расчетная единица платформы.
                  </p>
                  <div className="action-cluster" style={{ marginBottom: 22 }}>
                    <Link href="/ai/workflows" className="btn btn-primary">
                      Купить workflow
                    </Link>
                    <Link href="/pricing" className="btn btn-ghost">
                      Смотреть цены
                    </Link>
                    <Link href="/developers" className="btn btn-ghost">
                      API для агентов
                    </Link>
                  </div>
                  <div className="action-cluster">
                    {acpUrl.startsWith("http") ? (
                      <a href={acpUrl} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                        ACP и сеть
                      </a>
                    ) : (
                      <Link href={acpUrl} className="btn btn-ghost">
                        ACP и сеть
                      </Link>
                    )}
                    <Link href="/wallet/acp" className="btn btn-ghost">
                      ACP-кошелек
                    </Link>
                    <Link href="/proof-center" className="btn btn-ghost">
                      Proof Center
                    </Link>
                  </div>
                </div>

                <aside
                  className="card"
                  aria-label="Короткая карта продукта"
                  style={{
                    borderRadius: 8,
                    background: "rgba(18, 26, 45, 0.82)",
                    backdropFilter: "blur(14px)",
                  }}
                >
                  <div className="badge badge-success" style={{ marginBottom: 18 }}>
                    Live product map
                  </div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: 14 }}>
                    Что здесь можно купить
                  </h2>
                  <div style={{ display: "grid", gap: 12 }}>
                    {[
                      ["Launch", "аудит запуска, листинг, кампания, bounty"],
                      ["Risk", "token report, holder/liquidity flags, evidence gaps"],
                      ["Agent API", "pay-per-call endpoints, spend caps, receipts"],
                      ["Proof", "receipt URL, input hash, run timeline, bundle"],
                    ].map(([name, text]) => (
                      <div
                        key={name}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "96px 1fr",
                          gap: 12,
                          alignItems: "start",
                          padding: "12px 0",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <strong style={{ color: "var(--accent-strong)" }}>{name}</strong>
                        <span style={{ color: "var(--text-muted)", lineHeight: 1.55 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            </div>
          </section>

          <section className="container" style={{ padding: "28px 24px 62px" }} aria-labelledby="offers-title">
            <div className="section-header">
              <div>
                <span className="section-num">BUY FIRST</span>
                <h2 id="offers-title" className="section-title">
                  Первые платные продукты
                </h2>
              </div>
              <Link href="/ai/workflows" className="btn btn-ghost">
                Весь каталог
              </Link>
            </div>
            <div className="responsive-grid responsive-grid-3">
              {topOffers.map((offer) => (
                <Link
                  key={offer.title}
                  href={offer.href}
                  className="card"
                  style={{ textDecoration: "none", borderRadius: 8, minHeight: 250 }}
                >
                  <div className="card-header">
                    <span className="badge badge-info">{offer.label}</span>
                    <strong style={{ color: "var(--accent-strong)", fontSize: "1.2rem" }}>{offer.price}</strong>
                  </div>
                  <h3 style={{ color: "var(--text)", fontSize: "1.2rem", fontWeight: 800, marginBottom: 12 }}>
                    {offer.title}
                  </h3>
                  <p style={{ color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
                    {offer.result}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section id="product" className="container" style={{ padding: "62px 24px", borderTop: "1px solid var(--border)" }}>
            <span className="section-num">HOW IT WORKS</span>
            <h2 className="section-title" style={{ maxWidth: 680, marginBottom: 16 }}>
              Простая логика: оплатил, запустил, получил артефакт, проверил proof
            </h2>
            <p className="section-subtitle" style={{ maxWidth: 760 }}>
              Главная ценность ANCAP в том, что AI-исполнение превращается в покупаемый продукт.
              Каждый workflow имеет входные данные, цену, ожидаемый результат, статус оплаты и проверяемый receipt.
            </p>
            <div className="responsive-grid responsive-grid-2">
              {executionSteps.map((step) => (
                <div key={step.title} className="card" style={{ borderRadius: 8 }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{step.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="vision" className="container" style={{ padding: "62px 24px", borderTop: "1px solid var(--border)" }}>
            <span className="section-num">AUDIENCE</span>
            <h2 className="section-title" style={{ marginBottom: 16 }}>
              Кому нужен ANCAP
            </h2>
            <div className="responsive-grid responsive-grid-3">
              {audienceBlocks.map((block) => (
                <div key={block.title} className="card" style={{ borderRadius: 8 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 10 }}>{block.title}</h3>
                  <p style={{ color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{block.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="container" style={{ padding: "62px 24px", borderTop: "1px solid var(--border)" }}>
            <div
              className="home-split-grid"
              style={{
                display: "grid",
                gap: 24,
                alignItems: "start",
              }}
            >
              <div>
                <span className="section-num">AI-FRIENDLY ROUTES</span>
                <h2 className="section-title" style={{ marginBottom: 16 }}>
                  Страница говорит понятными маршрутами
                </h2>
                <p className="section-subtitle">
                  Для человека это навигация. Для AI-агента это карта продукта: где купить,
                  где посмотреть цену, где получить proof, где работать с ACP и где подключать paid API.
                </p>
                <Link href="/developers" className="btn btn-primary">
                  Открыть developer page
                </Link>
              </div>
              <div className="responsive-grid" style={{ gap: 12 }}>
                {productRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className="card home-route-link"
                    style={{
                      borderRadius: 8,
                      textDecoration: "none",
                      display: "grid",
                      gap: 14,
                      padding: 18,
                    }}
                  >
                    <strong style={{ color: "var(--text)" }}>{route.title}</strong>
                    <span style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>{route.text}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="container" style={{ padding: "62px 24px", borderTop: "1px solid var(--border)" }}>
            <div
              className="card home-acp-panel"
              style={{
                borderRadius: 8,
                display: "grid",
                gap: 22,
                alignItems: "center",
                background:
                  "linear-gradient(135deg, rgba(25, 195, 138, 0.15), rgba(56, 189, 248, 0.08) 45%, rgba(18, 26, 45, 0.9))",
              }}
            >
              <div>
                <span className="section-num">ACP RAIL</span>
                <h2 className="section-title" style={{ marginBottom: 12 }}>
                  ACP уже встроен в продуктовую воронку
                </h2>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.7, margin: 0, maxWidth: 760 }}>
                  ACP используется как расчетная единица для workflow и API. Пользователь может изучить сеть,
                  войти в аккаунт, открыть кастодиальный ACP-кошелек, пополнить баланс и запускать платные
                  workflow с receipt после оплаты.
                </p>
              </div>
              <div className="action-cluster" style={{ justifyContent: "flex-end" }}>
                <Link href="/acp" className="btn btn-ghost">
                  Страница ACP
                </Link>
                <Link href="/wallet/acp" className="btn btn-primary">
                  Кошелек
                </Link>
              </div>
            </div>
          </section>

          <section id="contact" style={{ textAlign: "center", padding: "74px 24px 60px" }}>
            <div className="container">
              <h2 style={{ fontSize: "2rem", fontWeight: 850, marginBottom: 16, letterSpacing: 0 }}>
                Начните с одного workflow, затем масштабируйте в API и bundles
              </h2>
              <p style={{ color: "var(--text-muted)", margin: "0 auto 30px", fontSize: "1.05rem", lineHeight: 1.65, maxWidth: 760 }}>
                Самый короткий путь к ценности: бесплатный token snapshot, платный pro report,
                затем launch или growth pack. Для агентов есть отдельная developer-страница с paid endpoints.
              </p>
              <div className="action-cluster" style={{ justifyContent: "center" }}>
                <Link href="/token-snapshot" className="btn btn-primary">
                  Free token snapshot
                </Link>
                <Link href="/ai/workflows" className="btn btn-ghost">
                  Купить AI-workflow
                </Link>
                <a href="/api/docs" className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                  Swagger API
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer
          style={{
            padding: "32px 24px",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          <div className="container">
            <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", fontWeight: 800 }}>
              ANCAP
            </Link>
            <span> - paid AI execution, ACP payments, proof receipts and agent commerce.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
