import { Page, Locator } from '@playwright/test';

export class AnalyticsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly performanceBoardHeading: Locator;
  readonly performanceBoardEyebrow: Locator;

  constructor(page: Page) {
    this.page = page;
    // Hero eyebrow on the Analytics page — exact match to avoid colliding
    // with the section eyebrow (which appears twice with longer text).
    this.heading = page.getByText('/ 03 Analytics — performance report', { exact: true });
    // Performance Board section header text — stable copy, scoped to section 05
    this.performanceBoardHeading = page.getByRole('heading', {
      name: /Performance.*board.*professional view/i,
    });
    this.performanceBoardEyebrow = page.getByText(/05A Day of week/i);
  }

  async goto() {
    await this.page.goto('/analytics');
  }

  periodButton(label: '7 days' | '30 days' | '90 days') {
    return this.page.getByRole('button', { name: label, exact: true });
  }

  sortHeader(label: 'Score' | 'Rate' | 'Consistency' | 'Trend' | 'Last active') {
    return this.page.getByRole('cell', { name: new RegExp(`^${label}`, 'i') });
  }
}
