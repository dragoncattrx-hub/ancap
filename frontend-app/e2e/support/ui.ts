import type { Page } from "@playwright/test";

/** Collapse floating news/weather widgets so they do not intercept e2e clicks. */
export async function seedQuietUi(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "ancap_cookie_consent_v1",
        JSON.stringify({ necessary: true, analytics: false, marketing: false, savedAt: new Date().toISOString() }),
      );
      localStorage.setItem("ancap_news_widget_collapsed_v2", "1");
      localStorage.setItem("ancap_earth_widget_open_v1", "0");
    } catch {
      /* ignore */
    }
  });
}

/** Close open menus without navigating away from the current page. */
export async function dismissOverlays(page: Page) {
  await page.keyboard.press("Escape").catch(() => undefined);
  await page.mouse.move(0, 0).catch(() => undefined);
  await page.keyboard.press("Escape").catch(() => undefined);
}
