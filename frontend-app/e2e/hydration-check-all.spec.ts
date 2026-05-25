import { test, expect } from '@playwright/test';

const baseUrl =
  process.env.PLAYWRIGHT_UI_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8080';
const paths = ['/', '/login', '/register', '/dashboard', '/agents', '/strategies', '/projects', '/runs'];

test('no React hydration mismatch warnings on key routes', async ({ page }) => {
  const hydrationMessages: { path: string; text: string }[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      const text = msg.text();
      if (
        text.includes('hydrated') &&
        (text.includes("didn't match") || text.includes('did not match'))
      ) {
        // path is filled in per-navigation below
        hydrationMessages.push({ path: page.url(), text });
      }
    }
  });

  for (const p of paths) {
    await page.goto(`${baseUrl}${p}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
  }

  // Fail with helpful output
  const pretty = hydrationMessages
    .map((m) => `--- ${m.path} ---\n${m.text}`)
    .join('\n\n');

  expect(hydrationMessages, pretty).toEqual([]);
});
