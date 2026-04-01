import { Page, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly loginTab: Locator;
  readonly signupTab: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly usernameInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly googleButton: Locator;
  readonly githubButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginTab = page.getByRole('button', { name: 'LOGIN' });
    this.signupTab = page.getByRole('button', { name: 'SIGN UP' });
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.usernameInput = page.locator('input[name="username"]');
    this.submitButton = page.locator('form button[type="submit"]');
    this.errorMessage = page.locator('.bg-error-container\\/20');
    this.googleButton = page.getByRole('button', { name: /google/i });
    this.githubButton = page.getByRole('button', { name: /github/i });
  }

  async goto() {
    await this.page.goto('/auth');
  }

  async login(email: string, password: string) {
    await this.loginTab.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async signup(username: string, email: string, password: string) {
    await this.signupTab.click();
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
