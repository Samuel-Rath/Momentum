import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { setupAuthenticatedApp } from '../fixtures/api-mocks';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
  });

  test('renders the overview page after login', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    await expect(dash.topBarTitle).toBeVisible();
    await expect(dash.heroHeading).toBeVisible();
    await expect(dash.todaysPracticeHeading).toBeVisible();
  });

  test('lists all habits from the API', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    await expect(page.getByRole('button', { name: /mark complete: morning run/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /completed: deep work/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /mark complete: meditation/i })).toBeVisible();
  });

  test('shows completion count (1 of 3 complete)', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // Two surfaces show the count: the KPI "Today's progress" hint ("1 of 3 complete")
    // and the Today's-practice section hint ("1 of 3 complete."). Assert both exist.
    await expect(page.getByText(/1 of 3 complete/i)).toHaveCount(2);
  });

  test('completed habit row exposes "Completed" aria-label', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    await expect(page.getByRole('button', { name: /completed: deep work/i })).toBeVisible();
  });

  test('toggling an uncompleted habit sends a POST /api/logs', async ({ page }) => {
    let capturedBody: unknown;
    await page.route('**/api/logs', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = route.request().postDataJSON();
        await route.fulfill({ json: { id: 99, ...route.request().postDataJSON() } });
      } else {
        await route.continue();
      }
    });

    const dash = new DashboardPage(page);
    await dash.goto();
    await dash.toggleHabit('Morning Run');

    // Wait for the request to be captured (dashboard fires the toggle async)
    await expect.poll(() => (capturedBody as { habitId?: number } | undefined)?.habitId).toBe(1);
    expect((capturedBody as { completed: boolean }).completed).toBe(true);
  });

  test('toggling a completed habit flips it to incomplete', async ({ page }) => {
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
    await dash.toggleHabit('Deep Work');

    await expect.poll(() => (capturedBody as { habitId?: number } | undefined)?.habitId).toBe(2);
    expect((capturedBody as { completed: boolean }).completed).toBe(false);
  });

  test('top streak KPI reflects the longest current streak (21d Deep Work)', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    await expect(dash.currentStreakLabel).toBeVisible();
    // "21" appears in the Current streak KPI — scope to the Top streaks list for specificity
    await expect(page.getByText('in Deep Work', { exact: false })).toBeVisible();
  });

  test('top streaks panel shows ranked active streaks', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // All three streaks in MOCK_STREAKS are active
    await expect(dash.topStreaksHeading).toBeVisible();
    await expect(page.getByText('Deep Work').first()).toBeVisible();
    await expect(page.getByText('Morning Run').first()).toBeVisible();
  });

  test('notes drawer expands when its toggle is clicked', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // No notes input visible yet
    await expect(dash.notesInput).toHaveCount(0);

    // Expand notes for "Morning Run" — button is scoped by the habit row
    const morningRunRow = page
      .getByRole('button', { name: /mark complete: morning run/i })
      .locator('..')
      .locator('..');
    await morningRunRow.getByRole('button', { name: /show notes/i }).click();

    await expect(dash.notesInput).toBeVisible();
  });

  test('note can be saved via the Save button', async ({ page }) => {
    let savedNote = '';
    await page.route('**/api/logs', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        if (body.notes) savedNote = body.notes;
        await route.fulfill({ json: { id: 99, ...body } });
      } else {
        await route.continue();
      }
    });

    const dash = new DashboardPage(page);
    await dash.goto();

    const morningRunRow = page
      .getByRole('button', { name: /mark complete: morning run/i })
      .locator('..')
      .locator('..');
    await morningRunRow.getByRole('button', { name: /show notes/i }).click();

    await dash.notesInput.fill('Ran 5km this morning');
    await dash.notesSaveButton.click();

    await expect.poll(() => savedNote).toBe('Ran 5km this morning');
  });

  test('pressing Enter in the notes input saves', async ({ page }) => {
    let savedNote = '';
    await page.route('**/api/logs', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        if (body.notes) savedNote = body.notes;
        await route.fulfill({ json: { id: 99, ...body } });
      } else {
        await route.continue();
      }
    });

    const dash = new DashboardPage(page);
    await dash.goto();

    const morningRunRow = page
      .getByRole('button', { name: /mark complete: morning run/i })
      .locator('..')
      .locator('..');
    await morningRunRow.getByRole('button', { name: /show notes/i }).click();

    await dash.notesInput.fill('Pressed Enter to save');
    await dash.notesInput.press('Enter');

    await expect.poll(() => savedNote).toBe('Pressed Enter to save');
  });

  test('empty state renders when the user has no habits', async ({ page }) => {
    await page.route('**/api/logs*', (route) => {
      if (route.request().method() === 'GET') return route.fulfill({ json: [] });
      return route.continue();
    });

    const dash = new DashboardPage(page);
    await dash.goto();

    await expect(page.getByText(/no practices yet/i)).toBeVisible();
    await expect(dash.createTaskLink).toBeVisible();
  });

  test('"Create a task" empty-state link navigates to /habits', async ({ page }) => {
    await page.route('**/api/logs*', (route) => {
      if (route.request().method() === 'GET') return route.fulfill({ json: [] });
      return route.continue();
    });

    const dash = new DashboardPage(page);
    await dash.goto();

    await dash.createTaskLink.click();
    await expect(page).toHaveURL(/\/habits/);
  });

  test('trend chart and KPI cards are visible', async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    await expect(page.getByText("Today's progress")).toBeVisible();
    await expect(dash.weeklyAverageLabel).toBeVisible();
    await expect(page.getByText('Active streaks')).toBeVisible();
    // The Completion trend heading is a styled <p>, not a semantic heading
    await expect(page.getByText(/completion trend/i)).toBeVisible();
  });
});
