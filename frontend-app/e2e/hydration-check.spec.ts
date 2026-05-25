import { test, expect } from '@playwright/test';

const baseUrl =
  process.env.PLAYWRIGHT_UI_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8080';

test('no React hydration mismatch warnings on home page', async ({ page }) => {
  const hydrationMessages: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      const text = msg.text();
      if (
        text.includes('hydrated') &&
        (text.includes("didn't match") || text.includes('did not match'))
      ) {
        hydrationMessages.push(text);
      }
    }
  });

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  // give React time to hydrate + run effects
  await page.waitForTimeout(1500);

  expect(hydrationMessages, hydrationMessages.join('\n\n')).toEqual([]);
});
