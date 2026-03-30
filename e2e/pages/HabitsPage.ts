import { Page, Locator } from '@playwright/test';

export class HabitsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').filter({ hasText: 'Discipline' });
    this.modal = page.locator('.fixed.inset-0');
    this.nameInput = page.locator('input[placeholder="e.g. Deep Work Session"]');
    this.categorySelect = page.locator('select');
    this.saveButton = page.getByRole('button', { name: /^initialise$|^save changes$/i });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.errorMessage = page.locator('.text-error.text-xs');
  }

  async goto() {
    await this.page.goto('/habits');
  }

  async openCreateModal() {
    // Wait for the habits page to finish loading by waiting for either UI state
    const emptyStateBtn = this.page.getByRole('button', { name: /initialize protocol/i });
    const newProtocolCard = this.page.locator('h3').filter({ hasText: /^New Protocol$/ });

    // Use whichever appears first
    await Promise.any([
      emptyStateBtn.first().waitFor({ timeout: 5000 }).then(() => emptyStateBtn.first().click()),
      newProtocolCard.first().waitFor({ timeout: 5000 }).then(() => newProtocolCard.first().click()),
    ]);
  }

  async createHabit(name: string, category?: string, frequency?: string) {
    await this.openCreateModal();
    await this.nameInput.fill(name);
    if (category) {
      await this.categorySelect.selectOption(category);
    }
    if (frequency) {
      await this.page.getByRole('button', { name: new RegExp(`^${frequency}$`, 'i') }).click();
    }
    await this.saveButton.click();
  }

  /** Returns the delete button for any visible habit card */
  deleteButton() {
    return this.page.locator('button[class*="hover:text-error"]').first();
  }

  /** Returns the edit (Pencil) button in the featured first card */
  firstEditButton() {
    // The edit button is always the FIRST icon button in the featured card's button group
    return this.page
      .locator('.col-span-12.lg\\:col-span-8')
      .getByRole('button')
      .first();
  }
}
