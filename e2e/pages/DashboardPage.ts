import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly completionCount: Locator;
  readonly velocityDisplay: Locator;
  readonly streakMultiplier: Locator;
  readonly initializeProtocolLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText("TODAY'S PROTOCOL");
    this.completionCount = page.locator('text=/ COMPLETE/');
    this.velocityDisplay = page.getByText('CURRENT VELOCITY');
    this.streakMultiplier = page.getByText('STREAK MULTIPLIER');
    this.initializeProtocolLink = page.getByRole('link', { name: 'Initialise Protocol' });
  }

  async goto() {
    await this.page.goto('/');
  }

  habitRow(name: string) {
    return this.page.locator(`h4:has-text("${name}")`).locator('..');
  }

  habitToggle(name: string) {
    // The entire row is a role="button" with aria-label "Mark complete: <name>" or "Completed: <name>"
    return this.page.getByRole('button', { name: new RegExp(`(Mark complete|Completed): ${name}`, 'i') });
  }

  habitNotesToggle(name: string) {
    return this.page
      .locator(`h4:has-text("${name}")`)
      .locator('xpath=ancestor::div[contains(@class,"group")]')
      .getByRole('button', { name: /(show|hide) notes/i });
  }

  async toggleHabit(name: string) {
    await this.habitToggle(name).click();
  }

  notesInput(habitId: number) {
    return this.page.locator(`input[placeholder="Log execution notes…"]`).first();
  }
}
