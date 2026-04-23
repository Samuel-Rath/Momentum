import { Page, Locator } from '@playwright/test';

export class HabitsPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly categorySelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  readonly newTaskTopBarButton: Locator;
  readonly newTaskHeaderButton: Locator;
  readonly emptyStateCta: Locator;
  readonly addAnotherTile: Locator;

  constructor(page: Page) {
    this.page = page;
    // The Habits page body h2 ("The practices you tend to.") — stable and unique.
    // The AppShell top-bar h1 reads "The practices you track." (for /habits),
    // which matches /practices/i too, so we disambiguate via level 2.
    this.pageHeading = page.getByRole('heading', { level: 2, name: /practices you tend to/i });
    // Modal — role="dialog" for the generic create/edit modal, role="alertdialog" for delete
    this.modal = page.getByRole('dialog').or(page.locator('.bg-paper.border.border-rule').first());
    // Inputs resolved by label text rather than brittle placeholder
    this.nameInput = page.getByLabel(/^\/ A Name$/);
    this.categorySelect = page.getByLabel(/^\/ D Category$/);
    this.saveButton = page.getByRole('button', { name: /^(create task|save changes)$/i });
    this.cancelButton = page.getByRole('button', { name: /^cancel$/i }).first();
    // Inline form error (role="alert")
    this.errorMessage = page.getByRole('alert');
    // CTAs
    this.newTaskTopBarButton = page.getByRole('link', { name: /^new task$/i });
    this.newTaskHeaderButton = page.getByRole('button', { name: /^new task$/i });
    this.emptyStateCta = page.getByRole('button', { name: /create your first task/i });
    this.addAnotherTile = page.getByRole('button', { name: /add another/i });
  }

  async goto() {
    await this.page.goto('/habits');
  }

  async openCreateModal() {
    // Prefer the page header button; fall back to the empty-state CTA
    const header = this.newTaskHeaderButton;
    const empty = this.emptyStateCta;
    const tile = this.addAnotherTile;

    if (await header.count()) {
      await header.first().click();
    } else if (await empty.count()) {
      await empty.first().click();
    } else {
      await tile.first().click();
    }
  }

  async createHabit(name: string, category?: string, frequency?: string) {
    await this.openCreateModal();
    await this.nameInput.fill(name);
    if (category) await this.categorySelect.selectOption(category);
    if (frequency) {
      await this.page.getByRole('button', { name: new RegExp(`^${frequency}$`, 'i') }).click();
    }
    await this.saveButton.click();
  }

  /** Edit button for the nth habit card (0-indexed) */
  editButtonFor(name: string) {
    return this.page.getByRole('button', { name: `Edit ${name}` });
  }

  deleteButtonFor(name: string) {
    return this.page.getByRole('button', { name: `Delete ${name}` });
  }

  confirmDeleteButton() {
    return this.page.getByRole('alertdialog').getByRole('button', { name: /^delete$/i });
  }

  cancelDeleteButton() {
    return this.page.getByRole('alertdialog').getByRole('button', { name: /^cancel$/i });
  }
}
