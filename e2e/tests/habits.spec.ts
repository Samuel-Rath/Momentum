import { test, expect } from '@playwright/test';
import { HabitsPage } from '../pages/HabitsPage';
import { setupAuthenticatedApp, MOCK_HABITS } from '../fixtures/api-mocks';

test.describe('Habits Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
  });

  test('shows the habits page with Discipline Protocols heading', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    await expect(habits.heading).toBeVisible();
  });

  test('displays habit count and category stats', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    // "3 total" and "3/8" appear from habit count display
    await expect(page.getByText('Active Protocols')).toBeVisible();
    await expect(page.getByText('Categories')).toBeVisible();
    await expect(page.getByText('3 total')).toBeVisible();
  });

  test('shows all mock habits in the grid', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    await expect(page.getByText('MORNING RUN')).toBeVisible();
    await expect(page.getByText('DEEP WORK')).toBeVisible();
    await expect(page.getByText('MEDITATION')).toBeVisible();
  });

  test('shows empty state when no habits exist', async ({ page }) => {
    await page.route('**/api/habits', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: [] });
      }
      return route.continue();
    });

    const habits = new HabitsPage(page);
    await habits.goto();

    await expect(page.getByText('No protocols initialised')).toBeVisible();
    await expect(page.getByRole('button', { name: /initialise protocol/i })).toBeVisible();
  });

  test('opens create modal from empty state', async ({ page }) => {
    await page.route('**/api/habits', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: [] });
      }
      return route.continue();
    });

    const habits = new HabitsPage(page);
    await habits.goto();

    await page.getByRole('button', { name: /initialise protocol/i }).click();
    await expect(habits.modal).toBeVisible();
    await expect(page.getByText('New Protocol').first()).toBeVisible();
  });

  test('opens create modal from "New Protocol" card', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    // Click the "New Protocol" card (h3 text, not inside the modal)
    await page.locator('h3').filter({ hasText: /^New Protocol$/ }).click();
    await expect(habits.modal).toBeVisible();
    await expect(habits.nameInput).toBeVisible();
  });

  test('modal has protocol name input, category select, and frequency buttons', async ({ page }) => {
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

    await expect(habits.modal).toBeVisible();
    await habits.cancelButton.click();
    await expect(habits.modal).not.toBeVisible();
  });

  test('X button closes the modal', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();
    await habits.openCreateModal();

    // The X button is the first button inside the modal (in the header, before the form)
    await page.locator('.fixed.inset-0 button').first().click();
    await expect(habits.modal).not.toBeVisible();
  });

  test('creating a habit sends POST request and shows it in the list', async ({ page }) => {
    let createdHabit: unknown;
    await page.route('**/api/habits', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        createdHabit = body;
        await route.fulfill({ json: { id: 99, userId: 1, isActive: true, createdAt: new Date().toISOString(), ...body } });
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

    expect((createdHabit as { name: string }).name).toBe('Cold Shower');
    expect((createdHabit as { category: string }).category).toBe('health');
    await expect(habits.modal).not.toBeVisible();
  });

  test('name is required — modal stays open if empty', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();
    await habits.openCreateModal();

    // Submit without filling name
    await habits.saveButton.click();

    // HTML5 required validation keeps modal open
    const validity = await habits.nameInput.evaluate(
      (el: HTMLInputElement) => el.validity.valueMissing
    );
    expect(validity).toBe(true);
    await expect(habits.modal).toBeVisible();
  });

  test('creates habit with weekly frequency', async ({ page }) => {
    let createdHabit: unknown;
    await page.route('**/api/habits', async (route) => {
      if (route.request().method() === 'POST') {
        createdHabit = route.request().postDataJSON();
        await route.fulfill({ json: { id: 99, ...createdHabit } });
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

    expect((createdHabit as { frequency: string }).frequency).toBe('weekly');
  });

  test('editing a habit pre-fills the modal with existing data', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    // Click the edit (Pencil) button on the featured first card — always visible
    await habits.firstEditButton().click();

    await expect(habits.modal).toBeVisible();
    await expect(page.getByText('Edit Protocol')).toBeVisible();
    await expect(habits.nameInput).toHaveValue('Morning Run');
  });

  test('saving an edit sends PUT request', async ({ page }) => {
    let putUrl = '';
    let putBody: unknown;

    await page.route('**/api/habits/*', async (route) => {
      if (route.request().method() === 'PUT') {
        putUrl = route.request().url();
        putBody = route.request().postDataJSON();
        await route.fulfill({ json: { ...MOCK_HABITS[0], ...putBody } });
      } else {
        await route.continue();
      }
    });

    const habits = new HabitsPage(page);
    await habits.goto();

    await habits.firstEditButton().click();
    await habits.nameInput.clear();
    await habits.nameInput.fill('Evening Run');
    await habits.saveButton.click();

    expect(putUrl).toContain('/api/habits/1');
    expect((putBody as { name: string }).name).toBe('Evening Run');
    await expect(habits.modal).not.toBeVisible();
  });

  test('deleting a habit sends DELETE request', async ({ page }) => {
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

    // Click the delete button on the featured card (always visible, no hover needed)
    await habits.deleteButton().click();
    await habits.confirmDeleteButton().click();

    expect(deletedId).toBe('1');
  });

  test('deleting a habit removes it from UI', async ({ page }) => {
    await page.route('**/api/habits/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    const habits = new HabitsPage(page);
    await habits.goto();

    await expect(page.getByText('MORNING RUN')).toBeVisible();

    await habits.deleteButton().click();
    await habits.confirmDeleteButton().click();

    await expect(page.getByText('MORNING RUN')).not.toBeVisible();
  });

  test('dismissing delete confirm keeps habit in list', async ({ page }) => {
    const habits = new HabitsPage(page);
    await habits.goto();

    await habits.deleteButton().click();
    await habits.cancelDeleteButton().click();

    // Habit should still be visible
    await expect(page.getByText('MORNING RUN')).toBeVisible();
  });

  test('API error shows error message in modal', async ({ page }) => {
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
    await expect(habits.errorMessage).toContainText('Habit name too long');
  });

});
