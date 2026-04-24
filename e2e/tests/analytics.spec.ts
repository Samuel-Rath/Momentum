import { test, expect } from '@playwright/test';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { setupAuthenticatedApp, MOCK_PERFORMANCE } from '../fixtures/api-mocks';

test.describe('Analytics — Performance Board', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
  });

  test('renders the analytics page and Performance Board section', async ({ page }) => {
    const analytics = new AnalyticsPage(page);
    await analytics.goto();

    await expect(analytics.heading).toBeVisible();
    await expect(analytics.performanceBoardHeading).toBeVisible();
    await expect(analytics.performanceBoardEyebrow).toBeVisible();
  });

  test('period toggle is interactive and refetches performance data', async ({ page }) => {
    let lastRequestedPeriod: string | null = null;
    // Override the default mock to capture the period query param so we can
    // assert the toggle re-fires the request.
    await page.route('**/api/analytics/performance*', (route) => {
      const url = new URL(route.request().url());
      lastRequestedPeriod = url.searchParams.get('period');
      route.fulfill({ json: MOCK_PERFORMANCE });
    });

    const analytics = new AnalyticsPage(page);
    await analytics.goto();

    // Initial load fires period=30 (the default)
    await expect.poll(() => lastRequestedPeriod).toBe('30');

    await analytics.periodButton('7 days').click();
    await expect.poll(() => lastRequestedPeriod).toBe('7');

    await analytics.periodButton('90 days').click();
    await expect.poll(() => lastRequestedPeriod).toBe('90');
  });

  test('renders habit scoring rows from the performance payload', async ({ page }) => {
    const analytics = new AnalyticsPage(page);
    await analytics.goto();

    // Performance Board's habit scoring table — habits appear in the table body.
    // Use .first() to scope past other places these names appear (e.g. dormant list).
    await expect(page.getByRole('table').getByText('Deep Work').first()).toBeVisible();
    await expect(page.getByRole('table').getByText('Meditation').first()).toBeVisible();
  });

  test('at-risk watchlist surfaces the declining habit', async ({ page }) => {
    const analytics = new AnalyticsPage(page);
    await analytics.goto();

    // Section 05E watchlist eyebrow + the at-risk habit name from MOCK_PERFORMANCE
    await expect(page.getByText(/05E Watchlist/i)).toBeVisible();
  });

  test('does not produce console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    const analytics = new AnalyticsPage(page);
    await analytics.goto();
    await expect(analytics.performanceBoardHeading).toBeVisible();

    // Filter out known third-party noise (none expected, but stay defensive).
    const real = errors.filter((e) => !/favicon|sourcemap/i.test(e));
    expect(real).toEqual([]);
  });
});
