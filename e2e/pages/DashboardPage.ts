import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly topBarTitle: Locator;
  readonly heroHeading: Locator;
  readonly todaysPracticeHeading: Locator;
  readonly topStreaksHeading: Locator;
  readonly currentStreakLabel: Locator;
  readonly weeklyAverageLabel: Locator;
  readonly createTaskLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // Top-bar h1 rendered by AppShell for the "/" route resolves to
    // "Today in brief." via the page meta map.
    this.topBarTitle = page.getByRole('heading', { name: /today in brief/i, level: 1 });
    // Hero greeting on the dashboard body ("Good morning, ready for today?" etc.)
    this.heroHeading = page.getByRole('heading', { name: /ready for today/i, level: 2 });
    // Section headings (h3) — stable, in-copy text
    this.todaysPracticeHeading = page.getByRole('heading', { name: /today's practice/i, level: 3 });
    this.topStreaksHeading = page.getByText('Top streaks', { exact: false });
    // KPI cell labels
    this.currentStreakLabel = page.getByText('Current streak', { exact: true });
    this.weeklyAverageLabel = page.getByText('Weekly average', { exact: true });
    // Empty-state CTA
    this.createTaskLink = page.getByRole('link', { name: /create a task/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  /** Habit row toggle by name. aria-label is "Mark complete: <name>" or "Completed: <name>" */
  habitToggle(name: string) {
    return this.page.getByRole('button', {
      name: new RegExp(`(mark complete|completed):\\s+${escapeRegex(name)}`, 'i'),
    });
  }

  /** Notes expand/collapse button for a habit row */
  habitNotesToggle(name: string) {
    return this.page.getByRole('button', {
      name: new RegExp(`(show|hide) notes`, 'i'),
    });
  }

  async toggleHabit(name: string) {
    await this.habitToggle(name).click();
  }

  /** Notes input (placeholder is "A line or two…") */
  get notesInput() {
    return this.page.getByPlaceholder('A line or two…');
  }

  /** Save button inside the notes drawer */
  get notesSaveButton() {
    return this.page.getByRole('button', { name: /^save$/i });
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
