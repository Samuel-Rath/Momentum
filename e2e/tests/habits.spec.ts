import { test, expect } from '@playwright/test';
import { HabitsPage } from '../pages/HabitsPage';
import { setupAuthenticatedApp, setupHabitsMocks, MOCK_HABITS } from '../fixtures/api-mocks';

test.describe('Habits Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
  });

  test('renders the Tasks page heading', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    await expect(habits.pageHeading).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /practices you tend to/i })).toBeVisible();
  });

  test('displays habit count and category stats', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    // Header stat cells show Total / Categories
    await expect(page.getByText('Total', { exact: true })).toBeVisible();
    await expect(page.getByText('Categories', { exact: true })).toBeVisible();
  });

  test('renders all mock habits in the grid', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    await expect(page.getByRole('heading', { name: /morning run/i, level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /deep work/i, level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /meditation/i, level: 3 })).toBeVisible();
  });

  test('shows empty state when the user has no habits', async ({ page }) => {
    // Override the default authenticated mocks with an empty habits list
    await setupHabitsMocks(page, []);

    const habits = new HabitsPage(page);
    await habits.goto();

    await expect(page.getByText(/no practices yet/i)).toBeVisible();
    await expect(habits.emptyStateCta).toBeVisible();
  });

  test('opens create modal from the empty-state CTA', async ({ page }) => {
    await setupHabitsMocks(page, []);

    const habits = new HabitsPage(page);
    await habits.goto();

    await habits.emptyStateCta.click();
    await expect(page.getByRole('heading', { name: /define a practice/i })).toBeVisible();
    await expect(habits.nameInput).toBeVisible();
  });

  test('opens create modal from the header "New task" button', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    await habits.newTaskHeaderButton.click();
    await expect(habits.nameInput).toBeVisible();
  });

  test('modal has name input, category select, and frequency buttons', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();
    await habits.openCreateModal();

    await expect(habits.nameInput).toBeVisible();
    await expect(habits.categorySelect).toBeVisible();
    await expect(page.getByRole('button', { name: /^daily$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^weekly$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^custom$/i })).toBeVisible();
  });

  test('cancel button closes the modal', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();
    await habits.openCreateModal();

    await expect(habits.nameInput).toBeVisible();
    await habits.cancelButton.click();
    await expect(habits.nameInput).not.toBeVisible();
  });

  test('close (X) button dismisses the modal', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();
    await habits.openCreateModal();

    await page.getByRole('button', { name: /^close$/i }).click();
    await expect(habits.nameInput).not.toBeVisible();
  });

  test('creating a habit sends POST /api/habits and closes the modal', async ({ page }) => {
    let createdHabit: unknown;
    await page.route('**/api/habits', async (route) => {
      if (route.request().method() === 'POST') {
        createdHabit = route.request().postDataJSON();
        await route.fulfill({
          json: {
            id: 99,
            userId: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            ...(createdHabit as object),
          },
        });
      } else {
        await route.fulfill({ json: MOCK_HABITS });
      }
    });

    const habits = new HabitsPage(page);
    await habits.goto();
    await habits.openCreateModal();

    await habits.nameInput.fill('Cold Shower');
    await habits.categorySelect.selectOption('health');
    await page.getByRole('button', { name: /^daily$/i }).click();
    await habits.saveButton.click();

    await expect.poll(() => (createdHabit as { name?: string } | undefined)?.name).toBe('Cold Shower');
    expect((createdHabit as { category: string }).category).toBe('health');
    expect((createdHabit as { frequency: string }).frequency).toBe('daily');
    await expect(habits.nameInput).not.toBeVisible();
  });

  test('name is required — HTML5 validation blocks empty submit', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();
    await habits.openCreateModal();

    await habits.saveButton.click();

    const missing = await habits.nameInput.evaluate(
      (el: HTMLInputElement) => el.validity.valueMissing
    );
    expect(missing).toBe(true);
    await expect(habits.nameInput).toBeVisible();
  });

  test('creates a habit with weekly frequency', async ({ page }) => {
    let createdHabit: unknown;
    await page.route('**/api/habits', async (route) => {
      if (route.request().method() === 'POST') {
        createdHabit = route.request().postDataJSON();
        await route.fulfill({ json: { id: 99, ...(createdHabit as object) } });
      } else {
        await route.fulfill({ json: MOCK_HABITS });
      }
    });

    const habits = new HabitsPage(page);
    await habits.goto();
    await habits.openCreateModal();

    await habits.nameInput.fill('Weekly Review');
    await page.getByRole('button', { name: /^weekly$/i }).click();
    await habits.saveButton.click();

    await expect.poll(() => (createdHabit as { frequency?: string } | undefined)?.frequency).toBe('weekly');
  });

  test('editing pre-fills the modal with existing data', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    // Each card's edit button has aria-label "Edit <name>"
    await habits.editButtonFor('Morning Run').click();

    await expect(page.getByRole('heading', { name: /edit a practice/i })).toBeVisible();
    await expect(habits.nameInput).toHaveValue('Morning Run');
  });

  test('saving an edit sends PUT /api/habits/:id', async ({ page }) => {
    let putUrl = '';
    let putBody: unknown;

    await page.route('**/api/habits/*', async (route) => {
      if (route.request().method() === 'PUT') {
        putUrl = route.request().url();
        putBody = route.request().postDataJSON();
        await route.fulfill({ json: { ...MOCK_HABITS[0], ...(putBody as object) } });
      } else {
        await route.continue();
      }
    });

    const habits = new HabitsPage(page);
    await habits.goto();

    await habits.editButtonFor('Morning Run').click();
    await habits.nameInput.fill('Evening Run');
    await habits.saveButton.click();

    await expect.poll(() => putUrl).toContain('/api/habits/1');
    expect((putBody as { name: string }).name).toBe('Evening Run');
    await expect(habits.nameInput).not.toBeVisible();
  });

  test('deleting a habit sends DELETE /api/habits/:id', async ({ page }) => {
    let deletedId = '';

    await page.route('**/api/habits/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        deletedId = route.request().url().split('/').pop() || '';
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    const habits = new HabitsPage(page);
    await habits.goto();

    await habits.deleteButtonFor('Morning Run').click();
    await habits.confirmDeleteButton().click();

    await expect.poll(() => deletedId).toBe('1');
  });

  test('confirming delete removes the habit from the UI', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    const row = page.getByRole('heading', { name: /morning run/i, level: 3 });
    await expect(row).toBeVisible();

    await habits.deleteButtonFor('Morning Run').click();
    await habits.confirmDeleteButton().click();

    await expect(row).not.toBeVisible();
  });

  test('dismissing the delete confirm keeps the habit in the list', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    await habits.deleteButtonFor('Morning Run').click();
    await habits.cancelDeleteButton().click();

    await expect(page.getByRole('heading', { name: /morning run/i, level: 3 })).toBeVisible();
  });

  test('server error surfaces in the modal as an inline alert', async ({ page }) => {
    await page.route('**/api/habits', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 400, json: { error: 'Habit name too long' } });
      } else {
        await route.fulfill({ json: MOCK_HABITS });
      }
    });

    const habits = new HabitsPage(page);
    await habits.goto();
    await habits.openCreateModal();

    await habits.nameInput.fill('Test Habit');
    await habits.saveButton.click();

    await expect(habits.errorMessage).toBeVisible();
    await expect(habits.errorMessage).toContainText(/habit name too long/i);
  });
});
