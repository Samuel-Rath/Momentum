import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { setupAuthenticatedApp } from '../fixtures/api-mocks';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
  });

  test('shows the dashboard after login', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    await expect(dash.heading).toBeVisible();
    await expect(dash.velocityDisplay).toBeVisible();
    await expect(dash.streakMultiplier).toBeVisible();
  });

  test('displays all habits from API', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // Use role heading or h4 to avoid strict-mode ambiguity
    await expect(page.locator('h4').filter({ hasText: 'Morning Run' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'Deep Work' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'Meditation' })).toBeVisible();
  });

  test('shows completion count correctly', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // 1 of 3 habits completed in mock data (Deep Work)
    await expect(page.getByText('1 / 3 COMPLETE')).toBeVisible();
  });

  test('already-completed habit shows filled checkbox', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // Deep Work has completed:true in mock data
    await expect(page.getByRole('button', { name: 'Mark incomplete' }).first()).toBeVisible();
  });

  test('uncompleted habit shows empty checkbox', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    await expect(page.getByRole('button', { name: 'Mark complete' }).first()).toBeVisible();
  });

  test('toggling habit sends API request and updates UI', async ({ page }) => {
    let upsertCalled = false;
    let upsertBody: unknown;

    await page.route('**/api/logs', async (route) => {
      if (route.request().method() === 'POST') {
        upsertCalled = true;
        upsertBody = route.request().postDataJSON();
        await route.fulfill({ json: { id: 99, ...route.request().postDataJSON() } });
      } else {
        await route.continue();
      }
    });

    const dash = new DashboardPage(page);
    await dash.goto();

    // Click the first "Mark complete" button (Morning Run — uncompleted)
    await page.getByRole('button', { name: 'Mark complete' }).first().click();

    expect(upsertCalled).toBe(true);
    expect((upsertBody as { habitId: number }).habitId).toBe(1);
    expect((upsertBody as { completed: boolean }).completed).toBe(true);
  });

  test('toggling completed habit marks it incomplete', async ({ page }) => {
    let capturedBody: unknown;
    await page.route('**/api/logs', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = route.request().postDataJSON();
        await route.fulfill({ json: { id: 99 } });
      } else {
        await route.continue();
      }
    });

    const dash = new DashboardPage(page);
    await dash.goto();

    // Deep Work is already completed — click to un-complete
    await page.getByRole('button', { name: 'Mark incomplete' }).first().click();

    expect((capturedBody as { completed: boolean }).completed).toBe(false);
  });

  test('shows streak information for habits', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // MOCK_STREAKS has Deep Work at 21 days
    await expect(page.getByText('21 DAY STREAK')).toBeVisible();
  });

  test('shows top streak velocity (21 days from Deep Work)', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    const velocityCard = page.locator('div').filter({ hasText: 'CURRENT VELOCITY' }).first();
    await expect(velocityCard.getByText('21', { exact: true })).toBeVisible();
  });

  test('streak multiplier reflects top streak (1 + 21*0.08 = 2.7)', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // Top streak is 21 days → 1 + 21 * 0.08 = 2.7x
    const multiplierCard = page.locator('div').filter({ hasText: 'STREAK MULTIPLIER' }).first();
    await expect(multiplierCard.getByText(/2\.7/)).toBeVisible();
  });

  test('notes panel expands when chevron is clicked', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // Notes input should not be visible initially
    await expect(page.getByPlaceholder('Log execution notes…')).not.toBeVisible();

    // Click the chevron on the first uncompleted habit (last button in the habit row)
    const markCompleteBtn = page.getByRole('button', { name: 'Mark complete' }).first();
    const habitGroup = markCompleteBtn.locator('xpath=ancestor::div[contains(@class,"group")]');
    await habitGroup.locator('button').last().click();

    await expect(page.getByPlaceholder('Log execution notes…')).toBeVisible();
  });

  test('note can be saved with Log button', async ({ page }) => {
    let savedNote = '';
    await page.route('**/api/logs', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        savedNote = body.notes;
        await route.fulfill({ json: { id: 99, ...body } });
      } else {
        await route.continue();
      }
    });

    const dash = new DashboardPage(page);
    await dash.goto();

    // Expand notes for first uncompleted habit
    const markComplete = page.getByRole('button', { name: 'Mark complete' }).first();
    const habitRow = markComplete.locator('xpath=ancestor::div[contains(@class,"group")]');
    await habitRow.locator('button').last().click();

    await page.getByPlaceholder('Log execution notes…').fill('Ran 5km this morning');
    await page.getByRole('button', { name: 'Log' }).click();

    expect(savedNote).toBe('Ran 5km this morning');
  });

  test('note can be saved by pressing Enter', async ({ page }) => {
    let savedNote = '';
    await page.route('**/api/logs', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        savedNote = body.notes;
        await route.fulfill({ json: { id: 99, ...body } });
      } else {
        await route.continue();
      }
    });

    const dash = new DashboardPage(page);
    await dash.goto();

    const markComplete = page.getByRole('button', { name: 'Mark complete' }).first();
    const habitRow = markComplete.locator('xpath=ancestor::div[contains(@class,"group")]');
    await habitRow.locator('button').last().click();

    await page.getByPlaceholder('Log execution notes…').fill('Pressed Enter to save');
    await page.getByPlaceholder('Log execution notes…').press('Enter');

    expect(savedNote).toBe('Pressed Enter to save');
  });

  test('empty state shows when user has no habits', async ({ page }) => {
    await page.route('**/api/logs*', (route) => route.fulfill({ json: [] }));

    const dash = new DashboardPage(page);
    await dash.goto();

    await expect(page.getByText('No protocols loaded')).toBeVisible();
    await expect(dash.initializeProtocolLink).toBeVisible();
  });

  test('"Initialize Protocol" link navigates to /habits', async ({ page }) => {
    await page.route('**/api/logs*', (route) => route.fulfill({ json: [] }));

    const dash = new DashboardPage(page);
    await dash.goto();

    await dash.initializeProtocolLink.click();
    await expect(page).toHaveURL('/habits');
  });

  test('performance insights section shows completion percentage', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // 1/3 completed = 33%
    await expect(page.getByText('FOCUS COGNITION')).toBeVisible();
    // The percentage shows in the insights card — use first() to avoid strict mode
    await expect(page.getByText('33%').first()).toBeVisible();
  });

  test('next milestone shows days remaining to 21', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // Top streak is 21 days → milestone achieved
    await expect(page.getByText('ELITE MOMENTUM ACHIEVED')).toBeVisible();
  });
});
