import { expect, test } from '@playwright/test';

const mockNasaRoutes = async (page) => {
  await page.route('**/api/nasa/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.includes('/educational/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ funFacts: [], missions: [] }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'null',
    });
  });
};

test.beforeEach(async ({ page }) => {
  await mockNasaRoutes(page);
});

test('boots the WebGL scene without uncaught page errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');

  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: /Explore Earth/i })).toBeAttached();

  const viewportFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1
  );
  expect(viewportFits).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('deep-link selection reaches Earth detail view and returns to overview', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/?body=Earth');

  const detail = page.getByRole('complementary', { name: 'Earth details' });
  await expect(detail).toBeVisible({ timeout: 25_000 });
  await expect(detail.getByRole('heading', { name: 'Earth', exact: true })).toBeVisible();

  const viewportFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1
  );
  expect(viewportFits).toBe(true);

  await page.getByRole('button', { name: /Close Earth and return to the Solar System overview/i }).click();
  await expect(detail).toBeHidden({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /Explore Earth/i })).toBeVisible({ timeout: 15_000 });

  expect(pageErrors).toEqual([]);
});
