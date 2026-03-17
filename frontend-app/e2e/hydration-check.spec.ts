import { test, expect } from '@playwright/test';

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

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  // give React time to hydrate + run effects
  await page.waitForTimeout(1500);

  expect(hydrationMessages, hydrationMessages.join('\n\n')).toEqual([]);
});
